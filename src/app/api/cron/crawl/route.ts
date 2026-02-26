import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/crawler/pipeline';
import { generateDailySummary } from '@/lib/ai-summary';
import { sendNotifications } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPipeline();

    if (result.newPages + result.modifiedPages > 0) {
      await generateDailySummary(result.results).catch(console.error);
      await sendNotifications(result).catch(console.error);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Crawl failed' },
      { status: 500 },
    );
  }
}
