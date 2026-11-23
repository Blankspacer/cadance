import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckSquare,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  LogIn,
  LogOut,
  PenSquare,
  Plus,
  WifiOff,
} from 'lucide-react';
import {
  BillingCycle,
  BrandProfile,
  NavTab,
  PlanTier,
  PostStatus,
  SocialPost,
  TeamSeat,
} from './types';
import { SAAS_PLANS } from './data/saasPlans';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { useSaaSStore } from './hooks/useSaaSStore';
import { DownloadAppModal } from './components/DownloadAppModal';
import { BrandSettingsModal } from './components/BrandSettingsModal';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PostStudio } from './components/PostStudio';
import { BlogRepurposer } from './components/BlogRepurposer';
import { ContentCalendar } from './components/ContentCalendar';
import { ApprovalsQueue } from './components/ApprovalsQueue';
import { BillingAndSaaSView } from './components/BillingAndSaaSView';
import { SaaSStorefront } from './components/SaaSStorefront';

const STORAGE_ACTIVE_BRAND = 'cadence_active_brand_v2';

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  mobileLabel: string;
  icon: typeof BarChart3;
}> = [
  { id: 'overview', label: 'Analytics & Overview', mobileLabel: 'Overview', icon: BarChart3 },
  { id: 'studio', label: 'AI Post Studio', mobileLabel: 'Studio', icon: PenSquare },
  { id: 'repurpose', label: 'Blog Repurposer', mobileLabel: 'Repurpose', icon: FileText },
  { id: 'calendar', label: 'Content Calendar', mobileLabel: 'Calendar', icon: Calendar },
  { id: 'approvals', label: 'Post Approvals', mobileLabel: 'Approvals', icon: CheckSquare },
  { id: 'billing', label: 'Plan, Team & Billing', mobileLabel: 'Billing', icon: CreditCard },
];

