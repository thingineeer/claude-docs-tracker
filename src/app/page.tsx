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

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center pt-12 pb-4">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Claude Docs Tracker
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
          Track every change to Claude&apos;s official documentation.
          <br className="hidden sm:block" />
          Never miss an update to{' '}
          <span className="text-accent font-medium">platform.claude.com</span> and{' '}
          <span className="text-accent font-medium">code.claude.com</span>.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-accent">{pageCount}</div>
          <div className="text-sm text-muted mt-1">Pages Tracked</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-green-600">
            {todayStats.new_pages}
          </div>
          <div className="text-sm text-muted mt-1">New Today</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {todayStats.modified_pages}
          </div>
          <div className="text-sm text-muted mt-1">Modified Today</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-red-600">
            {todayStats.removed_pages}
          </div>
          <div className="text-sm text-muted mt-1">Removed Today</div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Last 7 Days</h2>
          <Link href="/calendar" className="text-sm text-accent hover:underline">
            Calendar
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5">
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
            <p className="text-muted">No changes recorded yet.</p>
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
