'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { href: '/', label: 'Today' },
    { href: '/changes', label: 'History' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/sidebar-diff', label: 'Sidebar Diff' },
    { href: '/search', label: 'Search', icon: true },
    { href: '/api/feed/rss', label: 'RSS', external: true },
  ];

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex h-12 sm:h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2 font-semibold text-base sm:text-lg shrink-0">
            <span className="text-accent">{'{'}</span>
            <span className="hidden sm:inline">Claude Docs Tracker</span>
            <span className="sm:hidden">CDT</span>
            <span className="text-accent">{'}'}</span>
          </Link>

          {/* Desktop nav — hidden below sm (640px) */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-accent transition-colors"
                {...(link.external ? { target: '_blank' } : {})}
              >
                {link.icon ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ) : (
                  link.label
                )}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Dark mode toggle — always visible */}
            <button
              className="p-2 hover:text-accent transition-colors"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Hamburger — ONLY visible below sm (640px) */}
            <button
              className="sm:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu — ONLY visible below sm (640px) */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-200 ease-in-out ${
            mobileOpen ? 'max-h-96 pb-3 border-t border-border mt-1' : 'max-h-0'
          }`}
        >
          <div className="flex flex-col gap-1 pt-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-md hover:bg-surface transition-colors"
                {...(link.external ? { target: '_blank' } : {})}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
