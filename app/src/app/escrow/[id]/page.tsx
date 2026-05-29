'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EventFeed } from '@/components/EventFeed';
import { StatusBadge } from '@/components/StatusBadge';
import { WalletBar } from '@/components/WalletBar';
import { usePortal } from '@/components/PortalProvider';
import { fromPlanck, msToHuman } from '@/lib/format';
import type { EscrowView } from '@/lib/types';

export default function EscrowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const portal = usePortal();
  const [escrow, setEscrow] = useState<EscrowView | null>(null);

  async function refresh() {
    const items = await portal.loadEscrows();
    setEscrow(items.find((e) => e.id === id) || null);
  }
  useEffect(() => { if (portal.contractReady && portal.account) refresh().catch(() => undefined); }, [portal.contractReady, portal.account, id]);

  async function action(fn: () => Promise<void>) { await fn(); await refresh(); }

  return <main className="mx-auto max-w-6xl space-y-6 px-5 py-8"><WalletBar />{escrow ? <><section className="rounded-2xl border border-portal-line bg-portal-panel p-6"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="flex items-center gap-3"><h1 className="text-3xl font-black">{escrow.title}</h1><StatusBadge state={escrow.status} /></div><p className="mt-2 max-w-3xl text-slate-300">{escrow.description}</p><p className="mt-4 font-mono text-xs text-slate-400">Client {escrow.client}<br />Freelancer {escrow.freelancer}</p></div><div className="grid grid-cols-2 gap-3 text-right"><div className="rounded-xl bg-slate-950 p-4"><p className="text-sm text-slate-400">Locked</p><p className="text-xl font-bold">{fromPlanck(escrow.lockedAmount)}</p></div><div className="rounded-xl bg-slate-950 p-4"><p className="text-sm text-slate-400">Released</p><p className="text-xl font-bold">{fromPlanck(escrow.releasedAmount)}</p></div></div></div>{escrow.status === 'Created' && <button onClick={() => action(() => portal.fundEscrow(escrow.id, escrow.totalAmount))} disabled={portal.busy} className="mt-5 rounded-xl bg-portal-pot px-5 py-3 font-bold text-slate-950">Fund escrow with {fromPlanck(escrow.totalAmount)}</button>}</section><section className="grid gap-4">{escrow.milestones.map((m, i) => { const submitted = Number(m.submittedAt || 0); const elapsed = submitted ? Date.now() - submitted : 0; const remaining = Math.max(0, escrow.claimTimeoutMs - elapsed); const timeoutReady = m.state === 'Submitted' && remaining === 0; return <div key={`${m.title}-${i}`} className="rounded-2xl border border-portal-line bg-portal-panel p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex items-center gap-3"><h2 className="text-xl font-bold">Milestone {i + 1}: {m.title}</h2><StatusBadge state={timeoutReady ? 'TimeoutClaimed' : m.state} /></div><p className="mt-2 text-slate-400">Amount {fromPlanck(m.amount)} · Timeout {timeoutReady ? 'claimable now' : m.state === 'Submitted' ? msToHuman(remaining) + ' remaining' : msToHuman(escrow.claimTimeoutMs)}</p></div><div className="flex flex-wrap gap-2"><button disabled={portal.busy || m.state !== 'Funded'} onClick={() => action(() => portal.submitMilestone(escrow.id, i))} className="rounded-xl border border-portal-line px-4 py-2 disabled:opacity-40">Submit work</button><button disabled={portal.busy || m.state !== 'Submitted'} onClick={() => action(() => portal.approveMilestone(escrow.id, i))} className="rounded-xl bg-portal-good px-4 py-2 font-bold text-slate-950 disabled:opacity-40">Approve + release</button><button disabled={portal.busy || !timeoutReady} onClick={() => action(() => portal.claimTimeout(escrow.id, i))} className="rounded-xl bg-portal-warn px-4 py-2 font-bold text-slate-950 disabled:opacity-40">Claim timeout</button></div></div></div>; })}</section></> : <section className="rounded-2xl border border-portal-line bg-portal-panel p-8"><h1 className="text-2xl font-bold">Escrow #{id}</h1><p className="mt-2 text-slate-300">Connect the wallet that created or was assigned to this escrow. If the contract was just deployed, set NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT and redeploy the frontend.</p></section>}<EventFeed /></main>;
}
