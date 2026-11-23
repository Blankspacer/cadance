import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  Download,
  Loader2,
  ShieldCheck,
  Store,
  Utensils,
  Briefcase,
} from 'lucide-react';
import { SAAS_PLAN_LIST } from '../data/saasPlans';
import { BillingCycle, PlanTier } from '../types';

interface SaaSStorefrontProps {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  selectedPlanOnLanding: PlanTier;
  onSelectPlanForSignup: (plan: PlanTier, cycle: BillingCycle) => void;
  onGoogleSignIn: (plan: PlanTier, cycle: BillingCycle) => Promise<void>;
  onEnterDemoWorkspace: () => void;
  onOpenDownload: () => void;
}

const SEGMENTS = [
  {
    index: '01.',
    title: 'Marketing Agencies',
    icon: Building2,
    outcome: 'Manage up to 25 client accounts under one white-label approval portal.',
    metric: '12+ hrs saved per client monthly',
  },
  {
    index: '02.',
    title: 'Restaurants & Hospitality',
    icon: Utensils,
    outcome: 'Turn seasonal menus and weekend seatings into scheduled Facebook & LinkedIn campaigns.',
    metric: 'Consistent 3–5x weekly table reach',
  },
  {
    index: '03.',
    title: 'Independent Retailers',
    icon: Store,
    outcome: 'Repurpose lookbooks and supplier stories into high-intent product posts with hashtags.',
    metric: '4 platform angles per blog or drop',
  },
  {
    index: '04.',
    title: 'Growing SMEs',
    icon: Briefcase,
    outcome: 'Publish executive LinkedIn insights and handle customer comments with AI reply drafts.',
    metric: '100% scheduled post sign-off control',
  },
];

