'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  onToggleTheme: () => void;
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/search', label: 'Search' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function MobileNav({ open, onClose, dark, onToggleTheme }: MobileNavProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scroll when drawer is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[80vw] shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 h-14"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--muted)' }}
          >
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: 'var(--muted)' }}
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2.5 rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
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

        {/* Dark mode toggle */}
        <div
          className="mx-4 px-3 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: 'var(--muted)' }}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span
              className="relative w-5 h-5"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {/* Sun icon */}
              <svg
                className="w-5 h-5 absolute transition-all duration-300"
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
              {/* Moon icon */}
              <svg
                className="w-5 h-5 absolute transition-all duration-300"
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
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
