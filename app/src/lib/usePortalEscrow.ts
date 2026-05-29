'use client';

import { useCallback, useMemo, useState } from 'react';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { BN } from '@polkadot/util';
import { CONTRACT_ADDRESS, PORTALDOT_CHAIN_HINT, PORTALDOT_RPC } from './config';
import { contractMetadata } from './contractMetadata';
import { toPlanck } from './format';
import type { EscrowStatus, EscrowView, MilestoneInput, MilestoneState } from './types';

type Api = import('@polkadot/api').ApiPromise;
type ContractPromise = import('@polkadot/api-contract').ContractPromise;

function gasLimit(api: Api): any {
  const weightV2 = { refTime: new BN('8000000000'), proofSize: new BN('200000') };
  try {
    return api.registry.createType('WeightV2', weightV2);
  } catch {
    return api.registry.createType('Weight', new BN('8000000000'));
  }
}

function unwrapCodec(value: any): any {
  const json = value?.toJSON ? value.toJSON() : value;
  if (json && typeof json === 'object') {
    if ('ok' in json) return unwrapCodec(json.ok);
    if ('some' in json) return unwrapCodec(json.some);
    if ('Ok' in json) return unwrapCodec(json.Ok);
    if ('Some' in json) return unwrapCodec(json.Some);
  }
  return json;
}

function normalizeVariant<T extends string>(value: any, fallback: T): T {
  const unwrapped = unwrapCodec(value);
  if (typeof unwrapped === 'string') return (unwrapped.charAt(0).toUpperCase() + unwrapped.slice(1)) as T;
  if (unwrapped && typeof unwrapped === 'object') {
    const key = Object.keys(unwrapped)[0];
    if (key) return (key.charAt(0).toUpperCase() + key.slice(1)) as T;
  }
  return fallback;
}

function normalizeEscrow(id: string, raw: any): EscrowView {
  const value = unwrapCodec(raw) || {};
  return {
    id,
    client: value.client || '',
    freelancer: value.freelancer || '',
    title: value.title || `Escrow #${id}`,
    description: value.description || '',
    totalAmount: String(value.totalAmount || value.total_amount || 0),
    lockedAmount: String(value.lockedAmount || value.locked_amount || 0),
    releasedAmount: String(value.releasedAmount || value.released_amount || 0),
    claimTimeoutMs: Number(value.claimTimeoutMs || value.claim_timeout_ms || 0),
    createdAt: Number(value.createdAt || value.created_at || 0),
    fundedAt: value.fundedAt || value.funded_at || undefined,
    status: normalizeVariant<EscrowStatus>(value.status, 'Created'),
    milestones: (value.milestones || []).map((m: any) => ({
      title: m.title,
      amount: String(m.amount || 0),
      state: normalizeVariant<MilestoneState>(m.state, 'Created'),
      submittedAt: unwrapCodec(m.submittedAt || m.submitted_at) || undefined,
      releasedAt: unwrapCodec(m.releasedAt || m.released_at) || undefined,
      claimedByTimeout: Boolean(m.claimedByTimeout || m.claimed_by_timeout)
    }))
  };
}

