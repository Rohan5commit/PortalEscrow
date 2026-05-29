export type MilestoneState = 'Created' | 'Funded' | 'Submitted' | 'Released' | 'TimeoutClaimed';
export type EscrowStatus = 'Created' | 'Funded' | 'InProgress' | 'Completed';

export interface MilestoneInput { title: string; amount: string; }
export interface MilestoneView { title: string; amount: string; state: MilestoneState; submittedAt?: number; releasedAt?: number; claimedByTimeout: boolean; }
export interface EscrowView {
  id: string;
  client: string;
  freelancer: string;
  title: string;
  description: string;
  totalAmount: string;
  lockedAmount: string;
  releasedAmount: string;
  claimTimeoutMs: number;
  createdAt: number;
  fundedAt?: number;
  status: EscrowStatus;
  milestones: MilestoneView[];
}
