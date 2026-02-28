import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { getPageCount, getRecentChangeCounts, getRecentBreakingChanges, getThisWeekChanges } from '@/db/queries';
import { ChangeCard } from '@/components/change-card';
import { TimelineBar } from '@/components/timeline-bar';
import type { ChangeType } from '@/db/types';

export const revalidate = 3600;

export default async function HomePage() {
  let pageCount = 0;
  let timelineData: { date: string; count: number }[] = [];
  let breakingChanges: Awaited<ReturnType<typeof getRecentBreakingChanges>> = [];
  let weekChanges: Awaited<ReturnType<typeof getThisWeekChanges>> = [];
  let fetchError = false;

  try {
    [pageCount, timelineData, breakingChanges, weekChanges] = await Promise.all([
      getPageCount(),
      getRecentChangeCounts(7),
      getRecentBreakingChanges(7),
      getThisWeekChanges(20),
    ]);
  } catch {
    fetchError = true;
  }

  // Group this week's changes by date
  const changesByDate = new Map<string, typeof weekChanges>();
  for (const change of weekChanges) {
    const date = change.detected_at;
    if (!changesByDate.has(date)) {
      changesByDate.set(date, []);
    }
    changesByDate.get(date)!.push(change);
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="pt-8 pb-2">
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Claude Patch Notes
          </h1>
          <p className="text-muted text-sm mt-2">
            Official releases and undocumented changes to Claude&apos;s APIs, tools, and documentation
          </p>
          <p className="text-sm text-muted mt-1">
            Monitoring {pageCount} documentation pages across 4 categories
          </p>
        </div>
      </section>

      {/* Breaking Changes Alert */}
      {breakingChanges.length > 0 && (
        <section>
          <div className="rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 p-5">
            <h2 className="font-semibold text-red-700 dark:text-red-400 mb-3">
              {'\u26A0\uFE0F'} Breaking Changes
            </h2>
            <div className="space-y-3">
              {breakingChanges.map((change) => {
                const pageRaw = change.pages;
                const page = (Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) as { id: string; url: string; title: string; domain: string; section: string | null } | null;
                return (
                  <div key={change.id}>
                    <Link
                      href={`/changes/${change.detected_at}`}
                      className="font-medium text-red-800 dark:text-red-300 hover:underline"
                    >
                      {page?.title ?? 'Unknown Page'}
                    </Link>
                    {change.diff_summary && (
                      <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-0.5">
                        {change.diff_summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* This Week */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold">This Week</h2>
          {weekChanges.length > 0 && (
            <span className="text-xs text-muted bg-[var(--surface)] border border-[var(--border)] rounded-full px-2 py-0.5">
              {weekChanges.length}
            </span>
          )}
        </div>
        {fetchError ? (
          <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
            <p className="text-muted">Unable to connect to database.</p>
          </div>
        ) : weekChanges.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M9 16l2 2 4-4" />
              </svg>
              <p className="text-muted text-sm">No changes detected this week. The crawler runs daily.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {[...changesByDate.entries()].map(([date, changes]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted mb-2">
                  {format(parseISO(date), 'EEEE, MMM d')}
                </h3>
                <div className="space-y-3">
                  {changes.map((change) => {
                    const pageRaw = change.pages;
                    const page = (Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) as { id: string; url: string; title: string; domain: string; section: string | null } | null;
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
                        isSilent={change.is_silent}
                        isBreaking={change.is_breaking}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Link href="/calendar" className="text-sm text-accent hover:underline">
                View all on calendar &rarr;
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Activity Dot Strip */}
      <section>
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
    </div>
  );
}
