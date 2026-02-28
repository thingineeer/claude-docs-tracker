import { NextResponse } from 'next/server';
import { getLatestChanges } from '@/db/queries';
import { getCategoryForPage } from '@/lib/categories';
import { apiInternalError } from '@/lib/api-error';

export async function GET() {
  try {
    const changes = await getLatestChanges(30);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';

    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Claude Patch Notes',
      home_page_url: siteUrl,
      feed_url: `${siteUrl}/api/feed/json`,
      description: 'Official releases and undocumented changes to Claude\'s APIs, tools, and documentation',
      items: changes.map((change) => {
        const page = change.pages as { title: string; url: string; domain?: string; section?: string | null } | null;
        const pageTitle = page?.title ?? 'Unknown';
        const breakingPrefix = change.is_breaking ? '[BREAKING] ' : '';
        const title = `${breakingPrefix}${pageTitle} (${change.change_type})`;

        // Build content text
        const contentParts: string[] = [];
        if (change.diff_summary) {
          contentParts.push(change.diff_summary);
        } else {
          contentParts.push(`Page ${change.change_type}`);
        }
        if (change.is_silent) {
          contentParts.push('(silent change)');
        }
        const contentText = contentParts.join(' ');

        // Determine category from page data
        const domain = page?.domain ?? 'unknown';
        const section = page?.section ?? null;
        const category = getCategoryForPage(domain, section);

        return {
          id: change.id,
          title,
          url: page?.url ?? siteUrl,
          external_url: `${siteUrl}/changes/${change.detected_at}`,
          content_text: contentText,
          date_published: change.created_at,
          tags: [change.change_type, category],
          _breaking: change.is_breaking,
          _silent: change.is_silent,
        };
      }),
    };

    return NextResponse.json(feed, {
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return apiInternalError(error);
  }
}
