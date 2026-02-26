import { NextResponse } from 'next/server';
import { getLatestChanges } from '@/db/queries';

export async function GET() {
  try {
    const changes = await getLatestChanges(50);
    return NextResponse.json({ changes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
