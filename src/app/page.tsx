import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getLatestChanges, getPageCount, getTodayStats, getRecentChangeCounts } from '@/db/queries';
import { getTodayString } from '@/lib/timezone';
import { ChangeCard } from '@/components/change-card';
import { TimelineBar } from '@/components/timeline-bar';
import type { ChangeType } from '@/db/types';

export const revalidate = 3600;

export default async function HomePage() {
  let changes: Awaited<ReturnType<typeof getLatestChanges>> = [];
  let pageCount = 0;
  let todayStats = { new_pages: 0, modified_pages: 0, removed_pages: 0, total: 0 };
  let timelineData: { date: string; count: number }[] = [];
  let fetchError = false;

  const today = getTodayString();

  try {
    [changes, pageCount, todayStats, timelineData] = await Promise.all([
      getLatestChanges(10),
      getPageCount(),
      getTodayStats(today),
      getRecentChangeCounts(7),
    ]);
  } catch {
    fetchError = true;
  }

  const totalToday = todayStats.new_pages + todayStats.modified_pages + todayStats.removed_pages;

  // Compute last updated relative time from the most recent change
  const lastUpdatedText = changes.length > 0
    ? (() => {
        try {
          return formatDistanceToNow(new Date(changes[0].created_at), { addSuffix: true });
        } catch {
          return changes[0].detected_at;
        }
      })()
    : 'No data yet';

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="pt-8 pb-2">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Claude Patch Notes
          </h1>
          <p className="text-muted text-sm mt-2">
            Every change to Claude&apos;s docs — including the silent ones
          </p>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Card 1: Pages Tracked */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <path d="M14 3v5h5" />
              <path d="M9 13h6M9 17h4" />
            </svg>
            <div className="min-w-0">
              <div className="text-base font-semibold leading-tight">{pageCount}</div>
              <div className="text-[11px] text-muted uppercase tracking-wide">Tracked</div>
            </div>
          </div>

          {/* Card 2: Today Changes */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div className="min-w-0">
              <div className={`text-base font-semibold leading-tight ${totalToday > 0 ? 'text-green-600' : ''}`}>
                {totalToday}
              </div>
              <div className="text-[11px] text-muted uppercase tracking-wide">Today</div>
            </div>
          </div>

          {/* Card 3: Last Updated */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">{lastUpdatedText}</div>
              <div className="text-[11px] text-muted uppercase tracking-wide">Last updated</div>
            </div>
          </div>
        </div>

        {/* Activity Dot Strip */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted">Last 7 Days</h2>
            <Link href="/calendar" className="text-xs text-accent hover:underline">
              View calendar
            </Link>
          </div>
          <TimelineBar data={timelineData} />
        </div>
      </section>

      {/* Recent Changes */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold">Latest</h2>
        </div>
        {fetchError ? (
          <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
            <p className="text-muted">Unable to connect to database.</p>
          </div>
        ) : changes.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M9 16l2 2 4-4" />
              </svg>
              <p className="text-muted text-sm">No changes detected yet. The crawler runs daily.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map((change) => {
              const page = change.pages as { title: string; url: string } | null;
              return (
                <ChangeCard
                  key={change.id}
                  title={page?.title ?? 'Unknown Page'}
                  url={page?.url ?? '#'}
                  changeType={change.change_type as ChangeType}
                  summary={change.diff_summary}
                  diffHtml={change.diff_html}
                  detectedAt={change.detected_at}
                  createdAt={change.created_at}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
