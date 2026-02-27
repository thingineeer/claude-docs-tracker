/**
 * Seed script: Import GitHub releases into the database
 *
 * Usage: export $(grep -v '^#' .env.local | grep -v '^$' | xargs) && npx tsx scripts/seed-github-releases.ts
 */

import { processGitHubReleases } from '../src/crawler/github-releases-crawler';

async function main() {
  console.log('[seed] Starting GitHub releases import...');
  const results = await processGitHubReleases();

  const stats = {
    total: results.length,
    new: results.filter((r) => r.status === 'new').length,
    modified: results.filter((r) => r.status === 'modified').length,
    unchanged: results.filter((r) => r.status === 'unchanged').length,
    errors: results.filter((r) => r.status === 'error').length,
  };

  console.log('\n[seed] Results:');
  console.log(`  Total:     ${stats.total}`);
  console.log(`  New:       ${stats.new}`);
  console.log(`  Modified:  ${stats.modified}`);
  console.log(`  Unchanged: ${stats.unchanged}`);
  console.log(`  Errors:    ${stats.errors}`);

  if (stats.errors > 0) {
    const errors = results.filter((r) => r.status === 'error');
    console.log('\n[seed] Errors:');
    for (const e of errors) {
      console.log(`  - ${e.url}: ${e.error}`);
    }
  }

  console.log('\n[seed] Done!');
}

main().catch((error) => {
  console.error('[seed] Fatal error:', error);
  process.exit(1);
});
