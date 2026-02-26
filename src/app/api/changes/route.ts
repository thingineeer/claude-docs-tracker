import { NextRequest, NextResponse } from 'next/server';
import { getChangesByDate, searchChanges } from '@/db/queries';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const query = request.nextUrl.searchParams.get('q');

  try {
    if (query) {
      const changes = await searchChanges(query);
      return NextResponse.json({ query, changes });
    }

    if (!date) {
      return NextResponse.json({ error: 'date or q parameter is required' }, { status: 400 });
    }

    const changes = await getChangesByDate(date);
    return NextResponse.json({ date, changes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
