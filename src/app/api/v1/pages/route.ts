import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const domain = searchParams.get('domain');

  const sb = getSupabaseAdmin();
  let query = sb
    .from('pages')
    .select('id, title, url, domain, section, category, last_crawled_at')
    .order('title', { ascending: true });

  if (category) query = query.eq('category', category);
  if (domain) query = query.eq('domain', domain);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({
    pages: data ?? [],
    meta: { total: (data ?? []).length, category, domain },
  });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET');
  response.headers.set('Cache-Control', 'public, s-maxage=300');

  return response;
}
