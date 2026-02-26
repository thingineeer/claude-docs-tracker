'use client';

import { CATEGORIES, CATEGORY_ORDER } from '@/lib/categories';
import { CategoryIcon } from '@/lib/category-icons';

interface CategoryLegendProps {
  activeCategories: Set<string>;
  onToggle: (category: string) => void;
}

export function CategoryLegend({ activeCategories, onToggle }: CategoryLegendProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((cat) => {
        const config = CATEGORIES[cat];
        const active = activeCategories.has(cat);

        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5
              rounded-full border border-border
              text-xs font-medium
              transition-all
              hover:border-accent/50
              ${active ? 'opacity-100' : 'opacity-30'}
            `}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: config.dotColor }}
            />
            <CategoryIcon category={cat} className="w-3.5 h-3.5" />
            <span>{config.name}</span>
          </button>
        );
      })}
    </div>
  );
}
