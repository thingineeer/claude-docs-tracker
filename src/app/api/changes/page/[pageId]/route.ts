import { NextResponse } from 'next/server';
import { getPageHistory } from '@/db/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;

  try {
    const history = await getPageHistory(pageId);
    return NextResponse.json({ pageId, history });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
