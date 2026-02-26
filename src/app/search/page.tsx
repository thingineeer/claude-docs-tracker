'use client';

import { Suspense, useState, useEffect } from 'react';
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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  async function performSearch(q: string) {
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
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="space-y-6">
      <section className="pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted text-sm mt-1">
          Find documentation changes by title or summary
        </p>
      </section>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. vision, streaming, tool use..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-light transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-surface" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
          <svg className="w-10 h-10 text-muted/40 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
          <p className="text-muted text-sm">
            No results found for &quot;{initialQuery}&quot;
          </p>
        </div>
      )}

      {!loading && !searched && (
        <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
          <svg className="w-10 h-10 text-muted/40 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="text-muted text-sm">
            Search for documentation changes by keyword
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          {results.map((change) => (
            <ChangeCard
              key={change.id}
              title={change.pages?.title ?? 'Unknown'}
              url={change.pages?.url ?? '#'}
              changeType={change.change_type as ChangeType}
              summary={change.diff_summary}
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
        <div className="h-8 w-32 rounded bg-surface animate-pulse" />
        <div className="h-12 w-full rounded-lg bg-surface animate-pulse" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
