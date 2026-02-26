import { NextRequest, NextResponse } from 'next/server';
import { getChangesByDate } from '@/db/queries';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'date parameter is required' }, { status: 400 });
  }

  try {
    const changes = await getChangesByDate(date);
    return NextResponse.json({ date, changes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
