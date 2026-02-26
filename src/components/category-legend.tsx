'use client';

import type { CategoryType } from '@/lib/categories';

export interface CategoryLegendProps {
  activeCategories: Set<CategoryType>;
  onToggleCategory: (category: CategoryType) => void;
}

export function CategoryLegend(props: CategoryLegendProps) {
  return <div data-testid="category-legend">CategoryLegend placeholder</div>;
}
