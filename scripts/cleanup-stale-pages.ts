/**
 * Cleanup script for stale pages that no longer exist in the live sitemap.
 *
 * For each stale page:
 *   1. Checks if the page exists in the DB
 *   2. Sets last_crawled_at to NULL (marks as inactive)
 *   3. Inserts a 'removed' change record with today's date
 *
 * Idempotent: safe to run multiple times. Skips pages already marked as removed today.
 *
 * Usage:
 *   npx tsx scripts/cleanup-stale-pages.ts
 *
 * Requires .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// ─── Load .env.local ─────────────────────────────────────────────────────────

function loadEnvFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — rely on existing env vars
  }
}

loadEnvFile(resolve(__dirname, '..', '.env.local'));

// ─── Supabase client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Ensure .env.local exists or env vars are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Stale page URLs ─────────────────────────────────────────────────────────

const STALE_URLS = [
  'https://platform.claude.com/docs/en/about-claude/models/all-models',
  'https://platform.claude.com/docs/en/about-claude/models/claude-opus-4-6',
  'https://platform.claude.com/docs/en/about-claude/models/claude-sonnet-4-6',
  'https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search',
  'https://platform.claude.com/docs/en/build-with-claude/text-generation',
  'https://platform.claude.com/docs/en/home',
];

// ─── Main ────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0];

async function main() {
  console.log('=== Cleanup Stale Pages ===');
  console.log(`Date: ${TODAY}`);
  console.log(`Stale URLs: ${STALE_URLS.length}\n`);

  let processed = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;

  for (const url of STALE_URLS) {
    console.log(`Processing: ${url}`);

    // 1. Check if page exists
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id, title, last_crawled_at')
      .eq('url', url)
      .single();

    if (pageError || !page) {
      console.log(`  [NOT FOUND] Page does not exist in DB — skipping`);
      notFound++;
      continue;
    }

    // 2. Check if already processed today (idempotency)
    const { data: existingChange } = await supabase
      .from('changes')
      .select('id')
      .eq('page_id', page.id)
      .eq('change_type', 'removed')
      .eq('detected_at', TODAY)
      .limit(1)
      .maybeSingle();

    if (existingChange) {
      console.log(`  [SKIP] Already has 'removed' change for ${TODAY} — "${page.title}"`);
      skipped++;
      continue;
    }

    // 3. Get latest snapshot for snapshot_after_id (required NOT NULL)
    const { data: latestSnapshot } = await supabase
      .from('snapshots')
      .select('id')
      .eq('page_id', page.id)
      .order('crawled_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestSnapshot) {
      console.error(`  [ERROR] No snapshot found for page "${page.title}" — cannot create change record`);
      errors++;
      continue;
    }

    // 4. Set last_crawled_at to NULL
    const { error: updateError } = await supabase
      .from('pages')
      .update({ last_crawled_at: null })
      .eq('id', page.id);

    if (updateError) {
      console.error(`  [ERROR] Failed to update page: ${updateError.message}`);
      errors++;
      continue;
    }

    // 5. Insert 'removed' change record
    const { error: changeError } = await supabase
      .from('changes')
      .insert({
        page_id: page.id,
        snapshot_before_id: latestSnapshot.id,
        snapshot_after_id: latestSnapshot.id,
        change_type: 'removed',
        diff_html: null,
        diff_summary: `Page removed from sitemap: "${page.title}"`,
        detected_at: TODAY,
      });

    if (changeError) {
      console.error(`  [ERROR] Failed to insert change: ${changeError.message}`);
      errors++;
      continue;
    }

    console.log(`  [DONE] Marked as removed — "${page.title}"`);
    processed++;
  }

  // ─── Summary ───────────────────────────────────────────────────────

  console.log('\n=== Summary ===');
  console.log(`Processed (marked removed): ${processed}`);
  console.log(`Skipped (already done):     ${skipped}`);
  console.log(`Not found in DB:            ${notFound}`);
  console.log(`Errors:                     ${errors}`);

  // ─── Verify page count ─────────────────────────────────────────────

  const { count: activeCount } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .not('last_crawled_at', 'is', null);

  const { count: totalCount } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true });

  console.log(`\n=== Page Count Verification ===`);
  console.log(`Total pages in DB:   ${totalCount}`);
  console.log(`Active pages:        ${activeCount}`);
  console.log(`Stale pages (NULL):  ${(totalCount ?? 0) - (activeCount ?? 0)}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
