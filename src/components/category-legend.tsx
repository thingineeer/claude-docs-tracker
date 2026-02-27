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
            title={config.description}
            className={`
              inline-flex items-center gap-1.5 px-3 py-2
              rounded-full border
              text-xs font-medium
              transition-all duration-200
              ${active
                ? 'opacity-100 border-border hover:border-accent/50'
                : 'opacity-40 border-border/50 line-through decoration-muted/40'}
            `}
            style={active ? { backgroundColor: `${config.color}10` } : undefined}
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
