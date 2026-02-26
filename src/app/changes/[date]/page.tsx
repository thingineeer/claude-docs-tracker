import Link from 'next/link';
import { format, subDays, addDays } from 'date-fns';
import { getChangesByDate, getDailyReport } from '@/db/queries';
import { ChangeCard } from '@/components/change-card';
import type { ChangeType } from '@/db/types';
import type { Metadata } from 'next';

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Changes on ${date}`,
    description: `Documentation changes detected on ${date} - Claude Docs Tracker`,
    openGraph: {
      title: `Changes on ${date} - Claude Docs Tracker`,
      description: `Documentation changes detected on ${date}`,
    },
  };
}

export default async function ChangesDatePage({ params }: PageProps) {
  const { date } = await params;
  let changes: Awaited<ReturnType<typeof getChangesByDate>> = [];
  let report: Awaited<ReturnType<typeof getDailyReport>> = null;
  let fetchError = false;

  try {
    [changes, report] = await Promise.all([getChangesByDate(date), getDailyReport(date)]);
  } catch {
    fetchError = true;
  }

  const prevDate = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
  const nextDate = format(addDays(new Date(date), 1), 'yyyy-MM-dd');
  const isToday = date === format(new Date(), 'yyyy-MM-dd');

  const newPages = changes.filter((c) => c.change_type === 'added');
  const modifiedPages = changes.filter((c) => c.change_type === 'modified');
  const removedPages = changes.filter((c) => c.change_type === 'removed');
  const sidebarChanges = changes.filter((c) => c.change_type === 'sidebar_changed');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/changes/${prevDate}`} className="text-sm text-accent hover:underline">
          &larr; {prevDate}
        </Link>
        <h1 className="text-2xl font-bold">{date}</h1>
        {!isToday ? (
          <Link href={`/changes/${nextDate}`} className="text-sm text-accent hover:underline">
            {nextDate} &rarr;
          </Link>
        ) : (
          <span className="text-sm text-muted">Today</span>
        )}
      </div>

      {report?.ai_summary && (
        <section className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <h2 className="text-sm font-medium text-accent mb-2">AI Summary</h2>
          <p className="text-sm">{report.ai_summary}</p>
        </section>
      )}

      {fetchError ? (
        <p className="text-muted text-sm">Database connection required.</p>
      ) : changes.length === 0 ? (
        <p className="text-muted text-sm">No changes detected on this date.</p>
      ) : (
        <>
          {newPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-green-600">
                New Pages ({newPages.length})
              </h2>
              <div className="space-y-3">
                {newPages.map((change) => {
                  const page = change.pages as { title: string; url: string } | null;
                  return (
                    <ChangeCard
                      key={change.id}
                      title={page?.title ?? 'Unknown'}
                      url={page?.url ?? '#'}
                      changeType={change.change_type as ChangeType}
                      summary={change.diff_summary}
                      diffHtml={change.diff_html}
                      detectedAt={change.detected_at}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {modifiedPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-blue-600">
                Modified Pages ({modifiedPages.length})
              </h2>
              <div className="space-y-3">
                {modifiedPages.map((change) => {
                  const page = change.pages as { title: string; url: string } | null;
                  return (
                    <ChangeCard
                      key={change.id}
                      title={page?.title ?? 'Unknown'}
                      url={page?.url ?? '#'}
                      changeType={change.change_type as ChangeType}
                      summary={change.diff_summary}
                      diffHtml={change.diff_html}
                      detectedAt={change.detected_at}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {removedPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-red-600">
                Removed Pages ({removedPages.length})
              </h2>
              <div className="space-y-3">
                {removedPages.map((change) => {
                  const page = change.pages as { title: string; url: string } | null;
                  return (
                    <ChangeCard
                      key={change.id}
                      title={page?.title ?? 'Unknown'}
                      url={page?.url ?? '#'}
                      changeType={change.change_type as ChangeType}
                      summary={change.diff_summary}
                      diffHtml={change.diff_html}
                      detectedAt={change.detected_at}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {sidebarChanges.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-purple-600">
                Sidebar Changes ({sidebarChanges.length})
              </h2>
              <div className="space-y-3">
                {sidebarChanges.map((change) => {
                  const page = change.pages as { title: string; url: string } | null;
                  return (
                    <ChangeCard
                      key={change.id}
                      title={page?.title ?? 'Unknown'}
                      url={page?.url ?? '#'}
                      changeType={change.change_type as ChangeType}
                      summary={change.diff_summary}
                      diffHtml={change.diff_html}
                      detectedAt={change.detected_at}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
