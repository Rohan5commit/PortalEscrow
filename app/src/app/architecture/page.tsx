import Link from 'next/link';

const cards = [
  ['Why Portaldot', 'Freelance escrow benefits from low-friction Substrate-style accounts, deterministic contract execution, and POT gas that is visible in every wallet-confirmed transaction.'],
  ['On-chain logic', 'Escrow roles, milestone totals, funding, submissions, releases, timeout claims, locked/released balances, and state transitions live in the ink! contract.'],
  ['Timeout protection', 'After a freelancer submits work, the contract records submitted_at. If now >= submitted_at + claim_timeout_ms, only the freelancer can claim exactly that milestone amount.'],
  ['Practical MVP', 'No admin key, no tokenomics, no arbitration bloat. The demo proves a client-funded escrow can move POT milestone by milestone with auditable rules.']
];

export default function ArchitecturePage() {
  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm font-semibold uppercase tracking-[0.35em] text-portal-pot">Judge-facing architecture</p><h1 className="mt-3 text-4xl font-black">PortalEscrow is small, auditable, and Portaldot-native.</h1><div className="mt-8 grid gap-4 md:grid-cols-2">{cards.map(([title, body]) => <div key={title} className="rounded-2xl border border-portal-line bg-portal-panel p-6"><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 text-slate-300">{body}</p></div>)}</div><section className="mt-8 rounded-2xl border border-portal-line bg-portal-panel p-6"><h2 className="text-2xl font-bold">State machine</h2><p className="mt-3 text-slate-300">Created → Funded → Submitted → Released, or Created → Funded → Submitted → TimeoutClaimed. The contract rejects double releases, early timeout claims, wrong callers, unfunded submissions, and milestone totals that do not equal the declared escrow amount.</p><div className="mt-5 flex flex-wrap gap-3 text-sm">{['Create escrow', 'Fund escrow', 'Submit milestone', 'Approve release', 'Timeout claim'].map((s) => <span key={s} className="rounded-full bg-slate-950 px-4 py-2">{s}</span>)}</div></section><div className="mt-8 flex gap-3"><Link href="/app" className="rounded-xl bg-portal-pot px-5 py-3 font-bold text-slate-950">Launch App</Link><a href="/docs/architecture.md" className="rounded-xl border border-portal-line px-5 py-3 font-bold">Read docs</a></div></main>;
}
