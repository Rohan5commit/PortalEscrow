# PortalEscrow

**Portaldot-native milestone escrow for freelancers and clients.**

PortalEscrow lets clients fund freelance milestones on Portaldot, release payments transparently, and protect both sides with simple on-chain escrow logic.

## Why it matters

Freelancers need proof that funds are locked before they begin work. Clients need control over when each deliverable is paid. PortalEscrow solves the core trust gap with a focused smart contract workflow: fund, submit, release, or timeout-claim.

## Portaldot-native features

- Default RPC is `wss://mainnet.portaldot.io`, matching the Portaldot developer chain info.
- POT display uses 14 decimals, matching Portaldot token metadata.
- ink! smart contract designed for a Substrate/Portaldot-compatible contracts environment.
- Wallet-signed transactions through Polkadot/Substrate tooling.
- POT is used for gas in live contract interactions.
- Escrow funding and milestone releases are enforced on-chain.
- No hidden admin role or custodial backend.

## Tech stack

- **Contract:** Rust, ink!, SCALE codec.
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS.
- **Wallet/RPC:** `@polkadot/api`, `@polkadot/api-contract`, `@polkadot/extension-dapp`.
- **Hosting:** Vercel-ready frontend.

## Contract overview

The `PortalEscrow` contract supports:

- `create_escrow`: client creates a job with freelancer, total amount, milestone list, and timeout.
- `fund_escrow`: client transfers the exact total into escrow.
- `submit_milestone`: freelancer marks a funded milestone as submitted.
- `approve_milestone`: client releases that milestone amount to freelancer.
- `claim_timeout`: freelancer claims after `submitted_at + claim_timeout_ms`.
- Dashboard reads via `get_created_by`, `get_assigned_to`, and `get_escrow`.

Milestone state machine:

```text
Created → Funded → Submitted → Released
Created → Funded → Submitted → TimeoutClaimed
```

Safety checks include role restrictions, exact milestone-total validation, exact funding validation, double-release prevention, timeout enforcement, and invalid-transition rejection.

## Repository structure

```text
contracts/portal-escrow/   ink! escrow contract and tests
app/                       Next.js frontend
docs/contracts/            generated ink! .contract, .json metadata, and .wasm artifacts
docs/                      architecture, setup, demo, Devpost, credits, judging notes
scripts/                   deployment helpers
README.md                  project guide
```

## Live frontend deployment

The frontend is Vercel-ready from the repository root via `vercel.json` and from `app/` directly. Deploy with:

```bash
VERCEL_TOKEN=your_vercel_token npx vercel@latest --prod --yes --token "$VERCEL_TOKEN"
```

Set `NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT` in Vercel after deploying with a funded Portaldot account so the live app sends transactions to the final on-chain address. The generated contract metadata is already wired into the app.

> Deployment note: the provided temporary Vercel token was rejected by Vercel CLI as invalid during this handoff, so no new production URL could be created from this environment. The local production build passes and the project is configured for one-command Vercel deployment once a valid token is supplied.

## Local development

### Contract tests

```bash
cargo test -p portal_escrow
```

### Frontend

```bash
cd app
npm install
npm run dev
```

## Portaldot deploy/test flow

1. Install `cargo-contract` and add the Wasm target.
2. Build the contract:

```bash
cargo contract build --manifest-path contracts/portal-escrow/Cargo.toml --release
```

3. Deploy to Portaldot:

```bash
PORTALDOT_DEPLOYER_SURI="..." \
NEXT_PUBLIC_PORTALDOT_RPC="wss://mainnet.portaldot.io" \
./scripts/deploy-portaldot.sh
```

4. Configure frontend env:

```bash
NEXT_PUBLIC_PORTALDOT_RPC=wss://mainnet.portaldot.io
NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT=YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_PORTALDOT_CHAIN_HINT=Portaldot
NEXT_PUBLIC_POT_DECIMALS=14
NEXT_PUBLIC_DEMO_FREELANCER=YOUR_FREELANCER_ADDRESS
```

5. Run or deploy the frontend.

### Current deployment status

- Contract artifacts were generated successfully and committed under `docs/contracts/`.
- A Portaldot mainnet deployment was attempted from this environment using `//Alice` only to validate the deployment path; Portaldot rejected it with `Inability to pay some fees`, which confirms a funded deployer SURI is required before final contract instantiation. No fake contract address is published.

## Demo flow

1. Open landing page.
2. Click **Launch App**.
3. Connect wallet and show Portaldot-ready network state.
4. Create the prefilled 3-milestone demo escrow.
5. Fund the escrow.
6. Switch to freelancer wallet and submit milestone 1.
7. Switch to client wallet and approve/release milestone 1.
8. Submit milestone 2.
9. Wait for the short demo timeout and claim via timeout path.
10. End on dashboard showing locked and released totals.

See `docs/demo-script.md` for a screen-by-screen script.

## Known limitations

- Full production dispute arbitration is intentionally out of scope.
- Frontend event history is optimized for demo summaries; production indexing would use a dedicated indexer.
- Evidence file storage is not included in the MVP.

## Future work

- Verified contract artifact publishing.
- Optional IPFS evidence links for submissions.
- Client reminder notifications.
- Opt-in dispute escalation.
- Multi-party agency workflows after the core MVP is validated.
