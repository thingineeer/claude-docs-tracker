import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';
import { getCategoryForPage, type CategoryType } from '@/lib/categories';

interface DayEntry {
  total: number;
  categories: Partial<Record<CategoryType, number>>;
}

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get('year');
  const monthParam = request.nextUrl.searchParams.get('month');

  if (!yearParam || !monthParam) {
    return NextResponse.json(
      { error: 'year and month parameters are required' },
      { status: 400 },
    );
  }

  const year = parseInt(yearParam, 10);
  const month = parseInt(monthParam, 10);

  if (isNaN(year) || isNaN(month) || year < 2020 || year > 2099 || month < 1 || month > 12) {
    return NextResponse.json(
      { error: 'invalid year or month value' },
      { status: 400 },
    );
  }

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('changes')
      .select('detected_at, pages(domain, section)')
      .gte('detected_at', monthStart)
      .lt('detected_at', monthEnd)
      .order('detected_at', { ascending: true });

    if (error) {
      throw error;
    }

    const days: Record<string, DayEntry> = {};

    for (const row of data ?? []) {
      const date = row.detected_at;
      const page = row.pages as unknown as { domain: string; section: string | null } | null;

      if (!date || !page) continue;

      if (!days[date]) {
        days[date] = { total: 0, categories: {} };
      }

      days[date].total += 1;

      const category = getCategoryForPage(page.domain, page.section);
      days[date].categories[category] = (days[date].categories[category] ?? 0) + 1;
    }

    return NextResponse.json({ year, month, days });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
