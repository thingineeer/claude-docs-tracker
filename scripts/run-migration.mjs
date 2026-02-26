import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
});

async function runMigration() {
  console.log('=== Running Migration 003: Add category column ===\n');

  // Step 1: Check if column already exists
  const { data: testData, error: testErr } = await supabase
    .from('pages')
    .select('id')
    .limit(1);

  if (testErr) {
    console.error('Connection failed:', testErr.message);
    process.exit(1);
  }
  console.log('[1/4] Connection OK');

  // Check if category column exists
  const { data: catTest, error: catErr } = await supabase
    .from('pages')
    .select('category')
    .limit(1);

  if (!catErr) {
    console.log('[!] category column already exists, skipping ALTER TABLE');
  } else if (catErr.code === '42703') {
    console.log('[2/4] category column does not exist - needs ALTER TABLE');
    console.log('');
    console.log('ERROR: Cannot run DDL (ALTER TABLE) via Supabase REST API.');
    console.log('Please run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log(readFileSync('supabase/migrations/003_add_category.sql', 'utf-8'));
    console.log('');
    console.log('After running the SQL, re-run this script to verify.');
    process.exit(1);
  }

  // Step 3: Verify categories are set
  const { data: pages, error: pagesErr } = await supabase
    .from('pages')
    .select('id, domain, section, category')
    .is('category', null)
    .limit(5);

  if (pagesErr) {
    console.error('Failed to check categories:', pagesErr.message);
    process.exit(1);
  }

  if (pages && pages.length > 0) {
    console.log(`[3/4] Found ${pages.length}+ pages without category, updating...`);

    // Update pages without category using the logic from getCategoryFromPage
    const { data: allPages, error: allErr } = await supabase
      .from('pages')
      .select('id, domain, section')
      .is('category', null);

    if (allErr) {
      console.error('Failed to fetch pages:', allErr.message);
      process.exit(1);
    }

    let updated = 0;
    for (const page of allPages || []) {
      const category = getCategoryFromPage(page.domain, page.section);
      const { error: updateErr } = await supabase
        .from('pages')
        .update({ category })
        .eq('id', page.id);

      if (updateErr) {
        console.error(`  Failed to update page ${page.id}:`, updateErr.message);
      } else {
        updated++;
      }
    }
    console.log(`[3/4] Updated ${updated} pages with categories`);
  } else {
    console.log('[3/4] All pages already have categories');
  }

  // Step 4: Summary
  const { data: summary } = await supabase
    .from('pages')
    .select('category')
    .not('category', 'is', null);

  const counts = {};
  for (const p of summary || []) {
    counts[p.category] = (counts[p.category] || 0) + 1;
  }

  console.log('[4/4] Category distribution:');
  for (const [cat, count] of Object.entries(counts).sort()) {
    console.log(`  ${cat}: ${count} pages`);
  }
  console.log(`\nTotal: ${summary?.length || 0} pages with categories`);
  console.log('\n=== Migration complete ===');
}

function getCategoryFromPage(domain, section) {
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

runMigration().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
