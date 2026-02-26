'use client';

import type { CategoryType } from '@/lib/categories';

export interface CalendarDayData {
  total: number;
  categories: Partial<Record<CategoryType, number>>;
}

export interface CalendarGridProps {
  year: number;
  month: number;
  days: Record<string, CalendarDayData>;
  selectedDate: string | null;
  activeCategories: Set<CategoryType>;
  onSelectDate: (date: string) => void;
}

export function CalendarGrid(props: CalendarGridProps) {
  return <div data-testid="calendar-grid">CalendarGrid placeholder</div>;
}
