import Link from 'next/link';
import { format } from 'date-fns';
import { getLatestChanges, getPageCount, getTodayStats, getRecentChangeCounts } from '@/db/queries';
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

  const today = format(new Date(), 'yyyy-MM-dd');

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

  return (
    <div className="space-y-10">
      {/* Compact Hero + Stats combined */}
      <section className="pt-8 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Claude Docs Tracker
            </h1>
            <p className="text-muted text-sm mt-1">
              Tracking changes across{' '}
              <span className="text-accent font-medium">platform.claude.com</span> &{' '}
              <span className="text-accent font-medium">code.claude.com</span>
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold text-accent">{pageCount}</div>
              <div className="text-xs text-muted">Pages</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className={`text-xl font-bold ${totalToday > 0 ? 'text-green-600' : 'text-muted'}`}>
                {totalToday}
              </div>
              <div className="text-xs text-muted">Today</div>
            </div>
          </div>
        </div>

        {/* Activity Dot Strip */}
        <div className="rounded-xl border border-border bg-surface/50 p-4">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Changes</h2>
          <Link href={`/changes/${today}`} className="text-sm text-accent hover:underline">
            View all
          </Link>
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
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
