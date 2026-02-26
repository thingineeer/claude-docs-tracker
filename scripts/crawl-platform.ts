/**
 * Playwright-based crawler for platform.claude.com (CSR site).
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^$' | xargs) && npx tsx scripts/crawl-platform.ts
 *
 * Options:
 *   --dry-run       Print URLs without saving to DB
 *   --discover      Auto-discover URLs from sidebar navigation
 */

import { chromium, type Browser, type Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// ─── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const DISCOVER = process.argv.includes('--discover');
const RATE_LIMIT_MS = 2000;

// ─── Supabase ────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Known platform.claude.com pages ────────────────────────────────────────

const SEED_URLS = [
  'https://platform.claude.com/docs/en/intro',
  'https://platform.claude.com/docs/en/get-started',
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageData {
  url: string;
  title: string;
  contentText: string;
  sidebarLinks: { title: string; url: string }[];
  crawledAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeHash(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

function getDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return 'unknown'; }
}

function getSection(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts.length >= 3) return parts[2];
    return parts[1] ?? null;
  } catch { return null; }
}

// ─── Playwright page extraction ──────────────────────────────────────────────

async function extractPageData(page: Page, url: string): Promise<PageData | null> {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to render
    await page.waitForSelector('main, article, [role="main"], .docs-content', {
      timeout: 10000,
    }).catch(() => {
      // If no main element, wait a bit for any content
    });

    // Additional wait for CSR content
    await sleep(1500);

    // Check for 404
    const pageTitle = await page.title();
    if (pageTitle.includes('Not Found') || pageTitle.includes('404')) {
      console.warn(`  [404] ${url}`);
      return null;
    }

    // Extract title
    const title = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (h1) return h1.textContent?.trim() ?? '';
      const titleEl = document.querySelector('title');
      return titleEl?.textContent?.replace(/\s*[-|–]\s*Claude.*$/i, '').trim() ?? 'Untitled';
    });

    // Extract main content text
    const contentText = await page.evaluate(() => {
      // Try multiple selectors for main content
      const selectors = ['main', 'article', '[role="main"]', '.docs-content', '#content'];
      let content: Element | null = null;
      for (const sel of selectors) {
        content = document.querySelector(sel);
        if (content) break;
      }
      if (!content) content = document.body;

      // Clone to avoid modifying the page
      const clone = content.cloneNode(true) as Element;

      // Remove non-content elements
      clone.querySelectorAll('nav, header, footer, script, style, noscript, [role="navigation"]')
        .forEach((el) => el.remove());

      return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
    });

    // Extract sidebar navigation links
    const sidebarLinks = await page.evaluate(() => {
      const links: { title: string; url: string }[] = [];
      const seen = new Set<string>();

      // Try multiple sidebar selectors
      const sidebarSelectors = [
        'nav a[href*="/docs/"]',
        'aside a[href*="/docs/"]',
        '[role="navigation"] a[href*="/docs/"]',
        '.sidebar a[href*="/docs/"]',
        '[class*="sidebar"] a[href*="/docs/"]',
        '[class*="nav"] a[href*="/docs/"]',
      ];

      for (const sel of sidebarSelectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const a = el as HTMLAnchorElement;
          const href = a.href;
          const text = a.textContent?.trim();
          if (text && href && !seen.has(href) && href.includes('/docs/en/')) {
            seen.add(href);
            links.push({ title: text, url: href });
          }
        });
      }

      return links;
    });

    if (contentText.length < 50) {
      console.warn(`  [SHORT] ${url} - only ${contentText.length} chars`);
    }

    return {
      url,
      title: title || 'Untitled',
      contentText,
      sidebarLinks,
      crawledAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`  [ERROR] ${url}: ${err}`);
    return null;
  }
}

// ─── Save to Supabase ────────────────────────────────────────────────────────

