import type { ChangeType } from '@/db/types';
import { getCategoryForPage, CATEGORY_CONFIG, type CategoryType } from './categories';

const CHANGE_TYPE_EMOJI: Record<ChangeType, string> = {
  added: '\u2795',
  modified: '\ud83d\udce1',
  removed: '\u274c',
  sidebar_changed: '\ud83d\udcc2',
};

export function formatChangeSummary(change: {
  change_type: ChangeType;
  diff_summary: string | null;
  pages: {
    title: string;
    domain: string;
    section: string | null;
    url: string;
  };
}): string {
  const emoji = CHANGE_TYPE_EMOJI[change.change_type] ?? '\ud83d\udcdd';
  const category = getCategoryForPage(change.pages);
  const categoryLabel = CATEGORY_CONFIG[category].label;
  const summary = change.diff_summary ?? change.pages.title;

  return `${emoji} ${categoryLabel} \u2014 ${summary}`;
}

export function groupChangesByCategory<
  T extends {
    pages: { domain: string; section: string | null; url: string };
  },
>(changes: T[]): Record<CategoryType, T[]> {
  const grouped: Record<CategoryType, T[]> = {
    'api-reference': [],
    'claude-code': [],
    guides: [],
    'release-notes': [],
    support: [],
    other: [],
  };

  for (const change of changes) {
    const category = getCategoryForPage(change.pages);
    grouped[category].push(change);
  }

  return grouped;
}
