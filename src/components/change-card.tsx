'use client';

import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { DiffView } from './diff-view';
import { getCategoryForPage, CATEGORIES } from '@/lib/categories';
import type { ChangeType } from '@/db/types';

interface ChangeCardProps {
  title: string;
  url: string;
  changeType: ChangeType;
  summary?: string | null;
  diffHtml?: string | null;
  detectedAt: string;
  createdAt?: string;
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

export function ChangeCard({ title, url, changeType, summary, diffHtml, detectedAt, createdAt, highlightedTitle, highlightedSummary, isSilent, isBreaking }: ChangeCardProps) {
  const [showDiff, setShowDiff] = useState(false);
  const config = changeTypeConfig[changeType];

  const { domain, section } = extractCategoryInfo(url);
  const categoryType = getCategoryForPage(domain, section);
  const categoryConfig = CATEGORIES[categoryType];

  // Compute relative time — prefer createdAt (precise timestamp) over detectedAt (date only)
  const relativeTime = (() => {
    try {
      const timestamp = createdAt ?? detectedAt;
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch {
      return detectedAt;
    }
  })();

  return (
    <div className="rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/20 transition-all duration-200 p-4">
      {/* Row 1: category dot + title + time */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: categoryConfig.color }}
          title={categoryConfig.name}
        />
        <h3 className="font-medium truncate flex-1 min-w-0">{highlightedTitle ?? title}</h3>
        <span className="text-xs text-muted shrink-0" title={detectedAt}>{relativeTime}</span>
      </div>

      {/* Row 2: shortened url */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted hover:text-accent truncate block ml-4"
        title={url}
      >
        {shortenUrl(url)}
      </a>

      {/* Row 3: summary */}
      {(highlightedSummary || summary) && (
        <p className="text-sm text-muted mt-1 ml-4 line-clamp-1">{highlightedSummary ?? summary}</p>
      )}

      {/* Row 4: change type + badges + show diff */}
      <div className="flex items-center gap-2 mt-2 ml-4 flex-wrap">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color}`}>
          <span className="mr-0.5 font-mono">{config.icon}</span>
          {config.label}
        </span>
        {isBreaking && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-600 text-white">
            Breaking
          </span>
        )}
        {isSilent && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Silent
          </span>
        )}
        {diffHtml && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            aria-expanded={showDiff}
            aria-label={showDiff ? 'Hide diff view' : 'Show diff view'}
            className="text-xs text-[var(--accent)] hover:underline transition-colors ml-auto"
          >
            {showDiff ? 'Hide diff' : 'Show diff \u2192'}
          </button>
        )}
      </div>

      {/* Diff expand with transition */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${showDiff && diffHtml ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
      >
        {diffHtml && <DiffView diffHtml={diffHtml} />}
      </div>
    </div>
  );
}
