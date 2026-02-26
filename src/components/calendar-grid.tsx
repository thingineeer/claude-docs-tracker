'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { CATEGORIES, CATEGORY_ORDER } from '@/lib/categories';
import type { CategoryType } from '@/lib/categories';

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  data: Record<string, { total: number; categories: Record<string, number> }>;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  activeCategories: Set<string>;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_DOTS = 5;

export function CalendarGrid({
  year,
  month,
  data,
  selectedDate,
  onDateSelect,
  onMonthChange,
  activeCategories,
}: CalendarGridProps) {
  const currentMonth = new Date(year, month - 1, 1);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  function handlePrev() {
    const prev = subMonths(currentMonth, 1);
    onMonthChange(prev.getFullYear(), prev.getMonth() + 1);
  }

  function handleNext() {
    const next = addMonths(currentMonth, 1);
    onMonthChange(next.getFullYear(), next.getMonth() + 1);
  }

  function getCategoryDots(dateStr: string): CategoryType[] {
    const dayData = data[dateStr];
    if (!dayData) return [];

    return CATEGORY_ORDER.filter(
      (cat) =>
        activeCategories.has(cat) &&
        dayData.categories[cat] != null &&
        dayData.categories[cat] > 0,
    );
  }

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg border border-border hover:border-accent hover:text-accent transition-colors text-sm"
          aria-label="Previous month"
        >
          &larr;
        </button>
        <h2 className="text-lg font-semibold">
          {year}년 {month}월
        </h2>
        <button
          onClick={handleNext}
          className="p-2 rounded-lg border border-border hover:border-accent hover:text-accent transition-colors text-sm"
          aria-label="Next month"
        >
          &rarr;
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate === dateStr;
          const dots = getCategoryDots(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative flex flex-col items-center justify-start
                p-1 sm:p-2 min-h-[48px] sm:min-h-[56px]
                rounded-lg transition-all
                ${!inMonth ? 'opacity-30' : ''}
                ${selected ? 'ring-2 ring-accent bg-surface' : 'hover:bg-surface'}
              `}
            >
              {/* Date number */}
              <span
                className={`
                  text-xs sm:text-sm font-medium
                  w-6 h-6 sm:w-7 sm:h-7
                  flex items-center justify-center rounded-full
                  ${today ? 'bg-accent text-white' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Category dots */}
              {dots.length > 0 && (
                <div className="flex items-center gap-0.5 mt-1">
                  {dots.slice(0, MAX_DOTS).map((cat) => (
                    <span
                      key={cat}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: CATEGORIES[cat].dotColor }}
                      title={CATEGORIES[cat].name}
                    />
                  ))}
                  {dots.length > MAX_DOTS && (
                    <span className="flex gap-[1px]">
                      <span className="w-[3px] h-[3px] rounded-full bg-muted" />
                      <span className="w-[3px] h-[3px] rounded-full bg-muted" />
                      <span className="w-[3px] h-[3px] rounded-full bg-muted" />
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