export function usePortalEscrow() {
  const [api, setApi] = useState<Api | null>(null);
  const [contract, setContract] = useState<ContractPromise | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [account, setAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [balance, setBalance] = useState('0');
  const [chain, setChain] = useState('Disconnected');
  const [events, setEvents] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isPortaldot = useMemo(() => chain.toLowerCase().includes(PORTALDOT_CHAIN_HINT.toLowerCase()) || PORTALDOT_RPC.toLowerCase().includes('portal'), [chain]);

  const pushEvent = useCallback((event: string) => setEvents((items) => [event, ...items].slice(0, 8)), []);

  const connect = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [{ ApiPromise, WsProvider }, { ContractPromise }, { web3Accounts, web3Enable }] = await Promise.all([
        import('@polkadot/api'), import('@polkadot/api-contract'), import('@polkadot/extension-dapp')
      ]);
      const extensions = await web3Enable('PortalEscrow');
      if (!extensions.length) throw new Error('Install or enable a Substrate wallet extension.');
      const all = await web3Accounts();
      if (!all.length) throw new Error('No wallet accounts found.');
      const provider = new WsProvider(PORTALDOT_RPC);
      const nextApi = await ApiPromise.create({ provider });
      const chainName = (await nextApi.rpc.system.chain()).toString();
      const selected = all[0];
      const { data } = await nextApi.query.system.account(selected.address) as any;
      setApi(nextApi);
      setAccounts(all);
      setAccount(selected);
      setBalance(data.free.toString());
      setChain(chainName);
      if (CONTRACT_ADDRESS) setContract(new ContractPromise(nextApi, contractMetadata as any, CONTRACT_ADDRESS));
      pushEvent(`Wallet connected on ${chainName}. Transactions spend POT gas on Portaldot.`);
    } catch (e: any) {
      setError(e.message || 'Wallet connection failed');
    } finally { setBusy(false); }
  }, [pushEvent]);

  const changeAccount = useCallback(async (address: string) => {
    const selected = accounts.find((item) => item.address === address) || null;
    setAccount(selected);
    if (api && selected) {
      const { data } = await api.query.system.account(selected.address) as any;
      setBalance(data.free.toString());
    }
  }, [accounts, api]);

  const requireReady = useCallback(() => {
    if (!api || !contract || !account) throw new Error('Connect wallet and configure NEXT_PUBLIC_PORTAL_ESCROW_CONTRACT first.');
    return { api, contract, account };
  }, [api, contract, account]);

  const signAndSend = useCallback(async (tx: any, label: string) => {
    const { account } = requireReady();
    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    setBusy(true); setError('');
    return new Promise<void>((resolve, reject) => {
      let done = false;
      tx.signAndSend(account.address, { signer: injector.signer }, (result: any) => {
        if (result.dispatchError && !done) {
          done = true;
          const message = result.dispatchError.toString();
          setError(message); setBusy(false); reject(new Error(message));
        }
        if ((result.status.isInBlock || result.status.isFinalized) && !done) {
          done = true;
          pushEvent(`${label} included in block ${result.status.asInBlock?.toString?.() || result.status.asFinalized?.toString?.()}`);
          setBusy(false); resolve();
        }
      }).catch((e: any) => { if (!done) { setError(e.message); setBusy(false); reject(e); } });
    });
  }, [pushEvent, requireReady]);

  const createEscrow = useCallback(async (input: { freelancer: string; title: string; description: string; totalAmount: string; milestones: MilestoneInput[]; claimTimeoutMinutes: string; }) => {
    const { api, contract } = requireReady();
    const milestones = input.milestones.map((m) => ({ title: m.title, amount: toPlanck(m.amount) }));
    const tx = contract.tx.createEscrow({ gasLimit: gasLimit(api) }, input.freelancer, input.title, input.description, toPlanck(input.totalAmount), milestones, Number(input.claimTimeoutMinutes) * 60_000);
    await signAndSend(tx, 'Escrow created');
  }, [requireReady, signAndSend]);

  const fundEscrow = useCallback(async (id: string, amount: string) => {
    const { api, contract } = requireReady();
    await signAndSend(contract.tx.fundEscrow({ gasLimit: gasLimit(api), value: amount }, id), 'Escrow funded');
  }, [requireReady, signAndSend]);

  const submitMilestone = useCallback(async (escrowId: string, milestoneId: number) => {
    const { api, contract } = requireReady();
    await signAndSend(contract.tx.submitMilestone({ gasLimit: gasLimit(api) }, escrowId, milestoneId), `Milestone ${milestoneId + 1} submitted`);
  }, [requireReady, signAndSend]);

  const approveMilestone = useCallback(async (escrowId: string, milestoneId: number) => {
    const { api, contract } = requireReady();
    await signAndSend(contract.tx.approveMilestone({ gasLimit: gasLimit(api) }, escrowId, milestoneId), `Milestone ${milestoneId + 1} released`);
  }, [requireReady, signAndSend]);

  const claimTimeout = useCallback(async (escrowId: string, milestoneId: number) => {
    const { api, contract } = requireReady();
    await signAndSend(contract.tx.claimTimeout({ gasLimit: gasLimit(api) }, escrowId, milestoneId), `Milestone ${milestoneId + 1} timeout claimed`);
  }, [requireReady, signAndSend]);

  const loadEscrows = useCallback(async () => {
    const { api, account, contract } = requireReady();
    const caller = account.address;
    const created = await contract.query.getCreatedBy(caller, { gasLimit: gasLimit(api) }, caller);
    const assigned = await contract.query.getAssignedTo(caller, { gasLimit: gasLimit(api) }, caller);
    const createdIds = unwrapCodec(created.output) || [];
    const assignedIds = unwrapCodec(assigned.output) || [];
    const ids = Array.from(new Set([...createdIds, ...assignedIds].map(String)));
    const escrows = await Promise.all(ids.map(async (escrowId) => {
      const res = await contract.query.getEscrow(caller, { gasLimit: gasLimit(api) }, escrowId);
      return normalizeEscrow(escrowId, res.output);
    }));
    return escrows;
  }, [requireReady]);

  return { account, accounts, api, balance, busy, chain, changeAccount, claimTimeout, connect, contractReady: Boolean(contract), createEscrow, error, events, fundEscrow, isPortaldot, loadEscrows, approveMilestone, submitMilestone };
}
