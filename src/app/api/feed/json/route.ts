import { NextResponse } from 'next/server';
import { getLatestChanges } from '@/db/queries';
import { apiInternalError } from '@/lib/api-error';

export async function GET() {
  try {
    const changes = await getLatestChanges(30);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';

    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Claude Docs Tracker',
      home_page_url: siteUrl,
      feed_url: `${siteUrl}/api/feed/json`,
      description: 'Daily changes in Claude official documentation',
      items: changes.map((change) => {
        const page = change.pages as { title: string; url: string } | null;
        return {
          id: change.id,
          title: `${page?.title ?? 'Unknown'} (${change.change_type})`,
          url: page?.url ?? siteUrl,
          content_text: change.diff_summary ?? `Page ${change.change_type}`,
          date_published: change.created_at,
          tags: [change.change_type],
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
