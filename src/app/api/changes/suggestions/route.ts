import { NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/db/queries';

const FALLBACK_SUGGESTIONS = ['API', 'model', 'Claude', 'deprecated'];

export async function GET() {
  const suggestions = await getSearchSuggestions(5);

  const chips = suggestions.length > 0
    ? suggestions
    : FALLBACK_SUGGESTIONS;

  const response = NextResponse.json({ suggestions: chips });
  response.headers.set('Cache-Control', 'public, s-maxage=3600');
  return response;
}
