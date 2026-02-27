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
  console.log('=== Running Migration 004: Update category mappings ===\n');

  // Step 0: Verify connection
  const { data: testData, error: testErr } = await supabase
    .from('pages')
    .select('id')
    .limit(1);

  if (testErr) {
    console.error('Connection failed:', testErr.message);
    process.exit(1);
  }
  console.log('[0/4] Connection OK\n');

  // Step 1: Rename agent-tools → agents-mcp for all pages
  console.log('[1/4] Renaming agent-tools → agents-mcp ...');
  const { data: agentToolsPages, error: atFetchErr } = await supabase
    .from('pages')
    .select('id')
    .eq('category', 'agent-tools');

  if (atFetchErr) {
    console.error('  Failed to fetch agent-tools pages:', atFetchErr.message);
    process.exit(1);
  }

  let step1Updated = 0;
  for (const page of agentToolsPages || []) {
    const { error: updateErr } = await supabase
      .from('pages')
      .update({ category: 'agents-mcp' })
      .eq('id', page.id);

    if (updateErr) {
      console.error(`  Failed to update page ${page.id}:`, updateErr.message);
    } else {
      step1Updated++;
    }
  }
  console.log(`  Updated ${step1Updated} pages (agent-tools → agents-mcp)\n`);

  // Step 2: Move code.claude.com overview/quickstart pages from platform-docs → claude-code
  console.log('[2/4] Moving code.claude.com overview/quickstart → claude-code ...');
  const { data: codeOverviewPages, error: coFetchErr } = await supabase
    .from('pages')
    .select('id, domain, section, category')
    .eq('domain', 'code.claude.com')
    .eq('category', 'platform-docs')
    .in('section', ['overview', 'quickstart']);

  if (coFetchErr) {
    console.error('  Failed to fetch code overview/quickstart pages:', coFetchErr.message);
    process.exit(1);
  }

  let step2Updated = 0;
  for (const page of codeOverviewPages || []) {
    const { error: updateErr } = await supabase
      .from('pages')
      .update({ category: 'claude-code' })
      .eq('id', page.id);

    if (updateErr) {
      console.error(`  Failed to update page ${page.id}:`, updateErr.message);
    } else {
      step2Updated++;
    }
  }
  console.log(`  Updated ${step2Updated} pages (platform-docs → claude-code)\n`);

  // Step 3: Ensure all MCP pages (section='mcp') are agents-mcp
  console.log('[3/4] Ensuring MCP pages have agents-mcp category ...');
  const { data: mcpPages, error: mcpFetchErr } = await supabase
    .from('pages')
    .select('id, category')
    .eq('section', 'mcp')
    .neq('category', 'agents-mcp');

  if (mcpFetchErr) {
    console.error('  Failed to fetch MCP pages:', mcpFetchErr.message);
    process.exit(1);
  }

  let step3Updated = 0;
  for (const page of mcpPages || []) {
    const { error: updateErr } = await supabase
      .from('pages')
      .update({ category: 'agents-mcp' })
      .eq('id', page.id);

    if (updateErr) {
      console.error(`  Failed to update page ${page.id}:`, updateErr.message);
    } else {
      step3Updated++;
    }
  }
  console.log(`  Updated ${step3Updated} pages (mcp section → agents-mcp)\n`);

  // Step 4: Print final category distribution
  console.log('[4/4] Final category distribution:');
  const { data: allPages, error: allErr } = await supabase
    .from('pages')
    .select('category')
    .not('category', 'is', null);

  if (allErr) {
    console.error('  Failed to fetch category summary:', allErr.message);
    process.exit(1);
  }

  const counts = {};
  for (const p of allPages || []) {
    counts[p.category] = (counts[p.category] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(counts).sort()) {
    console.log(`  ${cat}: ${count} pages`);
  }
  console.log(`\nTotal: ${allPages?.length || 0} pages with categories`);
  console.log('\n=== Migration 004 complete ===');
}

runMigration().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
