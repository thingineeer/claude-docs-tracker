'use client';

import type { CategoryType } from '@/lib/categories';
import type { ChangeType } from '@/db/types';

export interface DayChange {
  id: string;
  category: CategoryType;
  changeType: ChangeType;
  title: string;
  summary: string | null;
  url: string;
  formattedSummary: string;
}

export interface DayDetailProps {
  date: string;
  changes: DayChange[];
  grouped: Partial<Record<CategoryType, DayChange[]>>;
  activeCategories: Set<CategoryType>;
  loading?: boolean;
}

export function DayDetail(props: DayDetailProps) {
  return <div data-testid="day-detail">DayDetail placeholder</div>;
}
