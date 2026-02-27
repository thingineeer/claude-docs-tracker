import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';

export async function GET() {
  const sb = getSupabaseAdmin();

  const [pagesResult, changesResult, categoriesResult] = await Promise.all([
    sb.from('pages').select('*', { count: 'exact', head: true }),
    sb.from('changes').select('*', { count: 'exact', head: true }),
    sb.from('pages').select('category'),
  ]);

  const categoryDist: Record<string, number> = {};
  for (const p of categoriesResult.data ?? []) {
    const cat = p.category ?? 'uncategorized';
    categoryDist[cat] = (categoryDist[cat] ?? 0) + 1;
  }

  // Get today's changes
  const today = new Date().toISOString().split('T')[0];
  const { count: todayCount } = await sb
    .from('changes')
    .select('*', { count: 'exact', head: true })
    .eq('detected_at', today);

  const response = NextResponse.json({
    stats: {
      total_pages: pagesResult.count ?? 0,
      total_changes: changesResult.count ?? 0,
      today_changes: todayCount ?? 0,
      categories: categoryDist,
      tracked_domains: ['platform.claude.com', 'code.claude.com'],
    },
    meta: { generated_at: new Date().toISOString() },
  });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET');
  response.headers.set('Cache-Control', 'public, s-maxage=60');

  return response;
}
