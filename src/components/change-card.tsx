'use client';

import { useState } from 'react';
import { DiffView } from './diff-view';
import type { ChangeType } from '@/db/types';

interface ChangeCardProps {
  title: string;
  url: string;
  changeType: ChangeType;
  summary?: string | null;
  diffHtml?: string | null;
  detectedAt: string;
}

const changeTypeConfig: Record<ChangeType, { label: string; color: string; icon: string }> = {
  added: { label: 'New', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '+' },
  modified: { label: 'Modified', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '~' },
  removed: { label: 'Removed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '-' },
  sidebar_changed: { label: 'Sidebar', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: '#' },
};

export function ChangeCard({ title, url, changeType, summary, diffHtml, detectedAt }: ChangeCardProps) {
  const [showDiff, setShowDiff] = useState(false);
  const config = changeTypeConfig[changeType];

  return (
    <div className="rounded-lg border border-border p-4 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
              <span className="mr-1 font-mono">{config.icon}</span>
              {config.label}
            </span>
            <span className="text-xs text-muted">{detectedAt}</span>
          </div>
          <h3 className="font-medium truncate">{title}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-accent truncate block"
          >
            {url}
          </a>
          {summary && <p className="text-sm text-muted mt-2">{summary}</p>}
        </div>

        {diffHtml && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="shrink-0 text-xs px-3 py-1.5 rounded border border-border hover:border-accent hover:text-accent transition-colors"
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
