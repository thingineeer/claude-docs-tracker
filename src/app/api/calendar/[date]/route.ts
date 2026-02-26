import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/db/supabase';
import { getCategoryForPage, type CategoryType } from '@/lib/categories';
import { formatChangeSummary } from '@/lib/format-change-summary';
import { validateDateString } from '@/lib/calendar-utils';
import { apiError, apiInternalError } from '@/lib/api-error';
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

  if (!validateDateString(date)) {
    return apiError('invalid date format or value, expected YYYY-MM-DD', 400);
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
    return apiInternalError(error);
  }
}
