'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-accent">{'{'}</span>
            <span>Claude Docs Tracker</span>
            <span className="text-accent">{'}'}</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-accent transition-colors">
              Today
            </Link>
            <Link href="/changes" className="hover:text-accent transition-colors">
              History
            </Link>
            <Link href="/sidebar-diff" className="hover:text-accent transition-colors">
              Sidebar Diff
            </Link>
            <Link href="/search" className="hover:text-accent transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link
              href="/api/feed/rss"
              className="hover:text-accent transition-colors"
              target="_blank"
            >
              RSS
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3 text-sm">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              Today
            </Link>
            <Link href="/changes" onClick={() => setMobileOpen(false)}>
              History
            </Link>
            <Link href="/sidebar-diff" onClick={() => setMobileOpen(false)}>
              Sidebar Diff
            </Link>
            <Link href="/search" onClick={() => setMobileOpen(false)}>
              Search
            </Link>
            <Link href="/api/feed/rss" target="_blank" onClick={() => setMobileOpen(false)}>
              RSS
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
