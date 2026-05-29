import { DEMO_FREELANCER } from './config';

export const demoEscrow = {
  title: 'Portaldot landing page build',
  freelancer: DEMO_FREELANCER,
  description: 'Design, implement, and ship a hackathon landing page with wallet-ready polish.',
  totalAmount: '9',
  claimTimeoutMinutes: '2',
  milestones: [
    { title: 'Wireframe + copy', amount: '2' },
    { title: 'Frontend implementation', amount: '4' },
    { title: 'Final QA + handoff', amount: '3' }
  ]
};

export const demoEvents = [
  'Escrow created for 9 POT across 3 milestones',
  'Client funded escrow on Portaldot; POT gas paid by wallet',
  'Freelancer submitted milestone 1',
  'Client released milestone 1 payment',
  'Milestone 2 becomes timeout-claimable after short demo timer'
];