async function saveToSupabase(data: PageData): Promise<'new' | 'unchanged' | 'error'> {
  try {
    const { data: page, error: pageErr } = await supabase
      .from('pages')
      .upsert(
        {
          url: data.url,
          domain: getDomain(data.url),
          section: getSection(data.url),
          title: data.title,
          last_crawled_at: data.crawledAt,
        },
        { onConflict: 'url' },
      )
      .select()
      .single();

    if (pageErr) throw pageErr;

    const contentHash = computeHash(data.contentText);

    const { data: existing } = await supabase
      .from('snapshots')
      .select('id, content_hash')
      .eq('page_id', page.id)
      .order('crawled_at', { ascending: false })
      .limit(1)
      .single();

    if (existing && existing.content_hash === contentHash) {
      return 'unchanged';
    }

    const sidebarTree = data.sidebarLinks.length > 0
      ? data.sidebarLinks.map((l) => ({ title: l.title, url: l.url }))
      : null;

    const { data: snapshot, error: snapErr } = await supabase
      .from('snapshots')
      .insert({
        page_id: page.id,
        content_hash: contentHash,
        content_text: data.contentText,
        sidebar_tree: sidebarTree,
        crawled_at: data.crawledAt,
      })
      .select()
      .single();

    if (snapErr) throw snapErr;

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('changes').insert({
      page_id: page.id,
      snapshot_before_id: null,
      snapshot_after_id: snapshot.id,
      change_type: 'added',
      diff_html: null,
      diff_summary: `Initial snapshot of "${data.title}"`,
      detected_at: today,
    });

    return 'new';
  } catch (err) {
    console.error(`  [DB ERROR] ${data.url}: ${err}`);
    return 'error';
  }
}

// ─── URL Discovery ───────────────────────────────────────────────────────────

async function discoverUrls(page: Page): Promise<string[]> {
  console.log('[discover] Navigating to platform.claude.com/docs to discover URLs...');

  await page.goto('https://platform.claude.com/docs/en/intro', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await sleep(3000); // Wait for sidebar to render

  const urls = await page.evaluate(() => {
    const links: string[] = [];
    const seen = new Set<string>();

    document.querySelectorAll('a[href*="/docs/en/"]').forEach((el) => {
      const href = (el as HTMLAnchorElement).href;
      if (href && !seen.has(href) && href.includes('/docs/en/') && !href.includes('#')) {
        seen.add(href);
        links.push(href);
      }
    });

    return links.sort();
  });

  console.log(`[discover] Found ${urls.length} unique documentation URLs`);
  return urls;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Platform Claude Docs Crawler (Playwright) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Discover: ${DISCOVER ? 'YES' : 'NO'}\n`);

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'claude-docs-tracker/1.0 (https://github.com/thingineeer/claude-docs-tracker)',
  });

  const page = await context.newPage();

  let urls: string[];

  if (DISCOVER) {
    urls = await discoverUrls(page);
  } else {
    urls = SEED_URLS;
    // First pass: discover URLs from the first page
    console.log('[step 1] Discovering URLs from sidebar...');
    const discovered = await discoverUrls(page);
    if (discovered.length > 0) {
      urls = discovered;
    }
  }

  console.log(`\n[step 2] Crawling ${urls.length} pages...`);

  const stats = { total: urls.length, saved: 0, skipped: 0, errors: 0, notFound: 0 };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const data = await extractPageData(page, url);

    if (!data) {
      stats.notFound++;
      console.log(`  [${i + 1}/${urls.length}] SKIP ${url}`);
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    if (DRY_RUN) {
      console.log(
        `  [${i + 1}/${urls.length}] ${data.title} (${data.contentText.length} chars, ${data.sidebarLinks.length} sidebar links)`,
      );
      stats.saved++;
    } else {
      const status = await saveToSupabase(data);
      if (status === 'new') {
        stats.saved++;
        console.log(
          `  [${i + 1}/${urls.length}] NEW ${data.title} (${data.contentText.length} chars)`,
        );
      } else if (status === 'unchanged') {
        stats.skipped++;
        console.log(`  [${i + 1}/${urls.length}] UNCHANGED ${data.title}`);
      } else {
        stats.errors++;
      }
    }

    await sleep(RATE_LIMIT_MS);
  }

  await browser.close();

  // Update daily report
  if (!DRY_RUN && stats.saved > 0) {
    const today = new Date().toISOString().split('T')[0];

    // Get existing report to add to it
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select()
      .eq('report_date', today)
      .single();

    const prevNew = existingReport?.new_pages ?? 0;
    const prevTotal = existingReport?.total_changes ?? 0;

    await supabase.from('daily_reports').upsert(
      {
        report_date: today,
        total_changes: prevTotal + stats.saved,
        new_pages: prevNew + stats.saved,
        modified_pages: existingReport?.modified_pages ?? 0,
        removed_pages: 0,
        ai_summary: `초기 크롤링: platform.claude.com에서 ${stats.saved}개 문서 스냅샷을 저장했습니다.`,
      },
      { onConflict: 'report_date' },
    );
  }

  console.log('\n=== Summary ===');
  console.log(`Total URLs: ${stats.total}`);
  console.log(`New snapshots saved: ${stats.saved}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Not found (404): ${stats.notFound}`);
  console.log(`Errors: ${stats.errors}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
