import { NextResponse } from 'next/server';
import { getPageHistory } from '@/db/queries';
import { apiInternalError } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;

  try {
    const history = await getPageHistory(pageId);
    return NextResponse.json({ pageId, history });
  } catch (error) {
    return apiInternalError(error);
  }
}
