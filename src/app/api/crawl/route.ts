import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/crawler/pipeline';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = (body as { dryRun?: boolean }).dryRun ?? false;
    const maxPages = (body as { maxPages?: number }).maxPages;

    const result = await runPipeline({ dryRun, maxPages });

    return NextResponse.json({
      success: true,
      result: {
        totalUrls: result.totalUrls,
        crawled: result.crawled,
        newPages: result.newPages,
        modifiedPages: result.modifiedPages,
        unchanged: result.unchanged,
        errors: result.errors,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
