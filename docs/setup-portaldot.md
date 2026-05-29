# Portaldot Setup Guide

## Prerequisites

- Rust toolchain with `wasm32-unknown-unknown` target.
- `cargo-contract` for building and deploying ink! contracts.
- Node.js 20+ and npm.
- A Substrate-compatible browser wallet.
- POT for gas and escrow funding.

## Build contract

```bash
rustup target add wasm32-unknown-unknown
cargo install cargo-contract --locked
cargo contract build --manifest-path contracts/portal-escrow/Cargo.toml --release
```

The generated artifacts are checked in under `docs/contracts/` for judge review and copied into `app/src/contracts/portal_escrow.json` for frontend contract calls. The current generated selectors include `create_escrow = 0x547b21c4`, `fund_escrow = 0x4a61587f`, `submit_milestone = 0x7290cc38`, `approve_milestone = 0x1685376b`, and `claim_timeout = 0xaa253732`.

## Deploy contract to Portaldot

Preferred direct cargo-contract path:

```bash
cargo contract instantiate \
  --manifest-path contracts/portal-escrow/Cargo.toml \
  --constructor new \
  --suri "$PORTALDOT_DEPLOYER_SURI" \
  --url "$NEXT_PUBLIC_PORTALDOT_RPC" \
  --execute
```

Copy the deployed contract address, then set `NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT` for the frontend/Vercel deployment. If `cargo-contract` cannot open WebSocket RPC from a proxy-constrained CI environment, use the checked-in fallback:

```bash
PORTALDOT_DEPLOYER_SURI="..." NEXT_PUBLIC_PORTALDOT_RPC="wss://mainnet.portaldot.io" python3 scripts/deploy-portaldot.py
```

A funded account is required. An unfunded `//Alice` smoke-test from this environment reached Portaldot mainnet and was rejected with `Inability to pay some fees`, so the final deploy must use a wallet funded with POT.

## Frontend environment

Create `app/.env.local`:

```bash
NEXT_PUBLIC_PORTALDOT_RPC=wss://mainnet.portaldot.io
NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT=YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_PORTALDOT_CHAIN_HINT=Portaldot
NEXT_PUBLIC_POT_DECIMALS=14
NEXT_PUBLIC_DEMO_FREELANCER=YOUR_FREELANCER_ADDRESS
```

## Run frontend locally

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:3000`, connect wallet, and run the demo flow.

## Deploy frontend to Vercel

```bash
cd app
npx vercel --prod \
  --token "$VERCEL_TOKEN" \
  --env NEXT_PUBLIC_PORTALDOT_RPC="$NEXT_PUBLIC_PORTALDOT_RPC" \
  --env NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT="$NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT" \
  --env NEXT_PUBLIC_PORTALDOT_CHAIN_HINT="Portaldot" \
  --env NEXT_PUBLIC_POT_DECIMALS="14"
```
