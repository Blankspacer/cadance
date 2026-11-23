import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { BrandProfile, PostStatus, SocialPlatform, SocialPost } from '../types';

interface ContentCalendarProps {
  brand: BrandProfile;
  posts: SocialPost[];
  onAddPostsToQueue: (newPosts: SocialPost[]) => void;
  onUpdatePost: (postId: string, updates: Partial<SocialPost>) => void;
  onDeletePost: (postId: string) => void;
  onConsumeCredit?: () => Promise<boolean>;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const STATUS_LABELS: Record<PostStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  needs_revision: 'Needs Revision',
};

export const ContentCalendar: React.FC<ContentCalendarProps> = ({
  brand,
  posts,
  onAddPostsToQueue,
  onUpdatePost,
  onDeletePost,
  onConsumeCredit,
}) => {
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(10); // November 2026
  const [platformFilter, setPlatformFilter] = useState<'all' | SocialPlatform>('all');
  const [postsPerWeek, setPostsPerWeek] = useState(3);
  const [campaignFocus, setCampaignFocus] = useState(
    'Holiday season readiness, behind-the-scenes stories, and direct conversions'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategyNote, setStrategyNote] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  const daysInMonth = useMemo(
    () => new Date(year, monthIndex + 1, 0).getDate(),
    [year, monthIndex]
  );
  const firstDayOffset = useMemo(
    () => new Date(year, monthIndex, 1).getDay(),
    [year, monthIndex]
  );

  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => p.scheduledDate.startsWith(monthPrefix))
      .filter((p) => platformFilter === 'all' || p.platform === platformFilter)
      .sort((a, b) =>
        `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(
          `${b.scheduledDate} ${b.scheduledTime}`
        )
      );
  }, [posts, monthPrefix, platformFilter]);

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else {
      setMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else {
      setMonthIndex((m) => m + 1);
    }
  };

  const handleGenerateCalendar = async () => {
    setError(null);
    if (onConsumeCredit) {
      const allowed = await onConsumeCredit();
      if (!allowed) {
        setError('Monthly AI generation limit reached. Upgrade your subscription in Plan & Billing.');
        return;
      }
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          monthLabel,
          daysInMonth,
          postsPerWeek,
          campaignFocus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate monthly calendar');
      }

      setStrategyNote(data.strategyNote || null);

      const created: SocialPost[] = (data.entries || []).map(
        (
          entry: {
            dayOfMonth: number;
            time: string;
            platform: string;
            pillar: string;
            title: string;
            caption: string;
            hashtags: string[];
          },
          idx: number
        ) => {
          const safeDay = Math.min(Math.max(Number(entry.dayOfMonth) || 1, 1), daysInMonth);
          const dateStr = `${monthPrefix}-${String(safeDay).padStart(2, '0')}`;
          return {
            id: `cal-${Date.now()}-${idx}`,
            brandId: brand.id,
            platform: entry.platform === 'linkedin' ? 'linkedin' : 'facebook',
            title: entry.title,
            pillar: entry.pillar,
            caption: entry.caption,
            hashtags: entry.hashtags || [],
            scheduledDate: dateStr,
            scheduledTime: entry.time || '10:00',
            status: 'pending_approval',
            estimatedReach: entry.platform === 'linkedin' ? 9200 : 6800,
            source: 'calendar_ai',
            createdAt: new Date().toISOString(),
          };
        }
      );

      onAddPostsToQueue(created);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to build monthly calendar right now.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const header = [
      'Date',
      'Time',
      'Platform',
      'Status',
      'Pillar',
      'Title',
      'Caption',
      'Hashtags',
    ];
    const rows = filteredPosts.map((p) => [
      p.scheduledDate,
      p.scheduledTime,
      p.platform,
      STATUS_LABELS[p.status],
      p.pillar,
      p.title,
      p.caption.replace(/\n/g, ' '),
      p.hashtags.join(' '),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.handle.replace('@', '')}-${monthPrefix}-calendar.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calendarCells = Array.from(
    { length: firstDayOffset + daysInMonth },
    (_, i) => (i < firstDayOffset ? null : i - firstDayOffset + 1)
  );

  return (
    <div className="space-y-6">
      {/* AI Monthly Calendar Builder Controls */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Monthly Content Calendar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan, generate, and export {monthLabel} schedules for {brand.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month switcher */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-slate-900 whitespace-nowrap">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Platform filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'linkedin', 'facebook'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    platformFilter === p
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === 'all' ? 'All' : p === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* AI Generator Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-6">
            <label
              htmlFor="calendar-focus"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Monthly Campaign Theme
            </label>
            <input
              id="calendar-focus"
              type="text"
              value={campaignFocus}
              onChange={(e) => setCampaignFocus(e.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="calendar-cadence"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Cadence
            </label>
            <select
              id="calendar-cadence"
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(Number(e.target.value))}
              className="w-full min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value={2}>2 posts / wk</option>
              <option value={3}>3 posts / wk</option>
              <option value={4}>4 posts / wk</option>
              <option value={5}>5 posts / wk</option>
            </select>
          </div>

          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={handleGenerateCalendar}
              disabled={isGenerating}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
              <span>
                {isGenerating
                  ? `Building ${monthLabel}...`
                  : `Build ${monthLabel} Calendar`}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        {strategyNote && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">
              AI Calendar Strategy:{' '}
            </span>
            {strategyNote}
          </div>
        )}
      </section>

      {/* Desktop/Tablet 7-Column Calendar Grid */}
      <section className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-3 py-2.5 text-center border-r last:border-r-0 border-slate-200">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[118px] border-b border-r border-slate-100 bg-slate-50/40"
                />
              );
            }

            const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
            const dayPosts = filteredPosts.filter(
              (p) => p.scheduledDate === dateStr
            );

            return (
              <div
                key={dateStr}
                className="min-h-[118px] border-b border-r border-slate-100 p-2 flex flex-col gap-1.5"
              >
                <span className="text-xs font-mono tabular-nums font-medium text-slate-500">
                  {day}
                </span>

                <div className="space-y-1">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="w-full text-left px-2 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:border-blue-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span
                          className={`font-semibold ${
                            post.platform === 'linkedin'
                              ? 'text-[#0A66C2]'
                              : 'text-[#1877F2]'
                          }`}
                        >
                          {post.platform === 'linkedin' ? 'LI' : 'FB'}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {post.scheduledTime}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 line-clamp-1 mt-0.5">
                        {post.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mobile Agenda View (< md) */}
      <section className="md:hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              No posts scheduled in {monthLabel}
            </p>
            <p className="text-xs text-slate-500">
              Tap Build {monthLabel} Calendar above to generate a monthly plan.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setSelectedPost(post)}
              className="w-full text-left p-4 space-y-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-semibold ${
                    post.platform === 'linkedin'
                      ? 'text-[#0A66C2]'
                      : 'text-[#1877F2]'
                  }`}
                >
                  {post.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} ·{' '}
                  {post.pillar}
                </span>
                <span className="font-mono tabular-nums text-slate-500">
                  {post.scheduledDate} {post.scheduledTime}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900">{post.title}</p>
              <p className="text-xs text-slate-500">
                Status: {STATUS_LABELS[post.status]}
              </p>
            </button>
          ))
        )}
      </section>

      {/* Inspection & Reschedule Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <span
                  className={`text-xs font-semibold ${
                    selectedPost.platform === 'linkedin'
                      ? 'text-[#0A66C2]'
                      : 'text-[#1877F2]'
                  }`}
                >
                  {selectedPost.platform === 'linkedin' ? 'LinkedIn' : 'Facebook'}{' '}
                  · {selectedPost.pillar}
                </span>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  {selectedPost.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                aria-label="Close details"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedPost.scheduledDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdatePost(selectedPost.id, { scheduledDate: val });
                      setSelectedPost({ ...selectedPost, scheduledDate: val });
                    }}
                    className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={selectedPost.scheduledTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdatePost(selectedPost.id, { scheduledTime: val });
                      setSelectedPost({ ...selectedPost, scheduledTime: val });
                    }}
                    className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Caption
                </label>
                <textarea
                  rows={5}
                  value={selectedPost.caption}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdatePost(selectedPost.id, { caption: val });
                    setSelectedPost({ ...selectedPost, caption: val });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 leading-relaxed"
                />
              </div>

              <p className="text-xs font-medium text-blue-700">
                {selectedPost.hashtags.join(' ')}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onDeletePost(selectedPost.id);
                    setSelectedPost(null);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedPost.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdatePost(selectedPost.id, { status: 'approved' });
                        setSelectedPost({
                          ...selectedPost,
                          status: 'approved',
                        });
                      }}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Post</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
