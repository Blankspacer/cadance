import React, { useState } from 'react';
import { CalendarPlus, Check, Copy, FileText, Loader2 } from 'lucide-react';
import { SAMPLE_BLOGS } from '../data/seedData';
import { BrandProfile, RepurposeResult, SocialPost } from '../types';

interface BlogRepurposerProps {
  brand: BrandProfile;
  onAddPostsToQueue: (newPosts: SocialPost[]) => void;
  onConsumeCredit?: () => Promise<boolean>;
}

export const BlogRepurposer: React.FC<BlogRepurposerProps> = ({
  brand,
  onAddPostsToQueue,
  onConsumeCredit,
}) => {
  const defaultSample =
    SAMPLE_BLOGS[brand.category] || SAMPLE_BLOGS['Marketing Agency'];

  const [blogTitle, setBlogTitle] = useState(defaultSample.title);
  const [blogContent, setBlogContent] = useState(defaultSample.content);
  const [startDate, setStartDate] = useState('2026-11-26');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepurposeResult | null>(null);
  const [queuedIndices, setQueuedIndices] = useState<number[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleLoadSample = () => {
    const sample =
      SAMPLE_BLOGS[brand.category] || SAMPLE_BLOGS['Marketing Agency'];
    setBlogTitle(sample.title);
    setBlogContent(sample.content);
  };

  const handleRepurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogContent.trim()) return;

    setError(null);
    if (onConsumeCredit) {
      const allowed = await onConsumeCredit();
      if (!allowed) {
        setError('Monthly AI generation limit reached. Upgrade your subscription in Plan & Billing.');
        return;
      }
    }

    setIsLoading(true);
    setQueuedIndices([]);

    try {
      const res = await fetch('/api/ai/repurpose-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          blogTitle,
          blogContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to repurpose blog post');
      }
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to repurpose blog content right now.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const buildPostObject = (
    item: RepurposeResult['posts'][number],
    idx: number
  ): SocialPost => {
    const base = new Date(`${startDate}T10:00:00`);
    base.setDate(base.getDate() + idx * 2);
    const isoDate = base.toISOString().slice(0, 10);

    return {
      id: `repurpose-${Date.now()}-${idx}`,
      brandId: brand.id,
      platform: item.platform === 'linkedin' ? 'linkedin' : 'facebook',
      title: `${item.angle}: ${blogTitle.slice(0, 42)}`,
      pillar: 'Blog Repurpose',
      caption: item.caption,
      hashtags: item.hashtags,
      scheduledDate: isoDate,
      scheduledTime: item.platform === 'linkedin' ? '09:30' : '13:30',
      status: 'pending_approval',
      estimatedReach: item.platform === 'linkedin' ? 8400 : 6200,
      source: 'blog_repurpose',
      createdAt: new Date().toISOString(),
    };
  };

  const handleQueueSingle = (idx: number) => {
    if (!result) return;
    const item = result.posts[idx];
    onAddPostsToQueue([buildPostObject(item, idx)]);
    setQueuedIndices((prev) => [...prev, idx]);
  };

  const handleQueueAll = () => {
    if (!result) return;
    const remaining = result.posts
      .map((item, idx) => ({ item, idx }))
      .filter(({ idx }) => !queuedIndices.includes(idx));
    if (remaining.length === 0) return;

    onAddPostsToQueue(remaining.map(({ item, idx }) => buildPostObject(item, idx)));
    setQueuedIndices(result.posts.map((_, idx) => idx));
  };

  const handleCopy = async (
    idx: number,
    caption: string,
    hashtags: string[]
  ) => {
    await navigator.clipboard.writeText(`${caption}\n\n${hashtags.join(' ')}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Input Form */}
      <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Blog-to-Social Repurposer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn one blog post into 4 LinkedIn &amp; Facebook campaign posts
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
          >
            Load industry sample
          </button>
        </div>

        <form onSubmit={handleRepurpose} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="blog-title"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Article Title
            </label>
            <input
              id="blog-title"
              type="text"
              required
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="Enter article headline..."
              className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="blog-body"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Article Text or Newsletter Draft
            </label>
            <textarea
              id="blog-body"
              rows={9}
              required
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              placeholder="Paste your blog post, announcement, or press release here..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="repurpose-start"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Campaign Rollout Start Date
            </label>
            <input
              id="repurpose-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>
              {isLoading
                ? 'Extracting Social Angles...'
                : 'Repurpose Into 4 Social Posts'}
            </span>
          </button>
        </form>
      </section>

      {/* Output Suite */}
      <section className="lg:col-span-7 space-y-5">
        {!result && !isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-2">
            <h3 className="text-base font-semibold text-slate-900">
              Multi-Angle Campaign Pack
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Paste a blog post or load the {brand.category} sample on the left
              to generate two LinkedIn posts, two Facebook community posts, and
              tailored hashtags.
            </p>
          </div>
        ) : isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-5 w-52 bg-slate-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-100 rounded animate-pulse" />
          </div>
        ) : (
          result && (
            <>
              {/* Article Executive Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Extracted Key Takeaways
                  </h3>
                  <button
                    type="button"
                    onClick={handleQueueAll}
                    disabled={queuedIndices.length === result.posts.length}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>
                      {queuedIndices.length === result.posts.length
                        ? 'All 4 Queued for Approval'
                        : 'Queue All 4 Posts'}
                    </span>
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {result.summary}
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {result.keyTakeaways.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* 4 Generated Posts */}
              <div className="grid grid-cols-1 gap-4">
                {result.posts.map((post, idx) => {
                  const isLinkedIn = post.platform === 'linkedin';
                  const isQueued = queuedIndices.includes(idx);

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`font-semibold ${
                              isLinkedIn ? 'text-[#0A66C2]' : 'text-[#1877F2]'
                            }`}
                          >
                            {isLinkedIn ? 'LinkedIn' : 'Facebook'}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-medium text-slate-800">
                            {post.angle}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono tabular-nums text-slate-500">
                            {post.bestTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(idx, post.caption, post.hashtags)
                            }
                            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {copiedIdx === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQueueSingle(idx)}
                            disabled={isQueued}
                            className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isQueued
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-700 text-white hover:bg-blue-800'
                            }`}
                          >
                            {isQueued ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <CalendarPlus className="w-3.5 h-3.5" />
                            )}
                            <span>{isQueued ? 'Queued' : 'Queue Post'}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                        {post.caption}
                      </p>

                      <p className="text-xs font-medium text-blue-700">
                        {post.hashtags.join(' ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </section>
    </div>
  );
};
