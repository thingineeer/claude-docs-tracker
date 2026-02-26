'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES, CATEGORY_ORDER } from '@/lib/categories';
import type { CategoryType } from '@/lib/categories';
import { CategoryIcon } from '@/lib/category-icons';
import { getChangeTypeIcon } from '@/lib/format-change-summary';
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
    <div className="flex items-center justify-center py-12">
      <p className="text-muted text-sm">
        이 날은 문서 변경이 없습니다.
      </p>
    </div>
  );
}

export function DayDetail({ date, activeCategories }: DayDetailProps) {
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      <h3 className="text-base font-semibold mb-4">
        {date}
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

                {/* Change items */}
                <div className="space-y-2 pl-1">
                  {items.map((item) => {
                    const typeIcon = getChangeTypeIcon(item.changeType);

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-surface transition-colors"
                      >
                        {/* Change type icon */}
                        <span
                          className={`font-mono text-sm font-bold shrink-0 w-4 text-center ${typeIcon.color}`}
                        >
                          {typeIcon.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* Title as link */}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-accent transition-colors line-clamp-1"
                          >
                            {item.title}
                          </a>

                          {/* One-line summary */}
                          {item.summary && (
                            <p className="text-xs text-muted line-clamp-1 mt-0.5">
                              {item.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
