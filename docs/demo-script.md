# PortalEscrow 2–4 Minute Demo Script

## Setup before recording

- Deploy the `portal_escrow` ink! contract to Portaldot.
- Set `NEXT_PUBLIC_PORTALDOT_RPC`, `NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT`, and `NEXT_PUBLIC_POT_DECIMALS` in Vercel.
- Prepare two wallet accounts: one client and one freelancer.
- Fund the client with enough POT for escrow amount and gas.
- Use the prefilled 3-milestone demo form with a 2-minute timeout, or set an even shorter timeout on a local/dev chain.

## Script

### 0:00–0:20 — Landing page

Click through the landing page.

Say: “PortalEscrow is milestone escrow for freelancers and clients, built natively on Portaldot. A client funds milestones on-chain, a freelancer submits work, and payment is released milestone by milestone.”

### 0:20–0:45 — Connect wallet

Click **Launch App**, connect the client wallet, and show:

- Portaldot-ready network badge.
- Wallet address.
- POT balance.
- Contract configured badge.

Say: “This is not a mock. The frontend connects through a Substrate wallet and uses POT for transaction gas.”

### 0:45–1:15 — Create escrow

Use the prefilled job:

- Title: Portaldot landing page build.
- Freelancer: demo freelancer address.
- Total: 9 POT.
- Milestones: 2 POT, 4 POT, 3 POT.
- Timeout: 2 minutes.

Click **Create escrow on Portaldot**.

Say: “The contract validates that milestone amounts add up exactly to the declared total.”

### 1:15–1:45 — Fund escrow

Open the escrow detail page and click **Fund escrow**.

Say: “The client funds the escrow with the exact total amount. Each milestone moves from Created to Funded and locked value becomes visible.”

### 1:45–2:20 — Submit and release milestone 1

Switch to freelancer wallet. Click **Submit work** for milestone 1. Switch back to client. Click **Approve + release**.

Say: “Only the assigned freelancer can submit. Only the client can release. The contract prevents double release and pays exactly the milestone amount.”

### 2:20–3:10 — Timeout fallback

Switch to freelancer, submit milestone 2, then show the countdown. If using a short demo timeout, wait until claimable and click **Claim timeout**.

Say: “If the client disappears after submission, the freelancer can claim only after the deterministic timeout. This protects the freelancer without giving anyone admin power.”

### 3:10–3:40 — Dashboard wrap

Return to the dashboard. Show locked/released totals and recent event summaries.

Say: “PortalEscrow is a focused MVP: real ink! contract logic, a connected frontend, POT gas, and a clean freelance payment workflow that can be deployed and used on Portaldot.”
