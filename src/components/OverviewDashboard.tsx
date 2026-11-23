import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Loader2,
  MessageSquare,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AudienceComment,
  BrandProfile,
  NavTab,
  PostStatus,
  SocialPost,
} from '../types';

interface OverviewDashboardProps {
  brand: BrandProfile;
  posts: SocialPost[];
  comments: AudienceComment[];
  onApprovePost: (postId: string) => void;
  onUpdatePostStatus: (postId: string, status: PostStatus, note?: string) => void;
  onSaveDraftReply: (commentId: string, draft: string) => void;
  onSendReply: (commentId: string, replyText: string) => void;
  onNavigate: (tab: NavTab) => void;
  onConsumeCredit?: () => Promise<boolean>;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  brand,
  posts,
  comments,
  onApprovePost,
  onSaveDraftReply,
  onSendReply,
  onNavigate,
  onConsumeCredit,
}) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(
    brand.weeklySeries.length - 1
  );
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyError, setReplyError] = useState<string | null>(null);

  const pendingPosts = posts.filter((p) => p.status === 'pending_approval');
  const scheduledOrApproved = posts.filter(
    (p) => p.status === 'approved' || p.status === 'scheduled'
  );
  const unansweredComments = comments.filter((c) => c.status === 'unanswered');

  const maxReach = Math.max(
    ...brand.weeklySeries.map((w) => Math.max(w.linkedinReach, w.facebookReach)),
    1000
  );

  const handleDraftAIReply = async (comment: AudienceComment) => {
    setReplyError(null);
    if (onConsumeCredit) {
      const allowed = await onConsumeCredit();
      if (!allowed) {
        setReplyError('Monthly AI credit limit reached. Upgrade your plan in Plan & Billing to continue.');
        return;
      }
    }
    setDraftingId(comment.id);
    try {
      const res = await fetch('/api/ai/engagement-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          platform: comment.platform,
          authorName: comment.authorName,
          commentText: comment.commentText,
          postContext: comment.postContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate reply');
      }
      const draftText = data.reply || '';
      onSaveDraftReply(comment.id, draftText);
      setReplyInputs((prev) => ({ ...prev, [comment.id]: draftText }));
    } catch (err) {
      setReplyError(
        err instanceof Error ? err.message : 'Unable to reach AI engagement service.'
      );
    } finally {
      setDraftingId(null);
    }
  };

  const activeWeek =
    brand.weeklySeries[selectedWeekIndex] ||
    brand.weeklySeries[brand.weeklySeries.length - 1];

  return (
    <div className="space-y-6">
      {/* 4-column KPI strip */}
      <section aria-label="Performance summary">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">30-Day Reach</p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                {brand.metrics.totalReach.toLocaleString()}
              </span>
              <span className="text-xs font-mono tabular-nums font-medium text-emerald-700">
                {brand.metrics.reachDelta}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              LinkedIn &amp; Facebook combined
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Engagement Rate</p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                {brand.metrics.engagementRate.toFixed(1)}%
              </span>
              <span className="text-xs font-mono tabular-nums font-medium text-emerald-700">
                {brand.metrics.engagementDelta}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Reactions, comments &amp; shares
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Ready to Publish</p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                {scheduledOrApproved.length}
              </span>
              <span className="text-xs font-mono tabular-nums font-medium text-amber-700">
                {pendingPosts.length} pending
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Queued in monthly calendar
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500">Link Click-Through</p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tabular-nums">
                {brand.metrics.ctr.toFixed(1)}%
              </span>
              <span className="text-xs font-mono tabular-nums font-medium text-emerald-700">
                {brand.metrics.ctrDelta}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              +{brand.metrics.followerGrowth.toLocaleString()} net followers
            </p>
          </div>
        </div>
      </section>

      {/* Main 2-column analytics + approvals split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cross-platform analytics chart */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Cross-Platform Reach Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly organic impressions across LinkedIn and Facebook
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0A66C2]" />
                LinkedIn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#1877F2]/45 border border-[#1877F2]" />
                Facebook
              </span>
            </div>
          </div>

          {/* Interactive Bar Comparison Chart */}
          <div className="mt-5">
            <div className="grid grid-cols-4 gap-3 sm:gap-6 items-end h-52 pt-4 pb-2 border-b border-slate-200">
              {brand.weeklySeries.map((week, idx) => {
                const liHeight = Math.max(
                  Math.round((week.linkedinReach / maxReach) * 100),
                  10
                );
                const fbHeight = Math.max(
                  Math.round((week.facebookReach / maxReach) * 100),
                  10
                );
                const isSelected = idx === selectedWeekIndex;

                return (
                  <button
                    key={week.label}
                    type="button"
                    onClick={() => setSelectedWeekIndex(idx)}
                    className={`group flex flex-col items-center h-full justify-end rounded-lg px-2 pt-2 transition-colors focus-visible:outline-2 focus-visible:outline-blue-700 ${
                      isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-36">
                      <div
                        className="w-5 sm:w-7 rounded-t-sm bg-[#0A66C2] transition-all"
                        style={{ height: `${liHeight}%` }}
                        title={`LinkedIn: ${week.linkedinReach.toLocaleString()}`}
                      />
                      <div
                        className="w-5 sm:w-7 rounded-t-sm bg-[#1877F2]/40 border border-[#1877F2]/70 transition-all"
                        style={{ height: `${fbHeight}%` }}
                        title={`Facebook: ${week.facebookReach.toLocaleString()}`}
                      />
                    </div>
                    <span
                      className={`mt-2 text-xs font-mono tabular-nums ${
                        isSelected
                          ? 'font-semibold text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {week.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Week Readout */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">
                  {activeWeek.label} Breakdown
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  LinkedIn {activeWeek.linkedinReach.toLocaleString()}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Facebook {activeWeek.facebookReach.toLocaleString()}
                </span>
              </div>
              <span className="font-mono tabular-nums text-slate-700">
                {activeWeek.engagements.toLocaleString()} total engagements
              </span>
            </div>
          </div>

          {/* Quick Workflow Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:border-blue-700 hover:text-blue-700 transition-colors"
            >
              <span>Generate Post</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('repurpose')}
              className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:border-blue-700 hover:text-blue-700 transition-colors"
            >
              <span>Repurpose Blog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:border-blue-700 hover:text-blue-700 transition-colors"
            >
              <span>Build Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Pending Post Approvals Quick Queue */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Awaiting Approval
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scheduled posts ready for sign-off
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
            >
              View all ({posts.length})
            </button>
          </div>

          {pendingPosts.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700">
                All queued posts are approved
              </p>
              <p className="text-xs text-slate-500">
                Generate new Facebook or LinkedIn drafts in Post Studio.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors"
              >
                Create New Post
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingPosts.slice(0, 4).map((post) => (
                <div key={post.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-semibold ${
                          post.platform === 'linkedin'
                            ? 'text-[#0A66C2]'
                            : 'text-[#1877F2]'
                        }`}
                      >
                        {post.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{post.pillar}</span>
                    </div>
                    <span className="font-mono tabular-nums shrink-0">
                      {post.scheduledDate} {post.scheduledTime}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 line-clamp-1">
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {post.caption}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onApprovePost(post.id)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('approvals')}
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Automated Audience Engagement Inbox */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Audience Engagement Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft on-brand responses to incoming Facebook and LinkedIn comments
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {unansweredComments.length} awaiting reply
          </span>
        </div>

        {replyError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {replyError}
          </div>
        )}

        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No incoming comments for this workspace yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {comments.map((comment) => {
              const currentDraft =
                replyInputs[comment.id] ?? comment.draftReply ?? '';
              const isDrafting = draftingId === comment.id;

              return (
                <div key={comment.id} className="py-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-900">
                        {comment.authorName}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-600">{comment.authorRole}</span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span
                        className={`font-medium ${
                          comment.platform === 'linkedin'
                            ? 'text-[#0A66C2]'
                            : 'text-[#1877F2]'
                        }`}
                      >
                        {comment.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {comment.receivedAt} ·{' '}
                      {comment.status === 'replied' ? 'Replied' : 'Open'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed">
                    “{comment.commentText}”
                  </p>
                  <p className="text-xs text-slate-500">
                    On post: {comment.postContext}
                  </p>

                  {comment.status === 'replied' ? (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700">
                      <span className="font-semibold text-emerald-700">
                        Sent reply:{' '}
                      </span>
                      {comment.sentReply}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDraftAIReply(comment)}
                          disabled={isDrafting}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-60"
                        >
                          {isDrafting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isDrafting ? 'Drafting Reply...' : 'Draft AI Reply'}
                          </span>
                        </button>
                      </div>

                      {currentDraft !== '' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <textarea
                            rows={2}
                            value={currentDraft}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            aria-label={`Reply to ${comment.authorName}`}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onSendReply(comment.id, currentDraft.trim())
                            }
                            disabled={!currentDraft.trim()}
                            className="min-h-[44px] sm:self-end inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Reply</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