export const SaaSStorefront: React.FC<SaaSStorefrontProps> = ({
  isAuthenticated,
  isAuthLoading,
  authError,
  selectedPlanOnLanding,
  onSelectPlanForSignup,
  onGoogleSignIn,
  onEnterDemoWorkspace,
  onOpenDownload,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadBusiness, setLeadBusiness] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.includes('@') || !leadBusiness.trim()) return;
    setLeadSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Cadence
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="Product navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#capabilities"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#industries"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Industries
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <button
              type="button"
              onClick={onOpenDownload}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Download App
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onEnterDemoWorkspace}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                Open Workspace
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onGoogleSignIn(selectedPlanOnLanding, billingCycle)}
                disabled={isAuthLoading}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {isAuthLoading ? 'Signing In...' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Split */}
        <section className="px-4 sm:px-8 py-12 sm:py-16 border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-blue-700">
                  AI Social Media Marketing Agent · SaaS Platform
                </p>
                <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
                  Automated LinkedIn &amp; Facebook growth built to sell to clients.
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Generate platform-native posts, captions, hashtags, monthly
                  content calendars, and blog repurposing campaigns in one
                  client-ready workspace with built-in approval queues and
                  analytics.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {authError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated
                      ? onEnterDemoWorkspace()
                      : onGoogleSignIn(selectedPlanOnLanding, billingCycle)
                  }
                  disabled={isAuthLoading}
                  className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors whitespace-nowrap"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {isAuthenticated
                      ? 'Go to Client Dashboard'
                      : 'Start 14-Day Free Trial with Google'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onEnterDemoWorkspace}
                  className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <span>Explore Live Demo</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 pt-1">
                <span>14-day free trial</span>
                <span aria-hidden="true">·</span>
                <span>Multi-tenant client approvals</span>
                <span aria-hidden="true">·</span>
                <span>Installable on mobile, tablet &amp; desktop</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                <img
                  src="/src/assets/images/post_agency_strategy_1795421136743.jpg"
                  alt="Marketing agency team reviewing cross-platform campaign calendar"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 sm:h-80 lg:h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-column outcome proof strip */}
          <div className="max-w-6xl mx-auto mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
                4x Faster
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Monthly LinkedIn &amp; Facebook calendar production
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
                4-in-1
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Blog-to-social post repurposing per article
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
                25 Brands
              </p>
              <p className="text-xs text-slate-600 mt-1">
                White-label client workspaces on Agency Scale
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
                100% PWA
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Downloadable across iOS, Android, laptop &amp; desktop
              </p>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section id="capabilities" className="px-4 sm:px-8 py-14 border-b border-slate-200">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Built for recurring SaaS revenue and client retention
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every workflow connects AI content generation directly to
                client approvals, scheduled publishing, and measurable reach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                <p className="text-xs font-mono text-slate-500">01. Cross-Platform Studio</p>
                <h3 className="text-base font-semibold text-slate-900">
                  LinkedIn &amp; Facebook Post Generation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Drafts platform-tailored hooks, body copy, calls-to-action, and
                  5–8 targeted hashtags calibrated to each client’s voice and
                  industry.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                <p className="text-xs font-mono text-slate-500">02. Content Calendar Engine</p>
                <h3 className="text-base font-semibold text-slate-900">
                  Automated Monthly Calendars &amp; CSV Export
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Populates balanced monthly editorial plans in seconds, with
                  date/time rescheduling and client-ready CSV schedule exports.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                <p className="text-xs font-mono text-slate-500">03. Blog Repurposer</p>
                <h3 className="text-base font-semibold text-slate-900">
                  Long-Form Articles Into Multi-Post Campaigns
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Turns any client blog post or seasonal newsletter into two
                  LinkedIn thought-leadership posts and two Facebook community
                  posts.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                <p className="text-xs font-mono text-slate-500">04. Client Portal &amp; Replies</p>
                <h3 className="text-base font-semibold text-slate-900">
                  White-Label Approvals &amp; Engagement Inbox
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Clients approve or request edits in a clean review portal
                  while your team drafts on-brand AI replies to incoming comments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Segments */}
        <section id="industries" className="px-4 sm:px-8 py-14 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Who subscribes to Cadence
              </h2>
              <p className="text-sm text-slate-600">
                Pre-tuned brand playbooks and audience models for four high-demand
                verticals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SEGMENTS.map((seg) => {
                const Icon = seg.icon;
                return (
                  <div
                    key={seg.title}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono">{seg.index}</span>
                        <Icon className="w-4 h-4 text-slate-700" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {seg.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {seg.outcome}
                      </p>
                    </div>
                    <p className="text-xs font-mono font-medium text-blue-700 pt-3 border-t border-slate-200">
                      {seg.metric}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SaaS Pricing & Tier Comparison */}
        <section id="pricing" className="px-4 sm:px-8 py-14 border-b border-slate-200">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Simple SaaS pricing per seat &amp; workspace
                </h2>
                <p className="text-sm text-slate-600">
                  Start with a 14-day trial. Upgrade, downgrade, or white-label
                  for clients anytime.
                </p>
              </div>

              {/* Billing cadence segmented control (placed inside Pricing, NOT top bar) */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    billingCycle === 'annual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {SAAS_PLAN_LIST.map((plan) => {
                const price =
                  billingCycle === 'annual'
                    ? plan.annualMonthlyPrice
                    : plan.monthlyPrice;
                const isFeatured = plan.id === 'growth';

                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl bg-white p-6 flex flex-col justify-between gap-6 ${
                      isFeatured
                        ? 'border-2 border-blue-700'
                        : 'border border-slate-200'
                    }`}
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {plan.name}
                          </h3>
                          {isFeatured && (
                            <span className="text-xs font-semibold text-blue-700">
                              Most Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {plan.targetAudience}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-1.5 pt-2 border-t border-slate-100">
                        <span className="font-mono tabular-nums text-3xl font-bold text-slate-900">
                          ${price}
                        </span>
                        <span className="text-xs text-slate-500">
                          / month {billingCycle === 'annual' ? 'billed yearly' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                        <div>
                          <p className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                            {plan.maxWorkspaces}
                          </p>
                          <p className="text-[11px] text-slate-500">Workspaces</p>
                        </div>
                        <div>
                          <p className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                            {plan.aiCreditsLimit}
                          </p>
                          <p className="text-[11px] text-slate-500">AI Credits</p>
                        </div>
                        <div>
                          <p className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                            {plan.maxTeamSeats}
                          </p>
                          <p className="text-[11px] text-slate-500">Team Seats</p>
                        </div>
                      </div>

                      <ul className="space-y-2.5 text-xs text-slate-700">
                        {plan.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectPlanForSignup(plan.id, billingCycle);
                        if (isAuthenticated) {
                          onEnterDemoWorkspace();
                        } else {
                          onGoogleSignIn(plan.id, billingCycle);
                        }
                      }}
                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                        isFeatured
                          ? 'bg-blue-700 text-white hover:bg-blue-800'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isAuthenticated
                        ? `Open Workspace (${plan.name})`
                        : `Start ${plan.name} Trial`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Enterprise / Agency Demo Request & Download */}
        <section className="px-4 sm:px-8 py-14 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Multi-Tenant Cloud Sync &amp; Cross-Device PWA</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Ready to onboard your clients or run on every device
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Install Cadence natively onto mobile phones, iPads, laptops, and
                desktops, or request a guided agency rollout for 25+ client
                workspaces.
              </p>
              <button
                type="button"
                onClick={onOpenDownload}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 text-blue-700" />
                <span>Download for Mobile, Tablet, Laptop &amp; Desktop</span>
              </button>
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
              {leadSubmitted ? (
                <div className="space-y-2 py-4">
                  <h3 className="text-base font-semibold text-emerald-800">
                    Onboarding request logged
                  </h3>
                  <p className="text-sm text-slate-700">
                    We recorded a sandbox inquiry for{' '}
                    <span className="font-semibold">{leadBusiness}</span> (
                    {leadEmail}). Click Start Trial above to sign in with Google
                    and provision your tenant immediately.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLeadSubmitted(false)}
                    className="text-xs font-medium text-blue-700 hover:underline pt-1"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Request Agency Rollout Briefing
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Company or Agency Name
                      </label>
                      <input
                        type="text"
                        required
                        value={leadBusiness}
                        onChange={(e) => setLeadBusiness(e.target.value)}
                        placeholder="e.g. Harbor Media Group"
                        className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Request Rollout Info
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 sm:px-8 py-6 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Cadence AI Social Media Marketing Agent</span>
          <span>LinkedIn &amp; Facebook Automation · Multi-Tenant SaaS</span>
        </div>
      </footer>
    </div>
  );
};
