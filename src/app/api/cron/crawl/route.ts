import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/crawler/pipeline';
import { generateDailySummary } from '@/lib/ai-summary';
import { sendNotifications, sendCrawlFailureAlert } from '@/lib/notifications';
import { apiError, apiInternalError } from '@/lib/api-error';

export const maxDuration = 60;

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

    const response: Record<string, unknown> = {
      success: true,
      duration: result.duration,
      totalUrls: result.totalUrls,
      crawled: result.crawled,
      newPages: result.newPages,
      modifiedPages: result.modifiedPages,
      removedPages: result.removedPages,
      unchanged: result.unchanged,
      errors: result.errors,
      githubReleases: result.githubReleases,
      anthropicNews: result.anthropicNews,
    };

    if (result.githubError) {
      response.githubError = result.githubError;
    }

    if (result.breakingChanges && result.breakingChanges.length > 0) {
      response.breakingChanges = result.breakingChanges;
    }

    return NextResponse.json(response);
  } catch (error) {
    await sendCrawlFailureAlert(error).catch(console.error);
    return apiInternalError(error);
  }
}
