import { fetchSitemapUrls } from './sitemap-parser';
import { crawlPages } from './page-crawler';
import { processSnapshot, type ProcessResult } from './snapshot-manager';
import { upsertDailyReport } from '@/db/queries';

export interface PipelineOptions {
  dryRun?: boolean;
  maxPages?: number;
  urls?: string[];
}

export interface PipelineResult {
  totalUrls: number;
  crawled: number;
  newPages: number;
  modifiedPages: number;
  unchanged: number;
  errors: number;
  results: ProcessResult[];
}

export async function runPipeline(options: PipelineOptions = {}): Promise<PipelineResult> {
  const { dryRun = false, maxPages, urls: customUrls } = options;

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
      unchanged: 0,
      errors: 0,
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

  // Step 4: Generate daily report
  const summary = {
    totalUrls: urls.length,
    crawled: crawlResults.length,
    newPages: results.filter((r) => r.status === 'new').length,
    modifiedPages: results.filter((r) => r.status === 'modified').length,
    unchanged: results.filter((r) => r.status === 'unchanged').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };

  const today = new Date().toISOString().split('T')[0];
  await upsertDailyReport({
    report_date: today,
    total_changes: summary.newPages + summary.modifiedPages,
    new_pages: summary.newPages,
    modified_pages: summary.modifiedPages,
    removed_pages: 0,
    ai_summary: null,
  });

  console.log('[pipeline] Complete!');
  console.log(`  New: ${summary.newPages}, Modified: ${summary.modifiedPages}, Unchanged: ${summary.unchanged}, Errors: ${summary.errors}`);

  return summary;
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
