#!/usr/bin/env python3
"""Deploy PortalEscrow to Portaldot using the documented Python SDK path.

This is a fallback for environments where cargo-contract cannot open WebSocket
connections through a corporate/CI proxy. It uses the generated ink! metadata and
Wasm artifacts checked into docs/contracts/.
"""
import json
import os
import sys
from pathlib import Path

from substrateinterface import Keypair, SubstrateInterface
from substrateinterface.contracts import ContractCode

RPC_URL = os.environ.get("NEXT_PUBLIC_PORTALDOT_RPC", "wss://mainnet.portaldot.io")
SURI = os.environ.get("PORTALDOT_DEPLOYER_SURI")
if not SURI:
    raise SystemExit("Set PORTALDOT_DEPLOYER_SURI to a funded deployer secret URI before deploying")

ROOT = Path(__file__).resolve().parents[1]
METADATA = ROOT / "docs" / "contracts" / "portal_escrow.json"
WASM = ROOT / "docs" / "contracts" / "portal_escrow.wasm"

portaldot = SubstrateInterface(url=RPC_URL, ss58_format=42, auto_discover=True)
keypair = Keypair.create_from_uri(SURI, ss58_format=42)
code = ContractCode.create_from_contract_files(
    metadata_file=str(METADATA),
    wasm_file=str(WASM),
    substrate=portaldot,
)
constructor_data = code.metadata.generate_constructor_data(name="new", args={})

# Portaldot currently exposes the pallet-contracts instantiate_with_code shape
# with endowment + compact Weight. This direct call keeps deployment aligned with
# the runtime metadata even when generic cargo-contract defaults differ.
call = portaldot.compose_call(
    call_module="Contracts",
    call_function="instantiate_with_code",
    call_params={
        "endowment": 0,
        "gas_limit": int(os.environ.get("PORTAL_ESCROW_DEPLOY_GAS", "50000000000")),
        "code": "0x" + code.wasm_bytes.hex(),
        "data": constructor_data.to_hex(),
        "salt": os.environ.get("PORTAL_ESCROW_DEPLOY_SALT", ""),
    },
)
extrinsic = portaldot.create_signed_extrinsic(call=call, keypair=keypair)
receipt = portaldot.submit_extrinsic(extrinsic, wait_for_inclusion=True)

contract_address = None
for event in receipt.triggered_events:
    value = event.value
    if value.get("event", {}).get("event_id") == "Instantiated":
        attributes = value.get("event", {}).get("attributes", [])
        if len(attributes) >= 2:
            contract_address = attributes[1].get("value")

result = {
    "success": receipt.is_success,
    "extrinsic_hash": receipt.extrinsic_hash,
    "block_hash": receipt.block_hash,
    "contract_address": contract_address,
    "error": receipt.error_message,
}
print(json.dumps(result, indent=2))
if not receipt.is_success:
    sys.exit(1)
