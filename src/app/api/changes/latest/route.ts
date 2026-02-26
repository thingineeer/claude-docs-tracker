import { NextResponse } from 'next/server';
import { getLatestChanges } from '@/db/queries';
import { apiInternalError } from '@/lib/api-error';

export async function GET() {
  try {
    const changes = await getLatestChanges(50);
    return NextResponse.json({ changes });
  } catch (error) {
    return apiInternalError(error);
  }
}
