import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyDigest } from '@/lib/weekly-digest';
import { apiError, apiInternalError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401);
  }

  try {
    const digest = await generateWeeklyDigest();
    if (!digest) {
      return NextResponse.json({ message: 'No changes this week, digest skipped' });
    }
    return NextResponse.json({ success: true, digest });
  } catch (error) {
    return apiInternalError(error);
  }
}
