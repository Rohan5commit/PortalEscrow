# Devpost Copy

## Project title

PortalEscrow

## Tagline

Portaldot-native milestone escrow for freelancers and clients.

## Problem

Freelancers often start work before payment is secure, while clients hesitate to pay the full amount before delivery. Traditional escrow adds platform overhead and opaque rules.

## Solution

PortalEscrow lets a client create a freelance job, split payment into milestones, fund the escrow on-chain with POT, and release each milestone after work is submitted. If the client disappears, the freelancer can claim submitted work after a predefined timeout.

## How it works

1. Client creates an escrow with freelancer address, total amount, milestone titles/amounts, and timeout.
2. Client funds the escrow on Portaldot.
3. Freelancer submits a funded milestone.
4. Client approves and releases payment, or freelancer claims after timeout.
5. Dashboard shows locked funds, released funds, and next action.

## Why Portaldot

Portaldot gives the app a native Substrate-style environment for wallet accounts, ink! contracts, and POT gas. The product benefits from transparent smart contract rules and visible transaction confirmations.

## Challenges

The main challenge was keeping the MVP real without bloating scope. We prioritized contract correctness, state transitions, role checks, and demo reliability over extra marketplace features.

## What we’re proud of

- Real ink! escrow logic with tests.
- A clear state machine judges can audit quickly.
- Wallet-connected frontend designed around a 2–4 minute demo.
- Timeout fallback that protects freelancers without admin intervention.

## What’s next

- Deploy verified metadata and contract artifacts.
- Add optional evidence links for submitted work.
- Add notifications for client review deadlines.
- Add lightweight dispute escalation as a separate, opt-in flow.
