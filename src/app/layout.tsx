import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CommandK } from '@/components/command-k';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Claude Docs Tracker',
    template: '%s - Claude Docs Tracker',
  },
  description: 'Daily documentation change tracker for Claude API, Claude Code, and Claude Apps',
  openGraph: {
    title: 'Claude Docs Tracker',
    description: 'Daily documentation change tracker for Claude API, Claude Code, and Claude Apps',
    url: 'https://claude-docs-tracker.vercel.app',
    siteName: 'Claude Docs Tracker',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Claude Docs Tracker',
    description: 'Daily documentation change tracker for Claude API, Claude Code, and Claude Apps',
  },
  metadataBase: new URL('https://claude-docs-tracker.vercel.app'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 scroll-mt-16">{children}</main>
        <Footer />
        <CommandK />
      </body>
    </html>
  );
}
