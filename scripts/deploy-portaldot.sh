#!/usr/bin/env bash
set -euo pipefail
: "${PORTALDOT_DEPLOYER_SURI:?Set deployer secret phrase or URI}"
: "${NEXT_PUBLIC_PORTALDOT_RPC:=wss://mainnet.portaldot.io}"

cargo contract build --manifest-path contracts/portal-escrow/Cargo.toml --release

# cargo-contract is the preferred path when the runner can open WebSocket RPCs directly.
# The Python fallback mirrors Portaldot's documented SDK deployment flow and works in
# proxy-constrained CI environments.
if cargo contract instantiate \
  --manifest-path contracts/portal-escrow/Cargo.toml \
  --constructor new \
  --suri "$PORTALDOT_DEPLOYER_SURI" \
  --url "$NEXT_PUBLIC_PORTALDOT_RPC" \
  --execute \
  --skip-confirm; then
  exit 0
fi

python3 scripts/deploy-portaldot.py
