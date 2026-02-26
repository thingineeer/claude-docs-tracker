import { NextResponse } from 'next/server';

/**
 * Helper function to return standardized API error responses
 */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Helper function to return standardized internal server error responses
 */
export function apiInternalError(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Internal server error' },
    { status: 500 },
  );
}
