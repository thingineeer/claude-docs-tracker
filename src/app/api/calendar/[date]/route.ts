import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';
import { getCategoryForPage, type CategoryType } from '@/lib/categories';
import { formatChangeSummary } from '@/lib/format-change-summary';
import type { ChangeType } from '@/db/types';

interface ChangeItem {
  id: string;
  category: CategoryType;
  changeType: ChangeType;
  title: string;
  summary: string | null;
  url: string;
  formattedSummary: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'invalid date format, expected YYYY-MM-DD' },
      { status: 400 },
    );
  }

  const [yearStr, monthStr, dayStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return NextResponse.json(
      { error: 'invalid date value' },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('changes')
      .select('id, change_type, diff_summary, detected_at, pages(title, domain, section, url)')
      .eq('detected_at', date)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const changes: ChangeItem[] = [];
    const grouped: Partial<Record<CategoryType, ChangeItem[]>> = {};

    for (const row of data ?? []) {
      const page = row.pages as unknown as {
        title: string;
        domain: string;
        section: string | null;
        url: string;
      } | null;

      if (!page) continue;

      const category = getCategoryForPage(page.domain, page.section);
      const formattedSummary = formatChangeSummary({
        title: page.title,
        changeType: row.change_type as ChangeType,
        diffSummary: row.diff_summary,
        categoryEmoji: '',
      });

      const item: ChangeItem = {
        id: row.id,
        category,
        changeType: row.change_type as ChangeType,
        title: page.title,
        summary: row.diff_summary,
        url: page.url,
        formattedSummary,
      };

      changes.push(item);

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(item);
    }

    return NextResponse.json({ date, changes, grouped });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
