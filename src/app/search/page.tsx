'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChangeCard } from '@/components/change-card';
import type { ChangeType } from '@/db/types';

interface SearchResult {
  id: string;
  change_type: string;
  diff_summary: string | null;
  diff_html: string | null;
  detected_at: string;
  pages: { title: string; url: string } | null;
}

const SUGGESTION_CHIPS = ['Claude Code', 'API', 'prompt', 'model'];

/**
 * XSS-safe keyword highlighting.
 * Splits text by the query and wraps matching segments in styled spans.
 * Does NOT use dangerouslySetInnerHTML or innerHTML.
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[var(--accent)]/20 text-[var(--foreground)] rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/changes?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.changes ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams, performSearch]);

  // Focus input on mount if navigated via Command-K
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[data-search-input]');
    input?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleChipClick(chip: string) {
    setQuery(chip);
    router.push(`/search?q=${encodeURIComponent(chip)}`);
  }

  const activeQuery = searchParams.get('q') ?? '';

  return (
    <div className="space-y-6">
      <section className="pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-[var(--muted)] text-sm mt-1">
          Find documentation changes by title or summary
        </p>
      </section>

      <form onSubmit={handleSubmit}>
        <div className="relative rounded-xl border border-[var(--border)] focus-within:border-[var(--accent)] bg-[var(--surface)]/30 px-4 py-3 transition-colors">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-[var(--muted)] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              data-search-input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentation changes..."
              className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]/60 focus:outline-none"
            />
            {loading && (
              <svg
                className="w-5 h-5 text-[var(--accent)] animate-spin shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[10px] text-[var(--muted)] font-mono shrink-0">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </div>
        </div>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl skeleton" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 text-center">
          <svg className="w-10 h-10 text-[var(--muted)]/40 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
          <p className="text-[var(--muted)] text-sm">
            No results found for &quot;{activeQuery}&quot;
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 text-center">
          <svg className="w-10 h-10 text-[var(--muted)]/40 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="text-[var(--muted)] text-sm mb-4">
            Search for documentation changes by keyword
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-xs text-[var(--muted)]/60 mr-1 self-center">Try:</span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Found {results.length} change{results.length !== 1 ? 's' : ''} matching &quot;{activeQuery}&quot;
          </p>
          {results.map((change) => (
            <ChangeCard
              key={change.id}
              title={change.pages?.title ?? 'Unknown'}
              url={change.pages?.url ?? '#'}
              changeType={change.change_type as ChangeType}
              summary={
                change.diff_summary && activeQuery
                  ? undefined
                  : change.diff_summary
              }
              highlightedSummary={
                change.diff_summary && activeQuery ? (
                  <HighlightedText text={change.diff_summary} query={activeQuery} />
                ) : undefined
              }
              highlightedTitle={
                activeQuery ? (
                  <HighlightedText text={change.pages?.title ?? 'Unknown'} query={activeQuery} />
                ) : undefined
              }
              diffHtml={change.diff_html}
              detectedAt={change.detected_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 pt-4">
        <div className="h-8 w-32 rounded skeleton" />
        <div className="h-14 w-full rounded-xl skeleton" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
