import React, { useState } from 'react';
import {
  CalendarPlus,
  Check,
  Copy,
  Hash,
  Loader2,
  Send,
} from 'lucide-react';
import {
  BrandProfile,
  GeneratedPostDraft,
  SocialPlatform,
  SocialPost,
} from '../types';
import { SocialPreviewCard } from './SocialPreviewCard';

interface PostStudioProps {
  brand: BrandProfile;
  onAddPostsToQueue: (newPosts: SocialPost[]) => void;
  onConsumeCredit?: () => Promise<boolean>;
}

const TOPIC_PROMPTS: Record<string, string[]> = {
  'Marketing Agency': [
    'Why B2B brands need consistent weekly LinkedIn thought leadership',
    'Case study: Cutting paid social CPA by 28% with organic content testing',
  ],
  Restaurant: [
    'Weekend wood-fired chef tasting menu and autumn wine pairing release',
    'Hosting corporate holiday dinners and private group tastings in December',
  ],
  Retailer: [
    'Small-batch speckled stoneware ceramic restock and table styling guide',
    'Behind the craft: Meet the local artisans shaping our linen collection',
  ],
  SME: [
    '5 year-end cash-flow checks every small business owner should run before Q1',
    'How to tighten accounts receivable without straining client relationships',
  ],
};

