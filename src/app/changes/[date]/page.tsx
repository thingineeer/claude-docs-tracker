import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format, subDays, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { getChangesByDate } from '@/db/queries';
import { ChangeCard } from '@/components/change-card';
import { DateNav } from '@/components/date-nav';
import { validateDateString } from '@/lib/calendar-utils';
import { getTodayString } from '@/lib/timezone';
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
    description: `Documentation changes detected on ${date} - Claude Patch Notes`,
    openGraph: {
      title: `Changes on ${date} | Claude Patch Notes`,
      description: `Documentation changes detected on ${date}`,
    },
  };
}

function SectionIcon({ type }: { type: 'new' | 'modified' | 'removed' | 'sidebar' }) {
  switch (type) {
    case 'new':
      return (
        <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'modified':
      return (
        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      );
    case 'removed':
      return (
        <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      );
    case 'sidebar':
      return (
        <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
        </svg>
      );
  }
}

export default async function ChangesDatePage({ params }: PageProps) {
  const { date } = await params;

  // Validate date format and value (e.g., reject Feb 30)
  if (!validateDateString(date)) {
    redirect(`/changes/${getTodayString()}`);
  }

  let changes: Awaited<ReturnType<typeof getChangesByDate>> = [];
  let fetchError = false;

  try {
    changes = await getChangesByDate(date);
  } catch {
    fetchError = true;
  }

  const prevDate = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
  const nextDate = format(addDays(new Date(date), 1), 'yyyy-MM-dd');
  const isToday = date === getTodayString();

  const formattedDate = (() => {
    try {
      return format(new Date(date), 'MMMM d, yyyy', { locale: enUS });
    } catch {
      return date;
    }
  })();

  const newPages = changes.filter((c) => c.change_type === 'added');
  const modifiedPages = changes.filter((c) => c.change_type === 'modified');
  const removedPages = changes.filter((c) => c.change_type === 'removed');
  const sidebarChanges = changes.filter((c) => c.change_type === 'sidebar_changed');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
        <Link href="/calendar" className="hover:text-accent transition-colors">Calendar</Link>
        <span>/</span>
        <span>{formattedDate}</span>
      </div>

      <DateNav
        currentDate={date}
        prevDate={prevDate}
        nextDate={nextDate}
        isToday={isToday}
      />

      {fetchError ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-[var(--muted)]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-[var(--muted)] text-sm">Database connection required.</p>
          </div>
        </div>
      ) : changes.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-[var(--muted)]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M9 16l2 2 4-4" />
            </svg>
            <p className="text-[var(--muted)] text-sm">No changes detected on this date.</p>
          </div>
        </div>
      ) : (
        <>
          {newPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-green-600 flex items-center gap-2">
                <SectionIcon type="new" />
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
                      createdAt={change.created_at}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {modifiedPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-blue-600 flex items-center gap-2">
                <SectionIcon type="modified" />
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
                      createdAt={change.created_at}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {removedPages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-red-600 flex items-center gap-2">
                <SectionIcon type="removed" />
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
                      createdAt={change.created_at}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {sidebarChanges.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-purple-600 flex items-center gap-2">
                <SectionIcon type="sidebar" />
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
                      createdAt={change.created_at}
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
