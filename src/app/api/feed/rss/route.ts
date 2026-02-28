import { NextResponse } from 'next/server';
import { getLatestChanges } from '@/db/queries';
import { getCategoryForPage } from '@/lib/categories';
import { apiInternalError } from '@/lib/api-error';

export async function GET() {
  try {
    const changes = await getLatestChanges(30);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';

    const items = changes
      .map((change) => {
        const page = change.pages as { title: string; url: string; domain?: string; section?: string | null } | null;
        const pageTitle = page?.title ?? 'Unknown';
        const breakingPrefix = change.is_breaking ? '[BREAKING] ' : '';
        const title = `${breakingPrefix}${pageTitle} (${change.change_type})`;

        const descriptionParts: string[] = [];
        if (change.diff_summary) {
          descriptionParts.push(change.diff_summary);
        } else {
          descriptionParts.push(`Page ${change.change_type}`);
        }
        if (change.is_silent) {
          descriptionParts.push('(silent change)');
        }
        const description = descriptionParts.join(' ');

        // Determine category from page data
        const domain = page?.domain ?? 'unknown';
        const section = page?.section ?? null;
        const category = getCategoryForPage(domain, section);

        const changesPageLink = `${siteUrl}/changes/${change.detected_at}`;

        return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(page?.url ?? siteUrl)}</link>
      <description>${escapeXml(description)}

View all changes for this day: ${escapeXml(changesPageLink)}</description>
      <category>${escapeXml(category)}</category>
      <pubDate>${new Date(change.created_at).toUTCString()}</pubDate>
      <guid>${siteUrl}/changes/${change.detected_at}#${change.id}</guid>
    </item>`;
      })
      .join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Claude Patch Notes</title>
    <link>${siteUrl}</link>
    <description>Official releases and undocumented changes to Claude's APIs, tools, and documentation</description>
    <language>en</language>
    <atom:link href="${siteUrl}/api/feed/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
