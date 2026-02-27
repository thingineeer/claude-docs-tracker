import { NextResponse } from 'next/server';
import { getLatestChanges } from '@/db/queries';
import { apiInternalError } from '@/lib/api-error';

export async function GET() {
  try {
    const changes = await getLatestChanges(30);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';

    const items = changes
      .map((change) => {
        const page = change.pages as { title: string; url: string } | null;
        return `    <item>
      <title>${escapeXml(page?.title ?? 'Unknown')} (${change.change_type})</title>
      <link>${escapeXml(page?.url ?? siteUrl)}</link>
      <description>${escapeXml(change.diff_summary ?? `Page ${change.change_type}`)}</description>
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
    <description>Daily changes in Claude official documentation</description>
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
