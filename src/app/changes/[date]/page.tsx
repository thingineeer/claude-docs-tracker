import Link from 'next/link';
import { format, subDays, addDays } from 'date-fns';
import { getChangesByDate } from '@/db/queries';
import { ChangeCard } from '@/components/change-card';
import { DateNav } from '@/components/date-nav';
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
  let fetchError = false;

  try {
    changes = await getChangesByDate(date);
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
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <Link href="/calendar" className="hover:text-accent transition-colors">Calendar</Link>
        <span>/</span>
        <span>{date}</span>
      </div>

      <DateNav
        currentDate={date}
        prevDate={prevDate}
        nextDate={nextDate}
        isToday={isToday}
      />

      {fetchError ? (
        <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-muted text-sm">Database connection required.</p>
          </div>
        </div>
      ) : changes.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M9 16l2 2 4-4" />
            </svg>
            <p className="text-muted text-sm">No changes detected on this date.</p>
          </div>
        </div>
      ) : (
        <>
          {newPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-green-600">
                {newPages.length === 1 ? 'New Page' : 'New Pages'} ({newPages.length})
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
                {modifiedPages.length === 1 ? 'Modified Page' : 'Modified Pages'} ({modifiedPages.length})
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
                {removedPages.length === 1 ? 'Removed Page' : 'Removed Pages'} ({removedPages.length})
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
                {sidebarChanges.length === 1 ? 'Sidebar Change' : 'Sidebar Changes'} ({sidebarChanges.length})
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
