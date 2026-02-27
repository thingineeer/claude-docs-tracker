'use client';

import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { DiffView } from './diff-view';
import { CategoryIcon } from '@/lib/category-icons';
import { getCategoryForPage, CATEGORIES } from '@/lib/categories';
import type { ChangeType } from '@/db/types';

interface ChangeCardProps {
  title: string;
  url: string;
  changeType: ChangeType;
  summary?: string | null;
  diffHtml?: string | null;
  detectedAt: string;
  highlightedTitle?: React.ReactNode;
  highlightedSummary?: React.ReactNode;
  isSilent?: boolean;
  isBreaking?: boolean;
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length <= 2) {
      return `${parsed.hostname}${parsed.pathname}`;
    }
    return `${parsed.hostname}/.../${segments[segments.length - 1]}`;
  } catch {
    return url;
  }
}

/**
 * Extract domain and section from a page URL for category detection.
 */
function extractCategoryInfo(url: string): { domain: string; section: string | null } {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const segments = parsed.pathname.split('/').filter(Boolean);
    // URL pattern: /docs/en/{section}/...
    const section = segments.length >= 3 && segments[0] === 'docs' && segments[1] === 'en'
      ? segments[2]
      : segments.length >= 1
        ? segments[0]
        : null;
    return { domain, section };
  } catch {
    return { domain: 'unknown', section: null };
  }
}

const changeTypeConfig: Record<ChangeType, { label: string; color: string; icon: string }> = {
  added: {
    label: 'New',
    color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    icon: '+',
  },
  modified: {
    label: 'Modified',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    icon: '~',
  },
  removed: {
    label: 'Removed',
    color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    icon: '-',
  },
  sidebar_changed: {
    label: 'Sidebar',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    icon: '#',
  },
};

export function ChangeCard({ title, url, changeType, summary, diffHtml, detectedAt, highlightedTitle, highlightedSummary, isSilent, isBreaking }: ChangeCardProps) {
  const [showDiff, setShowDiff] = useState(false);
  const config = changeTypeConfig[changeType];

  const { domain, section } = extractCategoryInfo(url);
  const categoryType = getCategoryForPage(domain, section);
  const categoryConfig = CATEGORIES[categoryType];

  // Compute relative time from detectedAt date
  const relativeTime = (() => {
    try {
      return formatDistanceToNow(parseISO(detectedAt), { addSuffix: true });
    } catch {
      return detectedAt;
    }
  })();

  return (
    <div className="rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/30 hover:shadow-sm transition-all p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category chip */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={{
                backgroundColor: `${categoryConfig.color}14`,
                color: categoryConfig.color,
              }}
            >
              <CategoryIcon category={categoryType} className="w-3 h-3" />
              {categoryConfig.name}
            </span>
          </div>

          {/* Badge + relative time */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
              <span className="mr-1 font-mono">{config.icon}</span>
              {config.label}
            </span>
            {isBreaking && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">
                Breaking
              </span>
            )}
            {isSilent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Silent Change
              </span>
            )}
            <span className="text-xs text-muted" title={detectedAt}>{relativeTime}</span>
          </div>

          <h3 className="font-medium truncate">{highlightedTitle ?? title}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-accent truncate block"
            title={url}
          >
            {shortenUrl(url)}
          </a>
          {(highlightedSummary || summary) && (
            <p className="text-sm text-muted mt-2">{highlightedSummary ?? summary}</p>
          )}
        </div>

        {diffHtml && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            aria-expanded={showDiff}
            aria-label={showDiff ? 'Hide diff view' : 'Show diff view'}
            className="shrink-0 text-sm text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg px-3 py-1.5 hover:bg-[var(--surface)] transition-all"
          >
            {showDiff ? 'Hide Diff' : 'Show Diff'}
          </button>
        )}
      </div>

      {showDiff && diffHtml && (
        <div className="mt-3">
          <DiffView diffHtml={diffHtml} />
        </div>
      )}
    </div>
  );
}
