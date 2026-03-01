import { fetchSitemapUrls, getDomainFromUrl, getSectionFromUrl, type SitemapEntry } from './sitemap-parser';
import { crawlPages } from './page-crawler';
import { processSnapshot, type ProcessResult } from './snapshot-manager';
import { processGitHubReleases, detectUnpublishedReleases, fetchGitHubReleases, releaseToCrawlResult, type GitHubReleaseSummary } from './github-releases-crawler';
import { processAnthropicNews } from './anthropic-news-crawler';
import { upsertDailyReport, getDocumentationPages, getLatestSnapshotForPage, insertChange, upsertPage, getPageByUrl, updatePageLastmod, getCategoryFromPage } from '@/db/queries';
import { sendBreakingChangeAlert, type BreakingChangeInfo } from '@/lib/notifications';
import { getTodayString } from '@/lib/timezone';

export interface PipelineOptions {
  dryRun?: boolean;
  maxPages?: number;
  urls?: string[];
  skipGitHub?: boolean;
  skipAnthropicNews?: boolean;
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
  anthropicNews: number;
  duration: string;
  githubError?: string;
  results: ProcessResult[];
  breakingChanges?: Array<{
    pageTitle: string;
    pageUrl: string;
    changeType: string;
    matchedKeywords: string[];
  }>;
}

export async function runPipeline(options: PipelineOptions = {}): Promise<PipelineResult> {
  const { dryRun = false, maxPages, urls: customUrls, skipGitHub = false, skipAnthropicNews = false } = options;

  const pipelineStart = Date.now();
  console.log('[pipeline] Starting crawl pipeline...');

  // Step 1: Get URLs
  let sitemapEntries: SitemapEntry[];
  if (customUrls) {
    sitemapEntries = customUrls.map((url) => ({ url }));
  } else {
    console.log('[pipeline] Fetching sitemap URLs...');
    sitemapEntries = await fetchSitemapUrls();
  }

  // When customUrls are provided, skip domain splitting (original behavior)
  const useCustomUrls = !!customUrls;

  // Split URLs by domain for different crawl strategies
  let ssrEntries: SitemapEntry[];
  let csrEntries: SitemapEntry[];

  if (useCustomUrls) {
    // Custom URLs: crawl everything with fetch() (original behavior)
    ssrEntries = sitemapEntries;
    csrEntries = [];
  } else {
    // Separate SSR (code.claude.com) from CSR (platform.claude.com) pages
    ssrEntries = sitemapEntries.filter((e) => e.url.includes('code.claude.com'));
    csrEntries = sitemapEntries.filter((e) => e.url.includes('platform.claude.com'));
  }

  if (maxPages) {
    // Apply limit only to SSR entries for testing
    ssrEntries = ssrEntries.slice(0, maxPages);
  }

  const totalEntries = ssrEntries.length + csrEntries.length;
  console.log(`[pipeline] SSR pages (code.claude.com): ${ssrEntries.length}`);
  console.log(`[pipeline] CSR pages (platform.claude.com): ${csrEntries.length} (lastmod-only)`);

  if (dryRun) {
    console.log('[pipeline] Dry run mode — skipping crawl');
    ssrEntries.forEach((e) => console.log(`  - [SSR] ${e.url}`));
    csrEntries.forEach((e) => console.log(`  - [CSR] ${e.url}`));
    return {
      totalUrls: totalEntries,
      crawled: 0,
      newPages: 0,
      modifiedPages: 0,
      removedPages: 0,
      unchanged: 0,
      errors: 0,
      githubReleases: 0,
      anthropicNews: 0,
      duration: `${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`,
      results: [],
    };
  }

  // Step 2: Crawl SSR pages (code.claude.com only — fetch works for SSR)
  console.log('[pipeline] Crawling SSR pages...');
  const ssrUrls = ssrEntries.map((e) => e.url);
  const crawlResults = await crawlPages(ssrUrls, (completed, total) => {
    console.log(`[pipeline] Progress: ${completed}/${total}`);
  });

  console.log(`[pipeline] Crawled ${crawlResults.length} SSR pages`);

  // Step 2b: Check CSR pages via sitemap lastmod (platform.claude.com)
  let csrResults: ProcessResult[] = [];
  if (csrEntries.length > 0) {
    console.log('[pipeline] Checking CSR pages via lastmod...');
    csrResults = await checkLastmodChanges(csrEntries);
    console.log(`[pipeline] CSR lastmod: ${csrResults.filter((r) => r.status !== 'unchanged').length} changes detected`);
  }

  // Step 3: Process snapshots (SSR pages only)
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
  let githubError: string | undefined;
  if (!skipGitHub && !dryRun && !customUrls) {
    try {
      console.log('[pipeline] Processing GitHub releases...');
      const githubTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('GitHub crawl timeout after 45s')), 45000)
      );
      const githubSummary = await Promise.race([
        processGitHubReleases(),
        githubTimeout,
      ]) as GitHubReleaseSummary;
      githubResults = githubSummary.results;
      console.log(`[pipeline] GitHub: ${githubSummary.newReleases} new, ${githubSummary.modifiedReleases} modified, ${githubSummary.unchangedReleases} unchanged, ${githubSummary.errors} errors`);

      const releases = await fetchGitHubReleases();
      const releaseUrls = releases.map((r) => r.html_url);
      githubRemovedCount = await detectUnpublishedReleases(releaseUrls);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      githubError = errorMessage;
      console.error('[pipeline] GitHub releases phase failed (sitemap results preserved):', error);
    }
  }

  // Phase 3: Anthropic News
  let anthropicNewsResults: ProcessResult[] = [];
  if (!skipAnthropicNews && !dryRun && !customUrls) {
    try {
      console.log('[pipeline] Processing Anthropic news...');
      anthropicNewsResults = await processAnthropicNews();
    } catch (error) {
      console.error('[pipeline] Anthropic news phase failed (other results preserved):', error);
    }
  }

  const allResults = [...results, ...csrResults, ...githubResults, ...anthropicNewsResults];

  // Step 4: Detect stale (removed) pages
  // Use all sitemap URLs (SSR + CSR) for stale detection
  const allSitemapUrls = sitemapEntries.map((e) => e.url);
  let removedCount = 0;
  if (!customUrls) {
    removedCount = await detectRemovedPages(allSitemapUrls);
  }

  // Step 5: Generate daily report
  const elapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  const summary: PipelineResult = {
    totalUrls: ssrUrls.length + csrEntries.length + githubResults.length + anthropicNewsResults.length,
    crawled: crawlResults.length + csrResults.length + githubResults.length + anthropicNewsResults.length,
    newPages: allResults.filter((r) => r.status === 'new').length,
    modifiedPages: allResults.filter((r) => r.status === 'modified').length,
    removedPages: removedCount + githubRemovedCount,
    unchanged: allResults.filter((r) => r.status === 'unchanged').length,
    errors: allResults.filter((r) => r.status === 'error').length,
    githubReleases: githubResults.filter((r) => r.status !== 'unchanged').length,
    anthropicNews: anthropicNewsResults.filter((r) => r.status !== 'unchanged').length,
    duration: `${elapsed}s`,
    ...(githubError ? { githubError } : {}),
    results: allResults,
  };

  const today = getTodayString();
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

  console.log(`[pipeline] Complete in ${elapsed}s`);
  console.log(`  New: ${summary.newPages}, Modified: ${summary.modifiedPages}, Removed: ${summary.removedPages}, Unchanged: ${summary.unchanged}, Errors: ${summary.errors}`);

  return summary;
}

