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
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">Claude Docs Tracker</h1>
        <p className="text-muted text-lg">
          {fetchError
            ? 'Unable to connect to database. Check your environment variables.'
            : todayReport
              ? `${todayReport.total_changes} ${todayReport.total_changes === 1 ? 'change' : 'changes'} detected today`
              : 'No changes detected today'}
        </p>
      </section>

      {todayReport && (
        <section className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{todayReport.new_pages}</div>
            <div className="text-sm text-muted">{todayReport.new_pages === 1 ? 'New Page' : 'New Pages'}</div>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{todayReport.modified_pages}</div>
            <div className="text-sm text-muted">{todayReport.modified_pages === 1 ? 'Modified Page' : 'Modified Pages'}</div>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{todayReport.removed_pages}</div>
            <div className="text-sm text-muted">{todayReport.removed_pages === 1 ? 'Removed Page' : 'Removed Pages'}</div>
          </div>
        </section>
      )}

      {todayReport?.ai_summary && (
        <section className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <h2 className="text-sm font-medium text-accent mb-2">AI Summary</h2>
          <p className="text-sm">{todayReport.ai_summary}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Last 7 Days</h2>
        <div className="rounded-lg border border-border p-4">
          <TimelineBar data={timelineData} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Changes</h2>
          <Link href={`/changes/${today}`} className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {changes.length === 0 ? (
          <p className="text-muted text-sm">
            {fetchError
              ? 'Database connection required to display changes.'
              : 'No changes recorded yet. Run the crawler to start tracking.'}
          </p>
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
