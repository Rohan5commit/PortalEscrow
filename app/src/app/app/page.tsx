'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EventFeed } from '@/components/EventFeed';
import { StatusBadge } from '@/components/StatusBadge';
import { WalletBar } from '@/components/WalletBar';
import { usePortal } from '@/components/PortalProvider';
import { demoEscrow } from '@/lib/demoData';
import { fromPlanck, toPlanck } from '@/lib/format';
import type { EscrowView } from '@/lib/types';

export default function AppPage() {
  const portal = usePortal();
  const [escrows, setEscrows] = useState<EscrowView[]>([]);
  const [form, setForm] = useState(demoEscrow);
  const [milestones, setMilestones] = useState(demoEscrow.milestones);
  const [manualId, setManualId] = useState('1');

  async function refresh() {
    try { setEscrows(await portal.loadEscrows()); } catch { /* contract can be configured after deploy */ }
  }
  useEffect(() => { if (portal.contractReady && portal.account) refresh(); }, [portal.contractReady, portal.account]);

  const totals = useMemo(() => {
    const locked = escrows.reduce((sum, e) => sum + BigInt(e.lockedAmount || '0'), 0n).toString();
    const released = escrows.reduce((sum, e) => sum + BigInt(e.releasedAmount || '0'), 0n).toString();
    return { locked, released };
  }, [escrows]);

  async function create() {
    await portal.createEscrow({ ...form, milestones });
    await refresh();
  }

  return <main className="mx-auto max-w-6xl space-y-6 px-5 py-8"><WalletBar /><section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-portal-line bg-portal-panel p-5"><p className="text-sm text-slate-400">Current locked</p><p className="mt-2 text-3xl font-black">{fromPlanck(totals.locked)}</p></div><div className="rounded-2xl border border-portal-line bg-portal-panel p-5"><p className="text-sm text-slate-400">Released</p><p className="mt-2 text-3xl font-black">{fromPlanck(totals.released)}</p></div><div className="rounded-2xl border border-portal-line bg-portal-panel p-5"><p className="text-sm text-slate-400">Next action</p><p className="mt-2 text-xl font-bold">Create → fund → submit → release</p></div></section><section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="rounded-2xl border border-portal-line bg-portal-panel p-5"><h2 className="text-2xl font-bold">Create demo escrow</h2><p className="mt-1 text-sm text-slate-400">Prefilled for the hackathon demo. Submit sends a real contract transaction when the address env is set.</p><div className="mt-5 grid gap-3"><input className="rounded-xl border border-portal-line bg-slate-950 p-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Job title" /><input className="rounded-xl border border-portal-line bg-slate-950 p-3 font-mono" value={form.freelancer} onChange={(e) => setForm({ ...form, freelancer: e.target.value })} placeholder="Freelancer wallet address" /><textarea className="rounded-xl border border-portal-line bg-slate-950 p-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" /><div className="grid gap-3 md:grid-cols-2"><input className="rounded-xl border border-portal-line bg-slate-950 p-3" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="Total POT" /><input className="rounded-xl border border-portal-line bg-slate-950 p-3" value={form.claimTimeoutMinutes} onChange={(e) => setForm({ ...form, claimTimeoutMinutes: e.target.value })} placeholder="Timeout minutes" /></div>{milestones.map((m, i) => <div key={i} className="grid gap-3 md:grid-cols-[1fr_120px]"><input className="rounded-xl border border-portal-line bg-slate-950 p-3" value={m.title} onChange={(e) => setMilestones(milestones.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} /><input className="rounded-xl border border-portal-line bg-slate-950 p-3" value={m.amount} onChange={(e) => setMilestones(milestones.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} /></div>)}<button onClick={create} disabled={portal.busy} className="rounded-xl bg-portal-pot px-5 py-3 font-bold text-slate-950 disabled:opacity-60">Create escrow on Portaldot</button></div><div className="mt-4 rounded-xl bg-slate-950 p-3 text-sm text-slate-400">After create, open the escrow id from the event or enter it here: <input value={manualId} onChange={(e) => setManualId(e.target.value)} className="ml-2 w-20 rounded border border-portal-line bg-portal-bg p-1" /> <Link className="text-portal-pot" href={`/escrow/${manualId}`}>Open detail</Link></div></div><EventFeed /></section><section className="grid gap-6 lg:grid-cols-2"><JobList title="Jobs created by me" account={portal.account?.address} escrows={escrows.filter((e) => e.client === portal.account?.address)} /><JobList title="Jobs assigned to me" account={portal.account?.address} escrows={escrows.filter((e) => e.freelancer === portal.account?.address)} /></section></main>;
}

function JobList({ title, escrows }: { title: string; account?: string; escrows: EscrowView[] }) {
  return <div className="rounded-2xl border border-portal-line bg-portal-panel p-5"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 space-y-3">{escrows.length ? escrows.map((e) => <Link key={e.id} href={`/escrow/${e.id}`} className="block rounded-xl border border-portal-line bg-slate-950/70 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{e.title}</p><p className="text-sm text-slate-400">Locked {fromPlanck(e.lockedAmount)} · Released {fromPlanck(e.releasedAmount)}</p></div><StatusBadge state={e.status} /></div></Link>) : <p className="rounded-xl border border-dashed border-portal-line p-4 text-sm text-slate-400">No on-chain jobs loaded yet.</p>}</div></div>;
}
