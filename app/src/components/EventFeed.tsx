'use client';

import { demoEvents } from '@/lib/demoData';
import { usePortal } from './PortalProvider';

export function EventFeed() {
  const { events } = usePortal();
  const feed = events.length ? events : demoEvents;
  return <div className="rounded-2xl border border-portal-line bg-portal-panel p-5"><h3 className="font-semibold">Demo-friendly history</h3><div className="mt-4 space-y-3">{feed.map((event, i) => <div key={`${event}-${i}`} className="rounded-xl border border-portal-line bg-slate-950/70 p-3 text-sm text-slate-300">{event}</div>)}</div></div>;
}
