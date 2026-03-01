/**
 * Seed script: Import GitHub releases into the database
 *
 * Usage: export $(grep -v '^#' .env.local | grep -v '^$' | xargs) && npx tsx scripts/seed-github-releases.ts
 */

import { processGitHubReleases } from '../src/crawler/github-releases-crawler';

async function main() {
  console.log('[seed] Starting GitHub releases import...');
  const summary = await processGitHubReleases();

  console.log('\n[seed] Results:');
  console.log(`  Total:     ${summary.totalFetched}`);
  console.log(`  New:       ${summary.newReleases}`);
  console.log(`  Modified:  ${summary.modifiedReleases}`);
  console.log(`  Unchanged: ${summary.unchangedReleases}`);
  console.log(`  Errors:    ${summary.errors}`);

  if (summary.errors > 0) {
    const errors = summary.results.filter((r) => r.status === 'error');
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
