import { fetchSitemapUrls } from './sitemap-parser';
import { crawlPages } from './page-crawler';
import { processSnapshot, type ProcessResult } from './snapshot-manager';
import { processGitHubReleases, detectUnpublishedReleases, fetchGitHubReleases, releaseToCrawlResult } from './github-releases-crawler';
import { upsertDailyReport, getDocumentationPages, getLatestSnapshotForPage, insertChange } from '@/db/queries';
import { sendBreakingChangeAlert, type BreakingChangeInfo } from '@/lib/notifications';

export interface PipelineOptions {
  dryRun?: boolean;
  maxPages?: number;
  urls?: string[];
  skipGitHub?: boolean;
}

export interface PipelineResult {
  totalUrls: number;
  crawled: number;
  newPages: number;
  modifiedPages: number;
  removedPages: number;
  unchanged: number;
  errors: number;
  githubReleases: number;
  results: ProcessResult[];
  breakingChanges?: Array<{
    pageTitle: string;
    pageUrl: string;
    changeType: string;
    matchedKeywords: string[];
  }>;
}

export async function runPipeline(options: PipelineOptions = {}): Promise<PipelineResult> {
  const { dryRun = false, maxPages, urls: customUrls, skipGitHub = false } = options;

  console.log('[pipeline] Starting crawl pipeline...');

  // Step 1: Get URLs
  let urls: string[];
  if (customUrls) {
    urls = customUrls;
  } else {
    console.log('[pipeline] Fetching sitemap URLs...');
    const entries = await fetchSitemapUrls();
    urls = entries.map((e) => e.url);
  }

  if (maxPages) {
    urls = urls.slice(0, maxPages);
  }

  console.log(`[pipeline] Found ${urls.length} URLs to crawl`);

  if (dryRun) {
    console.log('[pipeline] Dry run mode — skipping crawl');
    urls.forEach((url) => console.log(`  - ${url}`));
    return {
      totalUrls: urls.length,
      crawled: 0,
      newPages: 0,
      modifiedPages: 0,
      removedPages: 0,
      unchanged: 0,
      errors: 0,
      githubReleases: 0,
      results: [],
    };
  }

  // Step 2: Crawl pages
  console.log('[pipeline] Crawling pages...');
  const crawlResults = await crawlPages(urls, (completed, total) => {
    console.log(`[pipeline] Progress: ${completed}/${total}`);
  });

  console.log(`[pipeline] Crawled ${crawlResults.length} pages`);

  // Step 3: Process snapshots
  console.log('[pipeline] Processing snapshots...');
  const results: ProcessResult[] = [];

  for (const result of crawlResults) {
    const processResult = await processSnapshot(result);
    results.push(processResult);

    if (processResult.status !== 'unchanged') {
      console.log(`[pipeline] ${processResult.status}: ${processResult.url}`);
    }
  }

  // Phase 2: GitHub Releases
  let githubResults: ProcessResult[] = [];
  let githubRemovedCount = 0;
  if (!skipGitHub && !dryRun && !customUrls) {
    try {
      console.log('[pipeline] Processing GitHub releases...');
      githubResults = await processGitHubReleases();
      const releases = await fetchGitHubReleases();
      const releaseUrls = releases.map((r) => r.html_url);
      githubRemovedCount = await detectUnpublishedReleases(releaseUrls);
    } catch (error) {
      console.error('[pipeline] GitHub releases phase failed (sitemap results preserved):', error);
    }
  }

  const allResults = [...results, ...githubResults];

  // Step 4: Detect stale (removed) pages
  let removedCount = 0;
  if (!customUrls) {
    removedCount = await detectRemovedPages(urls);
  }

  // Step 5: Generate daily report
  const summary: PipelineResult = {
    totalUrls: urls.length + githubResults.length,
    crawled: crawlResults.length + githubResults.length,
    newPages: allResults.filter((r) => r.status === 'new').length,
    modifiedPages: allResults.filter((r) => r.status === 'modified').length,
    removedPages: removedCount + githubRemovedCount,
    unchanged: allResults.filter((r) => r.status === 'unchanged').length,
    errors: allResults.filter((r) => r.status === 'error').length,
    githubReleases: githubResults.filter((r) => r.status !== 'unchanged').length,
    results: allResults,
  };

  const today = new Date().toISOString().split('T')[0];
  await upsertDailyReport({
    report_date: today,
    total_changes: summary.newPages + summary.modifiedPages + summary.removedPages,
    new_pages: summary.newPages,
    modified_pages: summary.modifiedPages,
    removed_pages: summary.removedPages,
    ai_summary: null,
  });

  // Step 6: Check for breaking changes and fire alerts
  const breakingResults = allResults.filter(
    (r): r is ProcessResult & { isBreaking: true; matchedKeywords: string[] } =>
      'isBreaking' in r && (r as Record<string, unknown>).isBreaking === true,
  );

  if (breakingResults.length > 0) {
    const breakingChanges: BreakingChangeInfo[] = breakingResults.map((r) => ({
      pageTitle: r.url,
      pageUrl: r.url,
      changeType: r.changeType ?? 'modified',
      matchedKeywords: r.matchedKeywords ?? [],
      detectedAt: today,
    }));

    summary.breakingChanges = breakingChanges;

    console.log(`[pipeline] ${breakingChanges.length} breaking change(s) detected, sending alerts...`);
    await sendBreakingChangeAlert(breakingChanges);
  }

  console.log('[pipeline] Complete!');
  console.log(`  New: ${summary.newPages}, Modified: ${summary.modifiedPages}, Removed: ${summary.removedPages}, Unchanged: ${summary.unchanged}, Errors: ${summary.errors}`);

  return summary;
}

/**
 * Detect pages in the DB that are no longer present in the sitemap.
 * Only checks documentation pages (platform.claude.com, code.claude.com).
 * GitHub release pages are excluded since they are not in sitemaps.
 */
async function detectRemovedPages(sitemapUrls: string[]): Promise<number> {
  console.log('[pipeline] Checking for removed pages...');

  const sitemapUrlSet = new Set(sitemapUrls);
  const dbPages = await getDocumentationPages();

  const today = new Date().toISOString().split('T')[0];
  let removedCount = 0;

  for (const page of dbPages) {
    if (!sitemapUrlSet.has(page.url)) {
      console.log(`[pipeline] Removed page detected: ${page.url}`);

      const latestSnapshot = await getLatestSnapshotForPage(page.id);
      if (!latestSnapshot) continue;

      try {
        await insertChange({
          page_id: page.id,
          snapshot_before_id: latestSnapshot.id,
          snapshot_after_id: latestSnapshot.id,
          change_type: 'removed',
          diff_html: null,
          diff_summary: null,
          detected_at: today,
        });
        removedCount++;
      } catch (error) {
        console.warn(`[pipeline] Failed to record removal for ${page.url}:`, error);
      }
    }
  }

  if (removedCount > 0) {
    console.log(`[pipeline] Detected ${removedCount} removed pages`);
  }
  return removedCount;
}

// CLI entry point
if (typeof process !== 'undefined' && process.argv[1]?.includes('pipeline')) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const maxPagesArg = args.find((a) => a.startsWith('--max-pages='));
  const maxPages = maxPagesArg ? parseInt(maxPagesArg.split('=')[1], 10) : undefined;

  runPipeline({ dryRun, maxPages })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error('Pipeline failed:', error);
      process.exit(1);
    });
}
