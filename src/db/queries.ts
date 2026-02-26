import { getSupabaseAdmin } from './supabase';
import type { ChangeType } from './types';

export async function upsertPage(page: {
  url: string;
  domain: string;
  section: string | null;
  title: string;
  category?: string | null;
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

export async function getChangesByMonth(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('id, change_type, detected_at, diff_summary, pages(id, title, url, domain, section, category)')
    .gte('detected_at', startDate)
    .lt('detected_at', endDate)
    .order('detected_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getChangesByDateWithPages(date: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('id, change_type, detected_at, diff_summary, diff_html, pages(id, title, url, domain, section, category)')
    .eq('detected_at', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPageCount() {
  const { count, error } = await getSupabaseAdmin()
    .from('pages')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function getTodayStats(today: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('change_type')
    .eq('detected_at', today);

  if (error) throw error;

  const stats = { new_pages: 0, modified_pages: 0, removed_pages: 0, total: 0 };
  for (const row of data ?? []) {
    stats.total++;
    if (row.change_type === 'added') stats.new_pages++;
    else if (row.change_type === 'modified') stats.modified_pages++;
    else if (row.change_type === 'removed') stats.removed_pages++;
  }
  return stats;
}

export async function getRecentChangeCounts(days = 7) {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const startDate = dates[0];
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('detected_at')
    .gte('detected_at', startDate)
    .order('detected_at', { ascending: true });

  if (error) throw error;

  const countMap: Record<string, number> = {};
  for (const row of data ?? []) {
    countMap[row.detected_at] = (countMap[row.detected_at] ?? 0) + 1;
  }

  return dates.map((date) => ({ date, count: countMap[date] ?? 0 }));
}

export function getCategoryFromPage(domain: string, section: string | null): string {
  if (domain === 'code.claude.com') {
    if (section === 'overview' || section === 'quickstart') return 'platform-docs';
    if (section === 'mcp') return 'agent-tools';
    if (section === 'changelog') return 'release-notes';
    return 'claude-code';
  }
  if (section === 'release-notes') return 'release-notes';
  if (section && ['agent-sdk', 'agents-and-tools'].includes(section)) return 'agent-tools';
  // Everything else on platform is now 'platform-docs'
  return 'platform-docs';
}
