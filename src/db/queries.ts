import { getSupabaseAdmin } from './supabase';
import type { ChangeType } from './types';

export async function upsertPage(page: {
  url: string;
  domain: string;
  section: string | null;
  title: string;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from('pages')
    .upsert({ ...page, last_crawled_at: new Date().toISOString() }, { onConflict: 'url' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertSnapshot(snapshot: {
  page_id: string;
  content_hash: string;
  content_text: string;
  sidebar_tree: Record<string, unknown> | null;
  crawled_at: string;
}) {
  const { data, error } = await getSupabaseAdmin().from('snapshots').insert(snapshot).select().single();

  if (error) throw error;
  return data;
}

export async function getLatestSnapshot(pageId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('snapshots')
    .select()
    .eq('page_id', pageId)
    .order('crawled_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function insertChange(change: {
  page_id: string;
  snapshot_before_id: string | null;
  snapshot_after_id: string;
  change_type: ChangeType;
  diff_html: string | null;
  diff_summary: string | null;
  detected_at: string;
}) {
  const { data, error } = await getSupabaseAdmin().from('changes').insert(change).select().single();

  if (error) throw error;
  return data;
}

export async function getChangesByDate(date: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('*, pages(*)')
    .eq('detected_at', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getLatestChanges(limit = 20) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('*, pages(*)')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getPageHistory(pageId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('*, snapshots!changes_snapshot_after_id_fkey(*)')
    .eq('page_id', pageId)
    .order('detected_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function upsertDailyReport(report: {
  report_date: string;
  total_changes: number;
  new_pages: number;
  modified_pages: number;
  removed_pages: number;
  ai_summary: string | null;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_reports')
    .upsert(report, { onConflict: 'report_date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDailyReport(date: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_reports')
    .select()
    .eq('report_date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getRecentReports(days = 7) {
  const { data, error } = await getSupabaseAdmin()
    .from('daily_reports')
    .select()
    .order('report_date', { ascending: false })
    .limit(days);

  if (error) throw error;
  return data;
}

export async function searchChanges(query: string, limit = 50) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('*, pages!inner(*)')
    .or(`diff_summary.ilike.%${query}%,pages.title.ilike.%${query}%`)
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback: search only in diff_summary if foreign table filter fails
    const { data: fallbackData, error: fallbackError } = await getSupabaseAdmin()
      .from('changes')
      .select('*, pages(*)')
      .ilike('diff_summary', `%${query}%`)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (fallbackError) throw fallbackError;
    return fallbackData;
  }
  return data;
}
