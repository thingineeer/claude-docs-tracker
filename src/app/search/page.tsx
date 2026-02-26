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
      <h1 className="text-2xl font-bold">Search Changes</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or summary..."
          className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-light transition-colors"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-muted text-sm">Searching...</p>}

      {!loading && initialQuery && results.length === 0 && (
        <p className="text-muted text-sm">No results found for &quot;{initialQuery}&quot;.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
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
    <Suspense fallback={<div className="text-muted text-sm">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
