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
import { enUS } from 'date-fns/locale/en-US';
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
          className="rounded-lg p-2 hover:bg-surface transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: enUS })}
        </h2>
        <button
          onClick={handleNext}
          className="rounded-lg p-2 hover:bg-surface transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 4l6 6-6 6" />
          </svg>
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
                group relative flex flex-col items-center justify-start
                p-1 sm:p-2 min-h-[80px] md:min-h-[100px]
                rounded-lg transition-all duration-200 cursor-pointer
                ${!inMonth ? 'opacity-30' : ''}
                ${today && !selected ? 'bg-accent/10 border-2 border-accent rounded-lg' : ''}
                ${selected ? 'ring-2 ring-accent bg-surface' : ''}
                ${!selected && !today ? 'hover:bg-surface/70' : ''}
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
                      className="w-2 h-2 rounded-full transition-all duration-200 group-hover:w-2.5 group-hover:h-2.5"
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
