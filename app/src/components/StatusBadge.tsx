export function StatusBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    Created: 'bg-slate-700 text-slate-200',
    Funded: 'bg-sky-400/15 text-sky-300',
    Submitted: 'bg-amber-400/15 text-amber-300',
    Released: 'bg-emerald-400/15 text-emerald-300',
    TimeoutClaimed: 'bg-fuchsia-400/15 text-fuchsia-300',
    Completed: 'bg-emerald-400/15 text-emerald-300',
    InProgress: 'bg-amber-400/15 text-amber-300'
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[state] || map.Created}`}>{state}</span>;
}
