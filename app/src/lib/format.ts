import { BN, BN_ONE } from '@polkadot/util';
import { POT_DECIMALS } from './config';

export function toPlanck(pot: string): string {
  const [whole, frac = ''] = pot.trim().split('.');
  const cleanFrac = (frac + '0'.repeat(POT_DECIMALS)).slice(0, POT_DECIMALS);
  return new BN(whole || '0').mul(BN_ONE.mul(new BN(10).pow(new BN(POT_DECIMALS)))).add(new BN(cleanFrac || '0')).toString();
}

export function fromPlanck(value: string | number | bigint): string {
  const raw = new BN(value.toString());
  const base = new BN(10).pow(new BN(POT_DECIMALS));
  const whole = raw.div(base).toString();
  const frac = raw.mod(base).toString().padStart(POT_DECIMALS, '0').slice(0, 4).replace(/0+$/, '');
  return frac ? `${whole}.${frac} POT` : `${whole} POT`;
}

export function shortAddress(address?: string): string {
  return address ? `${address.slice(0, 6)}…${address.slice(-6)}` : 'Not connected';
}

export function msToHuman(ms: number): string {
  if (ms < 60_000) return `${Math.ceil(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.ceil(ms / 60_000)}m`;
  return `${Math.ceil(ms / 3_600_000)}h`;
}
