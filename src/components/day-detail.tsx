'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { CATEGORIES, CATEGORY_ORDER } from '@/lib/categories';
import type { CategoryType } from '@/lib/categories';
import { CategoryIcon } from '@/lib/category-icons';
import { getChangeTypeLabel } from '@/lib/format-change-summary';
import { decodeHtmlEntities } from '@/lib/decode-entities';
import type { ChangeType } from '@/db/types';

interface ChangeItem {
  id: string;
  title: string;
  url: string;
  changeType: ChangeType;
  summary: string | null;
  category: CategoryType;
  formattedSummary: string;
}

interface DayDetailProps {
  date: string; // YYYY-MM-DD
  activeCategories: Set<string>;
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-48 bg-surface rounded" />
          <div className="space-y-2 pl-4">
            <div className="h-4 w-full bg-surface rounded" />
            <div className="h-4 w-3/4 bg-surface rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      {/* Calendar with checkmark SVG icon */}
      <svg
        className="w-10 h-10 text-muted/50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M9 16l2 2 4-4" />
      </svg>
      <div className="text-center">
        <p className="text-muted text-sm font-medium">
          No changes on this day
        </p>
        <p className="text-muted/60 text-xs mt-1">
          No documentation changes were detected on this day
        </p>
      </div>
    </div>
  );
}

function ChangeTypeBadge({ changeType }: { changeType: ChangeType }) {
  const label = getChangeTypeLabel(changeType);

  const colorMap: Record<ChangeType, string> = {
    added: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    modified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    removed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    sidebar_changed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${colorMap[changeType]}`}
    >
      {label}
    </span>
  );
}

export function DayDetail({ date, activeCategories }: DayDetailProps) {
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = (() => {
    try {
      return format(parseISO(date), 'EEEE, MMM d', { locale: enUS });
    } catch {
      return date;
    }
  })();

  useEffect(() => {
    let cancelled = false;

    async function fetchChanges() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/calendar/${date}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) {
          setChanges(json.changes ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchChanges();

    return () => {
      cancelled = true;
    };
  }, [date]);

  const filteredChanges = changes.filter((c) => activeCategories.has(c.category));

  const groupedByCategory = CATEGORY_ORDER.reduce<
    Record<string, ChangeItem[]>
  >((acc, cat) => {
    const items = filteredChanges.filter((c) => c.category === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {});

  const categoryKeys = Object.keys(groupedByCategory) as CategoryType[];

  return (
    <div
      className="animate-[slideDownFadeIn_0.3s_ease-out]"
      style={{
        animation: 'slideDownFadeIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header with formatted date */}
      <h3 className="text-base font-semibold mb-4">
        {formattedDate}
      </h3>

      {loading && <SkeletonLoader />}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {!loading && !error && filteredChanges.length === 0 && <EmptyState />}

      {!loading && !error && categoryKeys.length > 0 && (
        <div className="space-y-5">
          {categoryKeys.map((cat) => {
            const config = CATEGORIES[cat];
            const items = groupedByCategory[cat];

            return (
              <div key={cat}>
                {/* Category group header */}
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <CategoryIcon category={cat} className="w-4 h-4" />
                  <span>{config.name}</span>
                  <span className="text-muted font-normal">
                    ({items.length} {items.length === 1 ? 'change' : 'changes'})
                  </span>
                </h4>

                {/* Change items as mini cards */}
                <div className="space-y-2 pl-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2.5 py-2 px-3 rounded-lg border border-border/50 hover:border-border hover:bg-surface/50 transition-colors"
                    >
                      {/* Category icon */}
                      <span
                        className="shrink-0 mt-0.5"
                        style={{ color: config.color }}
                      >
                        <CategoryIcon category={cat} className="w-4 h-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        {/* Title + badge row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-accent transition-colors line-clamp-1"
                          >
                            {decodeHtmlEntities(item.title)}
                          </a>
                          <ChangeTypeBadge changeType={item.changeType} />
                        </div>

                        {/* One-line summary */}
                        {item.summary && (
                          <p className="text-xs text-muted line-clamp-1 mt-0.5">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* View full details link */}
          <div className="pt-2">
            <Link
              href={`/changes/${date}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-light transition-colors"
            >
              View full details
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
