import type { ChangeType } from '@/db/types';

const FALLBACK_LABELS: Record<ChangeType, string> = {
  added: 'New page added',
  modified: 'Content updated',
  removed: 'Page removed',
  sidebar_changed: 'Sidebar structure changed',
};

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function formatChangeSummary(params: {
  title: string;
  changeType: ChangeType;
  diffSummary: string | null;
  categoryEmoji: string;
  maxLength?: number;
}): string {
  const { title, changeType, diffSummary, categoryEmoji, maxLength = 80 } = params;

  if (diffSummary && diffSummary.trim().length > 0) {
    const formatted = `${categoryEmoji} ${title} — ${diffSummary.trim()}`;
    return truncate(formatted, maxLength);
  }

  const fallback = FALLBACK_LABELS[changeType];
  const formatted = `${categoryEmoji} ${title} — ${fallback}`;
  return truncate(formatted, maxLength);
}

export function getChangeTypeIcon(changeType: ChangeType): { icon: string; color: string } {
  switch (changeType) {
    case 'added':
      return { icon: '+', color: 'text-green-600' };
    case 'modified':
      return { icon: '~', color: 'text-blue-600' };
    case 'removed':
      return { icon: '-', color: 'text-red-600' };
    case 'sidebar_changed':
      return { icon: '#', color: 'text-purple-600' };
  }
}

export function getChangeTypeLabel(changeType: ChangeType): string {
  switch (changeType) {
    case 'added':
      return 'New';
    case 'modified':
      return 'Modified';
    case 'removed':
      return 'Removed';
    case 'sidebar_changed':
      return 'Sidebar';
  }
}
