import { createClient } from '@supabase/supabase-js';

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
  console.log('=== Running Migration 005: Add is_silent and is_breaking flags ===\n');

  // Step 0: Verify connection
  const { data: testData, error: testErr } = await supabase
    .from('changes')
    .select('id')
    .limit(1);

  if (testErr) {
    console.error('Connection failed:', testErr.message);
    process.exit(1);
  }
  console.log('[0/3] Connection OK\n');

  // Step 1: Add columns via ALTER TABLE
  console.log('[1/3] Adding is_silent and is_breaking columns ...');
  const { error: alterErr1 } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE changes ADD COLUMN IF NOT EXISTS is_silent boolean DEFAULT false;',
  }).catch(() => ({ error: { message: 'rpc not available' } }));

  // If rpc is not available, try updating a record to verify columns exist
  // The columns may already exist from running the SQL migration directly
  const { data: sampleChange, error: sampleErr } = await supabase
    .from('changes')
    .select('id, is_silent, is_breaking')
    .limit(1);

  if (sampleErr) {
    console.error('  Columns do not exist yet. Please run the SQL migration first:');
    console.error('  supabase/migrations/005_add_silent_breaking.sql');
    console.error('  Error:', sampleErr.message);
    process.exit(1);
  }
  console.log('  Columns is_silent and is_breaking are available\n');

  // Step 2: Backfill existing records
  // Set is_silent = true for changes where the page category != 'release-notes'
  console.log('[2/3] Backfilling is_silent for existing changes ...');

  // Get all changes with their page info
  const { data: allChanges, error: changesErr } = await supabase
    .from('changes')
    .select('id, page_id, pages(category)');

  if (changesErr) {
    console.error('  Failed to fetch changes:', changesErr.message);
    process.exit(1);
  }

  let silentCount = 0;
  let nonSilentCount = 0;

  for (const change of allChanges || []) {
    const page = change.pages;
    const category = page?.category ?? null;
    const isSilent = category !== 'release-notes';

    const { error: updateErr } = await supabase
      .from('changes')
      .update({ is_silent: isSilent })
      .eq('id', change.id);

    if (updateErr) {
      console.error(`  Failed to update change ${change.id}:`, updateErr.message);
    } else if (isSilent) {
      silentCount++;
    } else {
      nonSilentCount++;
    }
  }
  console.log(`  Marked ${silentCount} changes as silent, ${nonSilentCount} as non-silent\n`);

  // Step 3: Print results
  console.log('[3/3] Final summary:');
  const { data: summary, error: summaryErr } = await supabase
    .from('changes')
    .select('is_silent, is_breaking');

  if (summaryErr) {
    console.error('  Failed to fetch summary:', summaryErr.message);
    process.exit(1);
  }

  const stats = {
    total: summary?.length ?? 0,
    silent: summary?.filter((c) => c.is_silent).length ?? 0,
    breaking: summary?.filter((c) => c.is_breaking).length ?? 0,
  };

  console.log(`  Total changes: ${stats.total}`);
  console.log(`  Silent: ${stats.silent}`);
  console.log(`  Breaking: ${stats.breaking}`);
  console.log(`  Non-silent (release-notes): ${stats.total - stats.silent}`);

  console.log('\n=== Migration 005 complete ===');
}

runMigration().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
