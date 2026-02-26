'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function CommandK() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/search');
        // Focus the search input after navigation
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[data-search-input]');
          input?.focus();
        }, 100);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null;
}
