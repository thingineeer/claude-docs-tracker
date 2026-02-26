/**
 * Seed script for demo data.
 * Usage: npx tsx scripts/seed-demo-data.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_PAGES = [
  {
    url: 'https://platform.claude.com/docs/en/overview',
    domain: 'platform.claude.com',
    section: 'overview',
    title: 'Overview - Claude Documentation',
  },
  {
    url: 'https://platform.claude.com/docs/en/build-with-claude/extended-thinking',
    domain: 'platform.claude.com',
    section: 'build-with-claude',
    title: 'Extended Thinking',
  },
  {
    url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching',
    domain: 'platform.claude.com',
    section: 'build-with-claude',
    title: 'Prompt Caching',
  },
  {
    url: 'https://code.claude.com/docs/en/overview',
    domain: 'code.claude.com',
    section: 'overview',
    title: 'Claude Code Overview',
  },
  {
    url: 'https://code.claude.com/docs/en/github-actions',
    domain: 'code.claude.com',
    section: 'github-actions',
    title: 'GitHub Actions',
  },
];

async function seed() {
  console.log('Seeding demo data...');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  for (const page of DEMO_PAGES) {
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .upsert({ ...page, last_crawled_at: new Date().toISOString() }, { onConflict: 'url' })
      .select()
      .single();

    if (pageError) {
      console.error(`Error inserting page ${page.url}:`, pageError);
      continue;
    }

    console.log(`Page: ${pageData.title}`);

    const { data: snapshot, error: snapError } = await supabase
      .from('snapshots')
      .insert({
        page_id: pageData.id,
        content_hash: `demo-hash-${Date.now()}-${Math.random()}`,
        content_text: `Demo content for ${page.title}. This is sample documentation text.`,
        sidebar_tree: null,
        crawled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (snapError) {
      console.error(`Error inserting snapshot:`, snapError);
      continue;
    }

    const { error: changeError } = await supabase.from('changes').insert({
      page_id: pageData.id,
      snapshot_before_id: null,
      snapshot_after_id: snapshot.id,
      change_type: 'added',
      diff_html: '<div class="diff-added">+ New documentation page added</div>',
      diff_summary: `New page: ${page.title} | 새 페이지: ${page.title}`,
      detected_at: today,
    });

    if (changeError) {
      console.error(`Error inserting change:`, changeError);
    }
  }

  // Daily reports
  for (const date of [yesterday, today]) {
    const count = date === today ? DEMO_PAGES.length : 2;
    await supabase.from('daily_reports').upsert(
      {
        report_date: date,
        total_changes: count,
        new_pages: Math.floor(count / 2),
        modified_pages: count - Math.floor(count / 2),
        removed_pages: 0,
        ai_summary: `${count} documentation changes detected. | ${count}개의 문서 변경이 감지되었습니다.`,
      },
      { onConflict: 'report_date' },
    );
  }

  console.log('Seed complete!');
}

seed().catch(console.error);
