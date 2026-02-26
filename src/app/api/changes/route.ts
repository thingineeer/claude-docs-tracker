import { NextRequest, NextResponse } from 'next/server';
import { getChangesByDate, searchChanges } from '@/db/queries';
import { apiError, apiInternalError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const query = request.nextUrl.searchParams.get('q');

  try {
    if (query) {
      if (query.length > 200) {
        return apiError('query too long (max 200 characters)', 400);
      }
      const changes = await searchChanges(query.trim());
      return NextResponse.json({ query, changes });
    }

    if (!date) {
      return apiError('date or q parameter is required', 400);
    }

    const changes = await getChangesByDate(date);
    return NextResponse.json({ date, changes });
  } catch (error) {
    return apiInternalError(error);
  }
}