export const PostStudio: React.FC<PostStudioProps> = ({
  brand,
  onAddPostsToQueue,
  onConsumeCredit,
}) => {
  const [platform, setPlatform] = useState<'both' | SocialPlatform>('both');
  const [topic, setTopic] = useState(
    TOPIC_PROMPTS[brand.category]?.[0] ||
      'Launch announcement and customer value spotlight'
  );
  const [goal, setGoal] = useState('Engagement & Lead Generation');
  const [tone, setTone] = useState(brand.voice);
  const [callToAction, setCallToAction] = useState(
    'Ask a question in comments and link to booking / catalog'
  );
  const [scheduledDate, setScheduledDate] = useState('2026-11-26');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [includeVisual, setIncludeVisual] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<GeneratedPostDraft[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [queuedIndices, setQueuedIndices] = useState<number[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError(null);
    if (onConsumeCredit) {
      const allowed = await onConsumeCredit();
      if (!allowed) {
        setError('Monthly AI generation limit reached. Upgrade your subscription in Plan & Billing.');
        return;
      }
    }

    setIsGenerating(true);
    setQueuedIndices([]);

    try {
      const res = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          platform,
          topic,
          goal,
          tone,
          callToAction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate posts');
      }
      setDrafts(data.posts || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate posts right now.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateDraft = (
    idx: number,
    field: 'caption' | 'hashtags',
    value: string
  ) => {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        if (field === 'caption') return { ...d, caption: value };
        const parsedTags = value
          .split(/[\s,]+/)
          .filter(Boolean)
          .map((t) => (t.startsWith('#') ? t : `#${t}`));
        return { ...d, hashtags: parsedTags };
      })
    );
  };

  const handleCopy = async (idx: number, draft: GeneratedPostDraft) => {
    const fullText = `${draft.caption}\n\n${draft.hashtags.join(' ')}`;
    await navigator.clipboard.writeText(fullText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleQueueDraft = (idx: number, draft: GeneratedPostDraft) => {
    const newPost: SocialPost = {
      id: `post-${Date.now()}-${idx}`,
      brandId: brand.id,
      platform: draft.platform === 'linkedin' ? 'linkedin' : 'facebook',
      title: draft.headline,
      pillar: goal,
      caption: draft.caption,
      hashtags: draft.hashtags,
      scheduledDate,
      scheduledTime,
      status: 'pending_approval',
      imageUrl: includeVisual ? brand.coverImage : undefined,
      estimatedReach: draft.platform === 'linkedin' ? 9500 : 7200,
      source: 'ai_studio',
      createdAt: new Date().toISOString(),
    };
    onAddPostsToQueue([newPost]);
    setQueuedIndices((prev) => [...prev, idx]);
  };

  const samplePrompts = TOPIC_PROMPTS[brand.category] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Composer Form */}
      <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            AI Post &amp; Caption Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate platform-native Facebook and LinkedIn posts with hashtags
          </p>
        </div>

        <form onSubmit={handleGenerate} className="mt-5 space-y-4">
          {/* Platform Segmented Buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Target Platforms
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'both', label: 'Both' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'facebook', label: 'Facebook' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPlatform(opt.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    platform === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="studio-topic"
                className="text-xs font-medium text-slate-700"
              >
                Campaign Topic or Brief
              </label>
              {samplePrompts.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setTopic(
                      samplePrompts[
                        topic === samplePrompts[0] && samplePrompts[1] ? 1 : 0
                      ]
                    )
                  }
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  Try sample brief
                </button>
              )}
            </div>
            <textarea
              id="studio-topic"
              rows={3}
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe the offer, announcement, product, or story..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="studio-goal"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Campaign Goal
              </label>
              <select
                id="studio-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="Engagement & Lead Generation">
                  Engagement &amp; Leads
                </option>
                <option value="Seasonal Promotion">Seasonal Promotion</option>
                <option value="Thought Leadership">Thought Leadership</option>
                <option value="Product or Menu Launch">
                  Product / Menu Launch
                </option>
                <option value="Customer Proof">Customer Proof</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="studio-cta"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Call-to-Action
              </label>
              <input
                id="studio-cta"
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="studio-tone"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Brand Tone
            </label>
            <input
              id="studio-tone"
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="studio-date"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Schedule Date
              </label>
              <input
                id="studio-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <label
                htmlFor="studio-time"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Publish Time
              </label>
              <input
                id="studio-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={includeVisual}
              onChange={(e) => setIncludeVisual(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
            />
            <span>Attach workspace campaign visual in live preview</span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {isGenerating
                ? 'Generating Posts & Hashtags...'
                : 'Generate Posts & Hashtags'}
            </span>
          </button>
        </form>
      </section>

      {/* Right Column: Live Previews & Editable Output */}
      <section className="lg:col-span-7 space-y-5">
        {drafts.length === 0 && !isGenerating ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-semibold text-slate-900">
                Live Cross-Platform Preview
              </h3>
              <p className="text-sm text-slate-500">
                Enter your campaign brief on the left and click Generate to
                create tailored Facebook and LinkedIn captions, hashtags, and
                posting recommendations for {brand.name}.
              </p>
            </div>
            <div className="max-w-md mx-auto text-left">
              <SocialPreviewCard
                brand={brand}
                platform="linkedin"
                caption={`Sample layout for ${brand.name} (${brand.category}). Your AI-generated hook, body copy, and targeted hashtags will render here ready for approval.`}
                hashtags={['#SocialMediaMarketing', '#LinkedIn', '#Facebook']}
                scheduledLabel={`${scheduledDate} · ${scheduledTime}`}
                imageUrl={includeVisual ? brand.coverImage : undefined}
              />
            </div>
          </div>
        ) : isGenerating ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 space-y-4">
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-28 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-28 w-full bg-slate-100 rounded animate-pulse" />
          </div>
        ) : (
          drafts.map((draft, idx) => {
            const isQueued = queuedIndices.includes(idx);
            const isLinkedIn = draft.platform === 'linkedin';

            return (
              <div
                key={`${draft.platform}-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        isLinkedIn ? 'text-[#0A66C2]' : 'text-[#1877F2]'
                      }`}
                    >
                      {isLinkedIn ? 'LinkedIn Draft' : 'Facebook Draft'}
                    </span>
                    <span className="text-slate-400" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      Best window: {draft.bestTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(idx, draft)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQueueDraft(idx, draft)}
                      disabled={isQueued}
                      className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        isQueued
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isQueued ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <CalendarPlus className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isQueued ? 'Added to Approval Queue' : 'Send to Approvals'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Editable Caption & Hashtags */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Edit Caption
                      </label>
                      <textarea
                        rows={7}
                        value={draft.caption}
                        onChange={(e) =>
                          handleUpdateDraft(idx, 'caption', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1">
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                        <span>Hashtags</span>
                      </label>
                      <input
                        type="text"
                        value={draft.hashtags.join(' ')}
                        onChange={(e) =>
                          handleUpdateDraft(idx, 'hashtags', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Strategy note: {draft.rationale}
                    </p>
                  </div>

                  {/* Live Feed Preview */}
                  <div>
                    <SocialPreviewCard
                      brand={brand}
                      platform={isLinkedIn ? 'linkedin' : 'facebook'}
                      caption={draft.caption}
                      hashtags={draft.hashtags}
                      scheduledLabel={`${scheduledDate} · ${scheduledTime}`}
                      imageUrl={includeVisual ? brand.coverImage : undefined}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