export default function App() {
  const {
    user,
    authReady,
    isAuthLoading,
    authError,
    tenant,
    brands,
    posts,
    teamSeats,
    invoices,
    comments,
    setComments,
    signInWithGoogle,
    signOutUser,
    consumeAICredit,
    addWorkspace,
    addPosts,
    updatePost,
    approveAllPendingForBrand,
    deletePost,
    changePlan,
    updateWhiteLabel,
    addTeamSeat,
    removeTeamSeat,
  } = useSaaSStore();

  const [appMode, setAppMode] = useState<'storefront' | 'workspace'>('storefront');
  const [selectedPlanOnLanding, setSelectedPlanOnLanding] =
    useState<PlanTier>('growth');
  const [activeBrandId, setActiveBrandId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_ACTIVE_BRAND) || brands[0]?.id || '';
    } catch {
      return brands[0]?.id || '';
    }
  });

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [clientPortalMode, setClientPortalMode] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Auto-enter workspace once user signs in
  useEffect(() => {
    if (authReady && user) {
      setAppMode('workspace');
    }
  }, [authReady, user]);

  useEffect(() => {
    try {
      if (activeBrandId) {
        localStorage.setItem(STORAGE_ACTIVE_BRAND, activeBrandId);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeBrandId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3400);
  };

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) || brands[0],
    [brands, activeBrandId]
  );

  const brandPosts = useMemo(
    () => posts.filter((p) => p.brandId === activeBrand.id),
    [posts, activeBrand.id]
  );

  const brandComments = useMemo(
    () => comments.filter((c) => c.brandId === activeBrand.id),
    [comments, activeBrand.id]
  );

  const pendingCount = useMemo(
    () => brandPosts.filter((p) => p.status === 'pending_approval').length,
    [brandPosts]
  );

  const handleOpenAddWorkspace = () => {
    if (brands.length >= tenant.maxWorkspaces) {
      showToast(
        `Workspace limit reached (${tenant.maxWorkspaces} on ${SAAS_PLANS[tenant.planTier].name}). Upgrade plan to add more clients.`
      );
      setActiveTab('billing');
      return;
    }
    setIsBrandModalOpen(true);
  };

  const handleAddBrand = async (newBrand: BrandProfile) => {
    const saved = await addWorkspace(newBrand);
    setActiveBrandId(saved.id);
    showToast(`Created workspace for ${saved.name}`);
  };

  const handleAddPostsToQueue = async (newPosts: SocialPost[]) => {
    await addPosts(newPosts);
    showToast(
      `Added ${newPosts.length} ${newPosts.length === 1 ? 'post' : 'posts'} to approval queue`
    );
  };

  const handleApprovePost = async (postId: string) => {
    await updatePost(postId, { status: 'approved', revisionNote: '' });
    showToast('Post approved for scheduled publishing');
  };

  const handleApproveAllPending = async () => {
    await approveAllPendingForBrand(activeBrand.id);
    showToast('All pending posts approved');
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
    showToast('Post removed from queue');
  };

  const handleUpdatePostStatus = async (
    postId: string,
    status: PostStatus,
    note?: string
  ) => {
    await updatePost(postId, { status, revisionNote: note || '' });
  };

  const handleSaveDraftReply = (commentId: string, draft: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, draftReply: draft } : c))
    );
  };

  const handleSendReply = (commentId: string, replyText: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, status: 'replied', sentReply: replyText }
          : c
      )
    );
    showToast('Reply sent to audience comment');
  };

  const handleChangePlan = async (planTier: PlanTier, cycle: BillingCycle) => {
    await changePlan(planTier, cycle);
    showToast(`Switched to ${SAAS_PLANS[planTier].name} plan`);
  };

  const handleUpdateWhiteLabel = async (
    companyName: string,
    whiteLabelName: string
  ) => {
    await updateWhiteLabel(companyName, whiteLabelName);
    showToast('Organization branding updated');
  };

  const handleAddTeamSeat = async (
    name: string,
    email: string,
    role: TeamSeat['role']
  ) => {
    await addTeamSeat(name, email, role);
    showToast(`Invited ${name} as ${role}`);
  };

  const activeNavMeta =
    NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const mobileBottomItems = NAV_ITEMS.slice(0, 5);

  if (appMode === 'storefront') {
    return (
      <>
        <SaaSStorefront
          isAuthenticated={!!user}
          isAuthLoading={isAuthLoading}
          authError={authError}
          selectedPlanOnLanding={selectedPlanOnLanding}
          onSelectPlanForSignup={(plan) => setSelectedPlanOnLanding(plan)}
          onGoogleSignIn={signInWithGoogle}
          onEnterDemoWorkspace={() => setAppMode('workspace')}
          onOpenDownload={() => setIsDownloadOpen(true)}
        />
        <DownloadAppModal
          isOpen={isDownloadOpen}
          onClose={() => setIsDownloadOpen(false)}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          isIOS={isIOS}
          onNativeInstall={install}
        />
      </>
    );
  }

  // White-Label Client Approval Portal Preview Mode
  if (clientPortalMode) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-display text-lg font-bold text-slate-900">
                {tenant.whiteLabelName || tenant.companyName}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Client Content Approval Portal · {activeBrand.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setClientPortalMode(false)}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
            >
              Exit Client Portal Preview
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
          <ApprovalsQueue
            brand={activeBrand}
            posts={brandPosts}
            onUpdatePost={updatePost}
            onApproveAllPending={handleApproveAllPending}
            onDeletePost={handleDeletePost}
          />
        </main>
      </div>
    );
  }

  const activePlanSpec = SAAS_PLANS[tenant.planTier];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop / Laptop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="px-5 h-16 flex items-center justify-between border-b border-slate-200">
          <button
            type="button"
            onClick={() => setAppMode('storefront')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-blue-700 transition-colors"
          >
            Cadence
          </button>
          <span className="text-[11px] font-medium text-slate-500">
            {activePlanSpec.name}
          </span>
        </div>

        {/* Workspace / Client Switcher */}
        <div className="p-4 border-b border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="desktop-brand-select"
              className="text-xs font-medium text-slate-500"
            >
              Client Workspace ({brands.length}/{tenant.maxWorkspaces})
            </label>
            <button
              type="button"
              onClick={handleOpenAddWorkspace}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
          <select
            id="desktop-brand-select"
            value={activeBrand.id}
            onChange={(e) => setActiveBrandId(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.category})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 truncate">
            {activeBrand.category} · {activeBrand.handle}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'approvals' && pendingCount > 0 && (
                  <span
                    className={`font-mono tabular-nums text-xs ${
                      isActive ? 'text-slate-200' : 'text-amber-700 font-semibold'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* SaaS Meter, Auth & Download Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>AI Credits</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {tenant.aiCreditsUsed} / {tenant.aiCreditsLimit}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-700 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (tenant.aiCreditsUsed / Math.max(tenant.aiCreditsLimit, 1)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDownloadOpen(true)}
            className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-700 shrink-0" />
            <span>{isInstalled ? 'App Installed' : 'Download App'}</span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setAppMode('storefront')}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Pricing Page
            </button>

            {user ? (
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  signInWithGoogle(tenant.planTier, tenant.billingCycle)
                }
                className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left Zone */}
            <div className="min-w-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAppMode('storefront')}
                className="lg:hidden font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
              >
                Cadence
              </button>
              <span className="lg:hidden text-slate-300" aria-hidden="true">
                /
              </span>
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 truncate">
                <span className="truncate">{activeBrand.name}</span>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-slate-900 whitespace-nowrap">
                  {activeNavMeta.label}
                </span>
              </div>
              <span className="lg:hidden text-xs font-medium text-slate-600 truncate">
                {activeNavMeta.mobileLabel}
              </span>
            </div>

            {/* Right Zone */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setClientPortalMode(true)}
                className="hidden xl:inline-flex min-h-[40px] items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Client Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDownloadOpen(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Download App</span>
              </button>

              {activeTab !== 'studio' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('studio')}
                  className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <PenSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>New Post</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Workspace Switcher + Plan Button */}
          <div className="lg:hidden mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
            <select
              aria-label="Switch client workspace"
              value={activeBrand.id}
              onChange={(e) => setActiveBrandId(e.target.value)}
              className="flex-1 min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-900"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleOpenAddWorkspace}
              aria-label="Add workspace"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'border-blue-700 bg-blue-50 text-blue-800'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              Plan
            </button>
          </div>
        </header>

        {/* Active View Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewDashboard
                brand={activeBrand}
                posts={brandPosts}
                comments={brandComments}
                onApprovePost={handleApprovePost}
                onUpdatePostStatus={handleUpdatePostStatus}
                onSaveDraftReply={handleSaveDraftReply}
                onSendReply={handleSendReply}
                onNavigate={setActiveTab}
                onConsumeCredit={() => consumeAICredit(1)}
              />
            )}

            {activeTab === 'studio' && (
              <PostStudio
                brand={activeBrand}
                onAddPostsToQueue={handleAddPostsToQueue}
                onConsumeCredit={() => consumeAICredit(1)}
              />
            )}

            {activeTab === 'repurpose' && (
              <BlogRepurposer
                brand={activeBrand}
                onAddPostsToQueue={handleAddPostsToQueue}
                onConsumeCredit={() => consumeAICredit(1)}
              />
            )}

            {activeTab === 'calendar' && (
              <ContentCalendar
                brand={activeBrand}
                posts={brandPosts}
                onAddPostsToQueue={handleAddPostsToQueue}
                onUpdatePost={updatePost}
                onDeletePost={handleDeletePost}
                onConsumeCredit={() => consumeAICredit(1)}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalsQueue
                brand={activeBrand}
                posts={brandPosts}
                onUpdatePost={updatePost}
                onApproveAllPending={handleApproveAllPending}
                onDeletePost={handleDeletePost}
              />
            )}

            {activeTab === 'billing' && (
              <BillingAndSaaSView
                tenant={tenant}
                workspaces={brands}
                teamSeats={teamSeats}
                invoices={invoices}
                isAuthenticated={!!user}
                onChangePlan={handleChangePlan}
                onUpdateWhiteLabel={handleUpdateWhiteLabel}
                onAddTeamSeat={handleAddTeamSeat}
                onRemoveTeamSeat={removeTeamSeat}
                onOpenClientPortalPreview={() => setClientPortalMode(true)}
                onSignInPrompt={() =>
                  signInWithGoogle(tenant.planTier, tenant.billingCycle)
                }
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile & Tablet Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                  isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Offline Connectivity Banner */}
      {!isOnline && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white shadow-lg">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Cached workspace data is active.</span>
        </div>
      )}

      {/* Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-5 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-2.5 text-xs font-medium shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* Cross-Platform Download / Install Modal */}
      <DownloadAppModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onNativeInstall={install}
      />

      {/* Add Brand Workspace Modal */}
      <BrandSettingsModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onAddBrand={handleAddBrand}
      />
    </div>
  );
}
