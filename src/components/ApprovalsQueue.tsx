import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCheck,
  Copy,
  Edit3,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { BrandProfile, PostStatus, SocialPlatform, SocialPost } from '../types';

interface ApprovalsQueueProps {
  brand: BrandProfile;
  posts: SocialPost[];
  onUpdatePost: (postId: string, updates: Partial<SocialPost>) => void;
  onApproveAllPending: () => void;
  onDeletePost: (postId: string) => void;
}

const STATUS_META: Record<PostStatus, { label: string; color: string }> = {
  pending_approval: { label: 'Pending Approval', color: 'text-amber-700' },
  approved: { label: 'Approved', color: 'text-emerald-700' },
  scheduled: { label: 'Scheduled', color: 'text-blue-700' },
  published: { label: 'Published', color: 'text-slate-600' },
  needs_revision: { label: 'Needs Revision', color: 'text-red-700' },
};

export const ApprovalsQueue: React.FC<ApprovalsQueueProps> = ({
  brand,
  posts,
  onUpdatePost,
  onApproveAllPending,
  onDeletePost,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | SocialPlatform>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [revisionPostId, setRevisionPostId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingCount = posts.filter((p) => p.status === 'pending_approval').length;

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => statusFilter === 'all' || p.status === statusFilter)
      .filter((p) => platformFilter === 'all' || p.platform === platformFilter)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q) ||
          p.pillar.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(
          `${b.scheduledDate} ${b.scheduledTime}`
        )
      );
  }, [posts, statusFilter, platformFilter, searchQuery]);

  const handleCopyPost = async (post: SocialPost) => {
    await navigator.clipboard.writeText(
      `${post.caption}\n\n${post.hashtags.join(' ')}`
    );
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Controls & Filter Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Scheduled Post Approvals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, edit, approve, or publish queued Facebook and LinkedIn
              posts for {brand.name}
            </p>
          </div>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={onApproveAllPending}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All Pending ({pendingCount})</span>
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pending_approval', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'needs_revision', label: 'Revision' },
                { id: 'published', label: 'Published' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by platform"
              value={platformFilter}
              onChange={(e) =>
                setPlatformFilter(e.target.value as 'all' | SocialPlatform)
              }
              className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="all">All Platforms</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or caption..."
              className="min-h-[38px] w-full sm:w-56 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
        </div>
      </section>

      {/* Queue List */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-700">
            No posts match your current filters
          </p>
          <p className="text-xs text-slate-500">
            Switch filters or create new drafts in AI Post Studio or Monthly
            Calendar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {filteredPosts.map((post) => {
            const isEditing = editingPostId === post.id;
            const isRequestingRevision = revisionPostId === post.id;
            const statusInfo = STATUS_META[post.status];

            return (
              <article key={post.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        post.platform === 'linkedin'
                          ? 'text-[#0A66C2]'
                          : 'text-[#1877F2]'
                      }`}
                    >
                      {post.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className={`font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-500">{post.pillar}</span>
                  </div>

                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {post.scheduledDate} · {post.scheduledTime}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900">
                  {post.title}
                </h3>

                {isEditing ? (
                  <div className="space-y-2.5">
                    <textarea
                      rows={5}
                      value={post.caption}
                      onChange={(e) =>
                        onUpdatePost(post.id, { caption: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <input
                      type="text"
                      value={post.hashtags.join(' ')}
                      onChange={(e) =>
                        onUpdatePost(post.id, {
                          hashtags: e.target.value
                            .split(/[\s,]+/)
                            .filter(Boolean)
                            .map((t) => (t.startsWith('#') ? t : `#${t}`)),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-blue-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPostId(null)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {post.caption}
                    </p>
                    {post.hashtags.length > 0 && (
                      <p className="text-xs font-medium text-blue-700">
                        {post.hashtags.join(' ')}
                      </p>
                    )}
                  </>
                )}

                {post.revisionNote && post.status === 'needs_revision' && (
                  <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Revision note: {post.revisionNote}
                  </p>
                )}

                {isRequestingRevision && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      placeholder="Add feedback for the copywriter..."
                      className="flex-1 min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdatePost(post.id, {
                          status: 'needs_revision',
                          revisionNote:
                            revisionNote.trim() || 'Requested copy revision',
                        });
                        setRevisionPostId(null);
                        setRevisionNote('');
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-medium"
                    >
                      Submit Revision Request
                    </button>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.status !== 'approved' &&
                      post.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePost(post.id, {
                              status: 'approved',
                              revisionNote: undefined,
                            })
                          }
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                    {post.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePost(post.id, { status: 'scheduled' })
                        }
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Schedule Now</span>
                      </button>
                    )}

                    {post.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePost(post.id, { status: 'published' })
                        }
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Mark Published</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setEditingPostId(isEditing ? null : post.id)
                      }
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Close Editor' : 'Edit'}</span>
                    </button>

                    {post.status !== 'published' && (
                      <button
                        type="button"
                        onClick={() =>
                          setRevisionPostId(
                            isRequestingRevision ? null : post.id
                          )
                        }
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Edit</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPost(post)}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      {copiedId === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === post.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      aria-label={`Delete ${post.title}`}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
