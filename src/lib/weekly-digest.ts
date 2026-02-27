import { getSupabaseAdmin } from '@/db/supabase';
import { generateChangeSummary } from './ai-summary';

export interface WeeklyDigestData {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  totalChanges: number;
  breakingChanges: number;
  silentChanges: number;
  changesByCategory: Record<string, number>;
  topChanges: Array<{
    title: string;
    url: string;
    changeType: string;
    category: string;
    isBreaking: boolean;
  }>;
  aiSummary: string | null;
}

export async function generateWeeklyDigest(): Promise<WeeklyDigestData | null> {
  // Calculate last week's Monday-Sunday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - dayOfWeek - 6); // Previous Monday
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const weekStart = lastMonday.toISOString().split('T')[0];
  const weekEnd = lastSunday.toISOString().split('T')[0];

  // Query changes for that week
  const sb = getSupabaseAdmin();
  const { data: changes, error } = await sb
    .from('changes')
    .select('*, pages(title, url, category)')
    .gte('detected_at', weekStart)
    .lte('detected_at', weekEnd)
    .order('detected_at', { ascending: false });

  if (error) throw error;
  if (!changes || changes.length === 0) return null; // Skip empty weeks

  // Aggregate
  const breakingChanges = changes.filter(
    (c: Record<string, unknown>) => (c.is_breaking as boolean | null) ?? false,
  ).length;
  const silentChanges = changes.filter(
    (c: Record<string, unknown>) => (c.is_silent as boolean | null) ?? false,
  ).length;
  const changesByCategory: Record<string, number> = {};
  const topChanges: WeeklyDigestData['topChanges'] = [];

  for (const c of changes) {
    const page = c.pages as Record<string, unknown> | null;
    const cat = (page?.category as string) ?? 'unknown';
    changesByCategory[cat] = (changesByCategory[cat] ?? 0) + 1;
    if (topChanges.length < 10) {
      topChanges.push({
        title: (page?.title as string) ?? 'Unknown',
        url: (page?.url as string) ?? '',
        changeType: c.change_type as string,
        category: cat,
        isBreaking: ((c as Record<string, unknown>).is_breaking as boolean | null) ?? false,
      });
    }
  }

  // Generate AI summary (only if CLAUDE_API_KEY exists)
  let aiSummary: string | null = null;
  try {
    const summaryPrompt = topChanges
      .map((c) => `- ${c.title} (${c.changeType})`)
      .join('\n');
    aiSummary = await generateChangeSummary(
      `Weekly digest ${weekStart} ~ ${weekEnd}`,
      'weekly_summary',
      summaryPrompt,
    );
  } catch {
    // Graceful fallback
  }

  return {
    weekStart,
    weekEnd,
    totalChanges: changes.length,
    breakingChanges,
    silentChanges,
    changesByCategory,
    topChanges,
    aiSummary,
  };
}
