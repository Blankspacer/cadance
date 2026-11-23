export type SocialPlatform = 'linkedin' | 'facebook';

export type CustomerCategory =
  | 'Marketing Agency'
  | 'Restaurant'
  | 'Retailer'
  | 'SME';

export type PostStatus =
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'needs_revision';

export type NavTab =
  | 'overview'
  | 'studio'
  | 'repurpose'
  | 'calendar'
  | 'approvals'
  | 'billing';

export type PlanTier = 'starter' | 'growth' | 'agency';
export type BillingCycle = 'monthly' | 'annual';

export interface SaaSPlanSpec {
  id: PlanTier;
  name: string;
  targetAudience: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  aiCreditsLimit: number;
  maxWorkspaces: number;
  maxTeamSeats: number;
  whiteLabelPortal: boolean;
  blogRepurposer: boolean;
  audienceReplyAI: boolean;
  csvExport: boolean;
  highlights: string[];
}

export interface TenantAccount {
  ownerId: string;
  ownerEmail: string;
  companyName: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  subscriptionStatus: 'trialing' | 'active' | 'past_due';
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  maxWorkspaces: number;
  whiteLabelName: string;
}

export interface TeamSeat {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  role: 'Owner' | 'Strategist' | 'Client Reviewer';
  status: 'Active' | 'Invited';
}

export interface BillingInvoice {
  id: string;
  ownerId: string;
  invoiceNumber: string;
  planName: string;
  amountUsd: number;
  billingDate: string;
  status: 'Paid' | 'Pending';
}

export interface BrandProfile {
  id: string;
  name: string;
  handle: string;
  category: CustomerCategory;
  industry: string;
  audience: string;
  voice: string;
  coverImage: string;
  connectedAccounts: {
    linkedin: string;
    facebook: string;
  };
  metrics: {
    totalReach: number;
    reachDelta: string;
    engagementRate: number;
    engagementDelta: string;
    ctr: number;
    ctrDelta: string;
    followerGrowth: number;
  };
  weeklySeries: Array<{
    label: string;
    linkedinReach: number;
    facebookReach: number;
    engagements: number;
  }>;
}

export interface SocialPost {
  id: string;
  brandId: string;
  platform: SocialPlatform;
  title: string;
  pillar: string;
  caption: string;
  hashtags: string[];
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: PostStatus;
  imageUrl?: string;
  revisionNote?: string;
  estimatedReach?: number;
  source?: 'ai_studio' | 'blog_repurpose' | 'calendar_ai' | 'manual';
  createdAt: string;
}

export interface AudienceComment {
  id: string;
  brandId: string;
  platform: SocialPlatform;
  authorName: string;
  authorRole: string;
  commentText: string;
  postContext: string;
  receivedAt: string;
  status: 'unanswered' | 'replied';
  draftReply?: string;
  sentReply?: string;
}

export interface GeneratedPostDraft {
  platform: SocialPlatform;
  headline: string;
  caption: string;
  hashtags: string[];
  bestTime: string;
  rationale: string;
  cta: string;
}

export interface RepurposeResult {
  summary: string;
  keyTakeaways: string[];
  posts: Array<{
    platform: SocialPlatform;
    angle: string;
    caption: string;
    hashtags: string[];
    bestTime: string;
  }>;
}
