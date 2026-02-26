import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/crawler/pipeline';
import { generateDailySummary } from '@/lib/ai-summary';
import { sendNotifications } from '@/lib/notifications';
import { apiError, apiInternalError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401);
  }

  try {
    const result = await runPipeline();

    if (result.newPages + result.modifiedPages > 0) {
      await generateDailySummary(result.results).catch(console.error);
      await sendNotifications(result).catch(console.error);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return apiInternalError(error);
  }
}
