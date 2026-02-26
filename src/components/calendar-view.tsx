'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarGrid } from './calendar-grid';
import { CategoryLegend } from './category-legend';
import { DayDetail } from './day-detail';
import { CATEGORY_ORDER, type CategoryType } from '@/lib/categories';

interface CalendarDayData {
  total: number;
  categories: Record<string, number>;
}

interface CalendarApiResponse {
  year: number;
  month: number;
  days: Record<string, CalendarDayData>;
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
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(CATEGORY_ORDER as string[]),
  );
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDayData>>({});
  const [loading, setLoading] = useState(true);
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

  const handleMonthChange = useCallback(
    (year: number, month: number) => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      router.push(`/calendar?month=${monthStr}`);
    },
    [router],
  );

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleToggleCategory = useCallback((category: string) => {
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
          data={calendarData}
          selectedDate={selectedDate}
          onDateSelect={handleSelectDate}
          onMonthChange={handleMonthChange}
          activeCategories={activeCategories}
        />
      )}

      <CategoryLegend
        activeCategories={activeCategories}
        onToggle={handleToggleCategory}
      />

      {selectedDate && (
        <DayDetail
          date={selectedDate}
          activeCategories={activeCategories}
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
