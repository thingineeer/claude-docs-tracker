'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { MobileNav } from '@/components/mobile-nav';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/search', label: 'Search' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDark(true);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-lg shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {/* Sparkle icon */}
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--accent)' }}
              >
                <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" />
                <path d="M18 14l1.05 3.15L22.18 18.5l-3.13.85L18 22.5l-1.05-3.15L13.82 18.5l3.13-.85L18 14z" opacity="0.6" />
              </svg>
              <span>Claude Docs Tracker</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      active ? 'font-medium' : ''
                    }`}
                    style={
                      active
                        ? { backgroundColor: 'var(--surface)', color: 'var(--foreground)' }
                        : { color: 'var(--muted)' }
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Dark mode toggle */}
              <button
                className="p-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={toggleTheme}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{ color: 'var(--muted)' }}
              >
                <span className="relative block w-5 h-5">
                  {/* Sun icon — visible in dark mode */}
                  <svg
                    className="w-5 h-5 absolute inset-0 transition-all duration-300"
                    style={{
                      opacity: dark ? 1 : 0,
                      transform: dark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {/* Moon icon — visible in light mode */}
                  <svg
                    className="w-5 h-5 absolute inset-0 transition-all duration-300"
                    style={{
                      opacity: dark ? 0 : 1,
                      transform: dark ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </span>
              </button>

              {/* Hamburger button — mobile only */}
              <button
                className="md:hidden p-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                style={{ color: 'var(--muted)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        open={mobileOpen}
        onClose={closeMobile}
        dark={dark}
        onToggleTheme={toggleTheme}
      />
    </>
  );
}
