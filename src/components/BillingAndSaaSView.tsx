import React, { useState } from 'react';
import {
  Check,
  CreditCard,
  ExternalLink,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { SAAS_PLAN_LIST, SAAS_PLANS } from '../data/saasPlans';
import {
  BillingCycle,
  BillingInvoice,
  BrandProfile,
  PlanTier,
  TeamSeat,
  TenantAccount,
} from '../types';

interface BillingAndSaaSViewProps {
  tenant: TenantAccount;
  workspaces: BrandProfile[];
  teamSeats: TeamSeat[];
  invoices: BillingInvoice[];
  isAuthenticated: boolean;
  onChangePlan: (planTier: PlanTier, billingCycle: BillingCycle) => void;
  onUpdateWhiteLabel: (companyName: string, whiteLabelName: string) => void;
  onAddTeamSeat: (name: string, email: string, role: TeamSeat['role']) => void;
  onRemoveTeamSeat: (seatId: string) => void;
  onOpenClientPortalPreview: () => void;
  onSignInPrompt: () => void;
}

export const BillingAndSaaSView: React.FC<BillingAndSaaSViewProps> = ({
  tenant,
  workspaces,
  teamSeats,
  invoices,
  isAuthenticated,
  onChangePlan,
  onUpdateWhiteLabel,
  onAddTeamSeat,
  onRemoveTeamSeat,
  onOpenClientPortalPreview,
  onSignInPrompt,
}) => {
  const [companyInput, setCompanyInput] = useState(tenant.companyName);
  const [whiteLabelInput, setWhiteLabelInput] = useState(tenant.whiteLabelName);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    tenant.billingCycle
  );

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamSeat['role']>('Client Reviewer');
  const [seatError, setSeatError] = useState<string | null>(null);

  const activePlan = SAAS_PLANS[tenant.planTier];
  const creditPercent = Math.min(
    100,
    Math.round((tenant.aiCreditsUsed / Math.max(tenant.aiCreditsLimit, 1)) * 100)
  );
  const workspacePercent = Math.min(
    100,
    Math.round((workspaces.length / Math.max(tenant.maxWorkspaces, 1)) * 100)
  );

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInput.trim()) return;
    onUpdateWhiteLabel(companyInput.trim(), whiteLabelInput.trim());
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSeatError(null);
    if (teamSeats.length >= activePlan.maxTeamSeats) {
      setSeatError(
        `Seat limit reached (${activePlan.maxTeamSeats} seats on ${activePlan.name}). Upgrade your plan to invite more collaborators.`
      );
      return;
    }
    if (!inviteName.trim() || !inviteEmail.includes('@')) return;
    onAddTeamSeat(inviteName.trim(), inviteEmail.trim(), inviteRole);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <div className="space-y-6">
      {!isAuthenticated && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-blue-900">
            <span className="font-semibold">Demo Sandbox Active:</span> Sign in
            with Google to save your subscription tier, workspaces, and team
            seats to your cloud SaaS tenant.
          </div>
          <button
            type="button"
            onClick={onSignInPrompt}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            Sign In with Google
          </button>
        </div>
      )}

      {/* Usage Metering & Active Plan Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Active SaaS Subscription
              </p>
              <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                {activePlan.name} Plan ·{' '}
                <span className="font-mono tabular-nums">
                  $
                  {tenant.billingCycle === 'annual'
                    ? activePlan.annualMonthlyPrice
                    : activePlan.monthlyPrice}
                  /mo
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Status:{' '}
                <span className="font-semibold text-emerald-700">
                  {tenant.subscriptionStatus === 'trialing'
                    ? '14-Day Trial Active'
                    : 'Active'}
                </span>{' '}
                · {tenant.billingCycle === 'annual' ? 'Annual Billing' : 'Monthly Billing'}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenClientPortalPreview}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 hover:bg-slate-50 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
              <span>Preview Client Approval Portal</span>
            </button>
          </div>

          {/* Metering Bars */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Monthly AI Post &amp; Calendar Generations
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {tenant.aiCreditsUsed} / {tenant.aiCreditsLimit} credits
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    creditPercent > 85 ? 'bg-amber-600' : 'bg-blue-700'
                  }`}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Client Brand Workspaces
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {workspaces.length} / {tenant.maxWorkspaces} workspaces
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${workspacePercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Team &amp; Client Reviewer Seats
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {teamSeats.length} / {activePlan.maxTeamSeats} seats
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agency White-Label & Portal Branding */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Organization &amp; White-Label Portal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize the agency brand shown to clients during post approvals
            </p>
          </div>

          <form onSubmit={handleSaveBranding} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Client Portal Brand Header
              </label>
              <input
                type="text"
                value={whiteLabelInput}
                onChange={(e) => setWhiteLabelInput(e.target.value)}
                placeholder="e.g. Northstar Client Studio"
                className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="min-h-[42px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Save Organization Branding
            </button>
          </form>
        </div>
      </section>

      {/* Plan Upgrade / Switcher */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Subscription Tiers
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scale AI generation credits, workspaces, and white-label controls
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAAS_PLAN_LIST.map((plan) => {
            const isCurrent =
              tenant.planTier === plan.id &&
              tenant.billingCycle === billingCycle;
            const price =
              billingCycle === 'annual'
                ? plan.annualMonthlyPrice
                : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-xl p-5 flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'border-2 border-blue-700 bg-blue-50/20'
                    : 'border border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {plan.name}
                    </h4>
                    <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                      ${price}/mo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{plan.targetAudience}</p>
                  <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onChangePlan(plan.id, billingCycle)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-500 cursor-default'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team & Client Seats + Billing History */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Team &amp; Client Reviewers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Invite account strategists or clients to approve scheduled posts
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              {teamSeats.length} / {activePlan.maxTeamSeats} seats
            </span>
          </div>

          <form
            onSubmit={handleInviteSubmit}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
          >
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name"
              className="sm:col-span-4 min-h-[40px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
            />
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="client@company.com"
              className="sm:col-span-4 min-h-[40px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
            />
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as TeamSeat['role'])
              }
              className="sm:col-span-2 min-h-[40px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
            >
              <option value="Client Reviewer">Client</option>
              <option value="Strategist">Strategist</option>
            </select>
            <button
              type="submit"
              className="sm:col-span-2 min-h-[40px] inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </form>

          {seatError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {seatError}
            </p>
          )}

          <div className="divide-y divide-slate-100">
            {teamSeats.map((seat) => (
              <div
                key={seat.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {seat.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {seat.email} · {seat.role} · {seat.status}
                  </p>
                </div>
                {seat.role !== 'Owner' && (
                  <button
                    type="button"
                    onClick={() => onRemoveTeamSeat(seat.id)}
                    aria-label={`Remove ${seat.name}`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing Invoices */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Billing History
              </h3>
            </div>
            <span className="text-xs text-slate-500">USD</span>
          </div>

          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="py-3 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-mono font-medium text-slate-900">
                    {inv.invoiceNumber}
                  </p>
                  <p className="text-slate-500 truncate">
                    {inv.planName} · {inv.billingDate}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono tabular-nums font-semibold text-slate-900">
                    ${inv.amountUsd.toFixed(2)}
                  </p>
                  <p className="text-emerald-700 font-medium">{inv.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