/**
 * Check CSR (platform.claude.com) pages for changes using sitemap lastmod dates.
 * Since platform.claude.com is client-side rendered, fetch() returns only "Loading..."
 * placeholder text. Instead, we detect changes by comparing sitemap lastmod values.
 */
async function checkLastmodChanges(entries: SitemapEntry[]): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  const today = getTodayString();

  for (const entry of entries) {
    try {
      const existingPage = await getPageByUrl(entry.url);

      if (!existingPage) {
        // New page — record it with lastmod, no content to diff
        const domain = getDomainFromUrl(entry.url);
        const section = getSectionFromUrl(entry.url);
        const category = getCategoryFromPage(domain, section);

        // Extract title from URL path
        const urlTitle = entry.url.split('/').filter(Boolean).pop() ?? 'Untitled';
        const title = urlTitle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

        const page = await upsertPage({
          url: entry.url,
          domain,
          section,
          title,
          category,
        });

        if (entry.lastmod) {
          await updatePageLastmod(page.id, entry.lastmod);
        }

        results.push({ url: entry.url, status: 'new', changeType: 'added' });
        continue;
      }

      // Compare lastmod
      if (entry.lastmod && existingPage.sitemap_lastmod !== entry.lastmod) {
        console.log(`[pipeline] CSR lastmod changed: ${entry.url} (${existingPage.sitemap_lastmod} → ${entry.lastmod})`);

        // Get the latest snapshot for this page (may be from initial Playwright crawl)
        const latestSnapshot = await getLatestSnapshotForPage(existingPage.id);

        if (latestSnapshot) {
          // Record change — we know something changed but can't diff content
          try {
            await insertChange({
              page_id: existingPage.id,
              snapshot_before_id: latestSnapshot.id,
              snapshot_after_id: latestSnapshot.id,
              change_type: 'modified',
              diff_html: null,
              diff_summary: `Page content updated (detected via sitemap lastmod: ${existingPage.sitemap_lastmod ?? 'unknown'} → ${entry.lastmod})`,
              detected_at: today,
              is_silent: true,
            });
          } catch (err) {
            // May fail on duplicate (same page + same date) — that's OK
            console.warn(`[pipeline] Failed to insert CSR change for ${entry.url}:`, err);
          }
        }

        await updatePageLastmod(existingPage.id, entry.lastmod);
        results.push({ url: entry.url, status: 'modified', changeType: 'modified' });
      } else {
        results.push({ url: entry.url, status: 'unchanged' });
      }
    } catch (error) {
      console.error(`[pipeline] CSR check failed for ${entry.url}:`, error);
      results.push({ url: entry.url, status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }

  return results;
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

  const today = getTodayString();
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
