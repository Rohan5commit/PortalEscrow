# PortalEscrow Architecture

PortalEscrow is a Portaldot-native milestone escrow MVP for freelancer-client work. A client creates a job, defines a freelancer, splits the total into milestones, funds the escrow with POT, and releases each milestone after submitted work is accepted. If the client disappears after submission, the freelancer can claim that specific milestone once the configured timeout elapses.

## System overview

```text
Substrate wallet → Next.js app → @polkadot/api-contract → Portaldot contracts pallet → PortalEscrow ink! contract
```

The app is intentionally frontend + contract only. There is no custodial backend and no hidden admin role.

## On-chain responsibilities

The `portal_escrow` ink! contract stores and enforces:

- Escrow client and freelancer accounts.
- Job title and short description for demo readability.
- Total escrow amount.
- Per-milestone title, amount, state, submitted timestamp, released timestamp, and timeout flag.
- Created-by and assigned-to indexes for dashboard reads.
- Funding, submit, approve/release, and timeout-claim transitions.
- Role checks and double-release prevention.

## Frontend responsibilities

The Next.js app handles:

- Wallet extension connection.
- Portaldot RPC connection and visible network state.
- POT balance display.
- Escrow creation form with demo prefill.
- Dashboard split between jobs created by me and jobs assigned to me.
- Escrow detail actions for funding, submission, release, and timeout claim.
- Recent transaction summaries for demo narration.

## Contract state machine

Milestone states are explicit:

```text
Created → Funded → Submitted → Released
Created → Funded → Submitted → TimeoutClaimed
```

Invalid transitions are rejected:

- Freelancer cannot submit before funding.
- Client cannot release before submission.
- Freelancer cannot timeout-claim before `submitted_at + claim_timeout_ms`.
- Completed milestones cannot be released or claimed again.
- Wrong callers are rejected at each privileged action.

## Why this fits a fast MVP

The design focuses on one practical workflow with obvious value. It avoids arbitration, governance, token launches, reputation systems, and multi-token complexity so the demo can prove the important thing: native Portaldot smart contract logic moving POT milestone by milestone.
