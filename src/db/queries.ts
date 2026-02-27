import { getSupabaseAdmin } from './supabase';
import { toLocalDateString } from '@/lib/timezone';
import type { ChangeType } from './types';

/**
 * Escapes special LIKE characters in SQL patterns.
 * Prevents '%' and '_' from being interpreted as wildcards.
 */
function escapeLikePattern(query: string): string {
  return query.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

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
  is_silent?: boolean;
  is_breaking?: boolean;
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
  const escapedQuery = escapeLikePattern(query);

  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('*, pages!inner(*)')
    .or(`diff_summary.ilike.%${escapedQuery}%,diff_html.ilike.%${escapedQuery}%,pages.title.ilike.%${escapedQuery}%,pages.url.ilike.%${escapedQuery}%`)
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback: search without !inner join if foreign table filter fails
    const { data: fallbackData, error: fallbackError } = await getSupabaseAdmin()
      .from('changes')
      .select('*, pages(*)')
      .or(`diff_summary.ilike.%${escapedQuery}%,diff_html.ilike.%${escapedQuery}%,pages.title.ilike.%${escapedQuery}%,pages.url.ilike.%${escapedQuery}%`)
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
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count, error } = await getSupabaseAdmin()
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .gte('last_crawled_at', thirtyDaysAgo.toISOString());

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
    dates.push(toLocalDateString(d));
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

export async function getDocumentationPages() {
  const { data, error } = await getSupabaseAdmin()
    .from('pages')
    .select('id, url, domain')
    .in('domain', ['platform.claude.com', 'code.claude.com']);

  if (error) throw error;
  return data ?? [];
}

export async function getLatestSnapshotForPage(pageId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('snapshots')
    .select('id')
    .eq('page_id', pageId)
    .order('crawled_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getSearchSuggestions(limit = 5): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('diff_summary, pages(title)')
    .order('detected_at', { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return [];

  // Extract meaningful keywords from diff_summary and page titles
  const wordCounts = new Map<string, number>();
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'it', 'its', 'not', 'no', 'as', 'if', 'then', 'than', 'so', 'up',
    'about', 'into', 'over', 'after', 'new', 'added', 'removed', 'updated',
    'changed', 'modified', 'section', 'page', 'content', 'text', 'also',
  ]);

  for (const row of data) {
    const sources = [
      row.diff_summary,
      (row.pages as any)?.title,
    ].filter(Boolean) as string[];

    for (const text of sources) {
      const words = text.split(/[\s,;:.()\[\]{}|/\\]+/);
      for (const raw of words) {
        const word = raw.replace(/[^a-zA-Z0-9-]/g, '');
        if (word.length < 3 || stopWords.has(word.toLowerCase())) continue;
        const key = word.length <= 5 ? word.toUpperCase() : word;
        wordCounts.set(key, (wordCounts.get(key) ?? 0) + 1);
      }
    }
  }

  // Sort by frequency and return top keywords
  const sorted = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, limit);

  return sorted;
}

export async function getGitHubReleasePages() {
  const { data, error } = await getSupabaseAdmin()
    .from('pages')
    .select('id, url, domain')
    .eq('domain', 'github.com');

  if (error) throw error;
  return data ?? [];
}

export async function getExistingChange(pageId: string, detectedAt: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('changes')
    .select('id, change_type')
    .eq('page_id', pageId)
    .eq('detected_at', detectedAt)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateChange(
  changeId: string,
  updates: {
    snapshot_after_id?: string;
    change_type?: ChangeType;
    diff_html?: string | null;
    diff_summary?: string | null;
    is_breaking?: boolean;
  },
) {
  const { error } = await getSupabaseAdmin()
    .from('changes')
    .update(updates)
    .eq('id', changeId);

  if (error) throw error;
}

// Re-export getCategoryForPage as getCategoryFromPage for backward compatibility
export { getCategoryForPage as getCategoryFromPage } from '@/lib/categories';
