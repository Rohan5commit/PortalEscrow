'use client';

import { CONTRACT_ADDRESS } from '@/lib/config';
import { fromPlanck, shortAddress } from '@/lib/format';
import { usePortal } from './PortalProvider';

export function WalletBar() {
  const { account, accounts, balance, busy, chain, changeAccount, connect, contractReady, error, isPortaldot } = usePortal();
  return (
    <div className="rounded-2xl border border-portal-line bg-portal-panel p-4 shadow-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Portaldot network state</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 ${isPortaldot ? 'bg-portal-good/15 text-portal-good' : 'bg-portal-bad/15 text-portal-bad'}`}>{isPortaldot ? 'Portaldot ready' : 'Wrong network'}</span>
            <span className="rounded-full bg-slate-800 px-3 py-1">{chain}</span>
            <span className={`rounded-full px-3 py-1 ${contractReady ? 'bg-portal-good/15 text-portal-good' : 'bg-portal-warn/15 text-portal-warn'}`}>{contractReady ? 'Contract configured' : 'Set contract env'}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {account && <select className="rounded-xl border border-portal-line bg-slate-950 px-3 py-2 text-sm" value={account.address} onChange={(e) => changeAccount(e.target.value)}>{accounts.map((a) => <option key={a.address} value={a.address}>{a.meta.name || shortAddress(a.address)}</option>)}</select>}
          <div className="text-right text-sm"><p className="font-mono">{shortAddress(account?.address)}</p><p className="text-slate-400">{fromPlanck(balance)}</p></div>
          <button disabled={busy} onClick={connect} className="rounded-xl bg-portal-pot px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">{account ? 'Reconnect' : 'Connect wallet'}</button>
        </div>
      </div>
      {!isPortaldot && <p className="mt-3 rounded-xl border border-portal-bad/40 bg-portal-bad/10 p-3 text-sm text-portal-bad">Switch your wallet RPC to the Portaldot-compatible network. Current RPC target: {process.env.NEXT_PUBLIC_PORTALDOT_RPC || 'not configured'}.</p>}
      {!CONTRACT_ADDRESS && <p className="mt-3 rounded-xl border border-portal-warn/40 bg-portal-warn/10 p-3 text-sm text-portal-warn">Frontend is ready, but NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT must point to the deployed PortalEscrow contract before live transactions.</p>}
      {error && <p className="mt-3 rounded-xl border border-portal-bad/40 bg-portal-bad/10 p-3 text-sm text-portal-bad">{error}</p>}
    </div>
  );
}
