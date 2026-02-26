import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { getLatestChanges, getRecentReports } from '@/db/queries';
import { ChangeCard } from '@/components/change-card';
import { TimelineBar } from '@/components/timeline-bar';
import type { ChangeType } from '@/db/types';

export const revalidate = 3600;

export default async function HomePage() {
  let changes: Awaited<ReturnType<typeof getLatestChanges>> = [];
  let reports: Awaited<ReturnType<typeof getRecentReports>> = [];
  let fetchError = false;

  try {
    [changes, reports] = await Promise.all([getLatestChanges(10), getRecentReports(7)]);
  } catch {
    fetchError = true;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayReport = reports.find((r) => r.report_date === today);

  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const report = reports.find((r) => r.report_date === date);
    return { date, count: report?.total_changes ?? 0 };
  });

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
          <div className="text-3xl font-bold text-accent">138+</div>
          <div className="text-sm text-muted mt-1">Pages Tracked</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-green-600">
            {todayReport?.new_pages ?? 0}
          </div>
          <div className="text-sm text-muted mt-1">New Today</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {todayReport?.modified_pages ?? 0}
          </div>
          <div className="text-sm text-muted mt-1">Modified Today</div>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-5 text-center">
          <div className="text-3xl font-bold text-red-600">
            {todayReport?.removed_pages ?? 0}
          </div>
          <div className="text-sm text-muted mt-1">Removed Today</div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Last 7 Days</h2>
          <div className="flex items-center gap-3">
            <Link href="/changes" className="text-sm text-accent hover:underline">
              View history
            </Link>
            <Link href="/calendar" className="text-sm text-accent hover:underline">
              Calendar
            </Link>
          </div>
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
