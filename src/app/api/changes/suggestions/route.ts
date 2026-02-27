import { NextResponse } from 'next/server';
import { getRecentPageTitles } from '@/db/queries';

export async function GET() {
  const suggestions = await getRecentPageTitles(5);

  // Fallback if no data
  const chips = suggestions.length > 0
    ? suggestions
    : ['Claude Code', 'API', 'prompt', 'model'];

  const response = NextResponse.json({ suggestions: chips });
  response.headers.set('Cache-Control', 'public, s-maxage=3600');
  return response;
}
