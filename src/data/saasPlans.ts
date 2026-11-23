import { BillingInvoice, PlanTier, SaaSPlanSpec, TeamSeat } from '../types';

export const SAAS_PLANS: Record<PlanTier, SaaSPlanSpec> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    targetAudience: 'For single-location restaurants, retailers & SMEs',
    monthlyPrice: 49,
    annualMonthlyPrice: 39,
    aiCreditsLimit: 40,
    maxWorkspaces: 1,
    maxTeamSeats: 2,
    whiteLabelPortal: false,
    blogRepurposer: true,
    audienceReplyAI: true,
    csvExport: true,
    highlights: [
      '1 Brand Workspace (LinkedIn + Facebook)',
      '40 AI post & calendar generations / month',
      'Blog-to-Social Repurposer & Hashtag Studio',
      'Mobile, Tablet & Desktop PWA App',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    targetAudience: 'For multi-location brands & active marketing teams',
    monthlyPrice: 129,
    annualMonthlyPrice: 99,
    aiCreditsLimit: 250,
    maxWorkspaces: 5,
    maxTeamSeats: 6,
    whiteLabelPortal: false,
    blogRepurposer: true,
    audienceReplyAI: true,
    csvExport: true,
    highlights: [
      'Up to 5 Brand Workspaces',
      '250 AI generations / month',
      'Automated Audience Engagement Replies',
      '6 Team & Client Reviewer Seats',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency Scale',
    targetAudience: 'For marketing agencies selling social management to clients',
    monthlyPrice: 299,
    annualMonthlyPrice: 239,
    aiCreditsLimit: 1500,
    maxWorkspaces: 25,
    maxTeamSeats: 25,
    whiteLabelPortal: true,
    blogRepurposer: true,
    audienceReplyAI: true,
    csvExport: true,
    highlights: [
      'Up to 25 Client Brand Workspaces',
      '1,500 AI generations / month',
      'White-Label Client Approval Portal',
      '25 Team Strategists & Client Reviewers',
    ],
  },
};

export const SAAS_PLAN_LIST: SaaSPlanSpec[] = [
  SAAS_PLANS.starter,
  SAAS_PLANS.growth,
  SAAS_PLANS.agency,
];

export const INITIAL_TEAM_SEATS: TeamSeat[] = [
  {
    id: 'seat-1',
    ownerId: 'demo',
    name: 'Workspace Owner',
    email: 'founder@northstardigital.co',
    role: 'Owner',
    status: 'Active',
  },
  {
    id: 'seat-2',
    ownerId: 'demo',
    name: 'Maya Lin',
    email: 'maya@northstardigital.co',
    role: 'Strategist',
    status: 'Active',
  },
  {
    id: 'seat-3',
    ownerId: 'demo',
    name: 'Marco Bellini (Osteria Verde)',
    email: 'marco@osteriaverde.com',
    role: 'Client Reviewer',
    status: 'Active',
  },
];

export const INITIAL_INVOICES: BillingInvoice[] = [
  {
    id: 'inv-2026-11',
    ownerId: 'demo',
    invoiceNumber: 'CAD-2026-1104',
    planName: 'Agency Scale (Monthly)',
    amountUsd: 299,
    billingDate: '2026-11-01',
    status: 'Paid',
  },
  {
    id: 'inv-2026-10',
    ownerId: 'demo',
    invoiceNumber: 'CAD-2026-1004',
    planName: 'Agency Scale (Monthly)',
    amountUsd: 299,
    billingDate: '2026-10-01',
    status: 'Paid',
  },
];
