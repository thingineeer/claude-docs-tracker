import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const category = searchParams.get('category');
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);

  const sb = getSupabaseAdmin();
  let query = sb
    .from('changes')
    .select('id, change_type, detected_at, diff_summary, is_silent, is_breaking, pages(title, url, domain, category)')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (from) query = query.gte('detected_at', from);
  if (to) query = query.lte('detected_at', to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by category in JS (since it's on the joined table)
  let changes = (data ?? []).map(c => {
    const page = c.pages as any;
    return {
      id: c.id,
      title: page?.title ?? 'Unknown',
      url: page?.url ?? '',
      change_type: c.change_type,
      category: page?.category ?? null,
      is_silent: c.is_silent ?? false,
      is_breaking: c.is_breaking ?? false,
      summary: c.diff_summary,
      detected_at: c.detected_at,
    };
  });

  if (category) {
    changes = changes.filter(c => c.category === category);
  }

  const response = NextResponse.json({
    changes,
    meta: { total: changes.length, from, to, category },
  });

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET');
  response.headers.set('Cache-Control', 'public, s-maxage=300');

  return response;
}
