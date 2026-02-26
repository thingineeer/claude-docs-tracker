'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarGrid, type CalendarDayData } from './calendar-grid';
import { CategoryLegend } from './category-legend';
import { DayDetail, type DayChange } from './day-detail';
import { ALL_CATEGORIES, type CategoryType } from '@/lib/categories';

interface CalendarApiResponse {
  year: number;
  month: number;
  days: Record<string, CalendarDayData>;
}

interface DayDetailApiResponse {
  date: string;
  changes: DayChange[];
  grouped: Partial<Record<CategoryType, DayChange[]>>;
}

function CalendarViewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const monthParam = searchParams.get('month');
  const { currentYear, currentMonth } = useMemo(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number);
      if (y >= 2020 && y <= 2099 && m >= 1 && m <= 12) {
        return { currentYear: y, currentMonth: m };
      }
    }
    const now = new Date();
    return { currentYear: now.getFullYear(), currentMonth: now.getMonth() + 1 };
  }, [monthParam]);

  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [activeCategories, setActiveCategories] = useState<Set<CategoryType>>(
    () => new Set(ALL_CATEGORIES),
  );
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDayData>>({});
  const [dayDetailData, setDayDetailData] = useState<DayDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCalendarData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/calendar?year=${currentYear}&month=${currentMonth}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: CalendarApiResponse = await res.json();
        if (!cancelled) {
          setCalendarData(data.days);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load calendar data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCalendarData();
    return () => {
      cancelled = true;
    };
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (!selectedDate) {
      setDayDetailData(null);
      return;
    }

    let cancelled = false;

    async function fetchDayDetail() {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/calendar/${selectedDate}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: DayDetailApiResponse = await res.json();
        if (!cancelled) {
          setDayDetailData(data);
        }
      } catch {
        if (!cancelled) {
          setDayDetailData(null);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    fetchDayDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const navigateMonth = useCallback(
    (direction: 'prev' | 'next') => {
      let newYear = currentYear;
      let newMonth = currentMonth;

      if (direction === 'prev') {
        newMonth -= 1;
        if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }
      } else {
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }

      const monthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
      router.push(`/calendar?month=${monthStr}`);
    },
    [currentYear, currentMonth, router],
  );

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleToggleCategory = useCallback((category: CategoryType) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const monthLabel = `${currentYear}. ${String(currentMonth).padStart(2, '0')}`;

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="px-3 py-1.5 rounded border border-border hover:border-accent hover:text-accent transition-colors text-sm"
          aria-label="Previous month"
        >
          &larr; Prev
        </button>
        <h2 className="text-lg font-semibold tabular-nums">{monthLabel}</h2>
        <button
          onClick={() => navigateMonth('next')}
          className="px-3 py-1.5 rounded border border-border hover:border-accent hover:text-accent transition-colors text-sm"
          aria-label="Next month"
        >
          Next &rarr;
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <div
              key={i}
              className="h-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <CalendarGrid
          year={currentYear}
          month={currentMonth}
          days={calendarData}
          selectedDate={selectedDate}
          activeCategories={activeCategories}
          onSelectDate={handleSelectDate}
        />
      )}

      <CategoryLegend
        activeCategories={activeCategories}
        onToggleCategory={handleToggleCategory}
      />

      {selectedDate && (
        <DayDetail
          date={selectedDate}
          changes={dayDetailData?.changes ?? []}
          grouped={dayDetailData?.grouped ?? {}}
          activeCategories={activeCategories}
          loading={detailLoading}
        />
      )}
    </div>
  );
}

export function CalendarView() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="h-8 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="h-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <CalendarViewInner />
    </Suspense>
  );
}
