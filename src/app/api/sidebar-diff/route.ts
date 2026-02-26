import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to date parameters are required' },
      { status: 400 },
    );
  }

  try {
    const db = getSupabaseAdmin();
    const { data: changes, error } = await db
      .from('changes')
      .select('*, pages(*)')
      .eq('change_type', 'sidebar_changed')
      .gte('detected_at', from)
      .lte('detected_at', to)
      .order('detected_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ from, to, changes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
