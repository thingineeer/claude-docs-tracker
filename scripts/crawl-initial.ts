/**
 * Initial crawl script - fetches all documentation pages and saves snapshots to Supabase.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^$' | xargs) && npx tsx scripts/crawl-initial.ts
 *
 * Options:
 *   --dry-run       Print URLs without crawling
 *   --concurrency=N Number of concurrent fetches (default: 5)
 *   --source=all    Which docs to crawl: all | platform | code (default: all)
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// ─── Config ──────────────────────────────────────────────────────────────────

const CONCURRENCY = parseInt(
  process.argv.find((a) => a.startsWith('--concurrency='))?.split('=')[1] ?? '5',
  10,
);
const DRY_RUN = process.argv.includes('--dry-run');
const SOURCE = process.argv.find((a) => a.startsWith('--source='))?.split('=')[1] ?? 'all';
const RATE_LIMIT_MS = 1500;
const MAX_RETRIES = 3;
const USER_AGENT =
  'claude-docs-tracker/1.0 (https://github.com/thingineeer/claude-docs-tracker)';

// ─── Supabase ────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Platform docs URL list (no sitemap available) ──────────────────────────

const PLATFORM_URLS = [
  // Getting Started
  '/docs/en/intro',
  '/docs/en/get-started',
  '/docs/en/initial-setup',
  // About Claude
  '/docs/en/about-claude/models/overview',
  '/docs/en/about-claude/models/migration-guide',
  '/docs/en/about-claude/models/all-models',
  '/docs/en/about-claude/model-deprecations',
  '/docs/en/about-claude/pricing',
  '/docs/en/about-claude/use-case-guides/ticket-routing',
  '/docs/en/about-claude/use-case-guides/customer-support-agent',
  '/docs/en/about-claude/use-case-guides/legal-summarization',
  '/docs/en/about-claude/use-case-guides/content-generation',
  '/docs/en/about-claude/use-case-guides/code-generation',
  '/docs/en/about-claude/use-case-guides/content-moderation',
  // Build with Claude
  '/docs/en/build-with-claude/overview',
  '/docs/en/build-with-claude/working-with-messages',
  '/docs/en/build-with-claude/text-generation',
  '/docs/en/build-with-claude/prompt-engineering',
  '/docs/en/build-with-claude/prompt-engineering/overview',
  '/docs/en/build-with-claude/prompt-engineering/chain-of-thought',
  '/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
  '/docs/en/build-with-claude/prompt-engineering/prefill-claudes-response',
  '/docs/en/build-with-claude/prompt-engineering/use-xml-tags',
  '/docs/en/build-with-claude/extended-thinking',
  '/docs/en/build-with-claude/adaptive-thinking',
  '/docs/en/build-with-claude/context-windows',
  '/docs/en/build-with-claude/prompt-caching',
  '/docs/en/build-with-claude/vision',
  '/docs/en/build-with-claude/pdf-support',
  '/docs/en/build-with-claude/audio',
  '/docs/en/build-with-claude/citations',
  '/docs/en/build-with-claude/tool-use/overview',
  '/docs/en/build-with-claude/tool-use/token-counting',
  '/docs/en/build-with-claude/computer-use',
  '/docs/en/build-with-claude/web-search',
  '/docs/en/build-with-claude/files-api',
  '/docs/en/build-with-claude/batch-processing',
  '/docs/en/build-with-claude/message-batches-examples',
  '/docs/en/build-with-claude/streaming',
  '/docs/en/build-with-claude/token-counting',
  '/docs/en/build-with-claude/embeddings',
  '/docs/en/build-with-claude/multilingual',
  '/docs/en/build-with-claude/content-moderation',
  // Agent SDK
  '/docs/en/agent-sdk/overview',
  '/docs/en/agent-sdk/quickstart',
  '/docs/en/agent-sdk/tools',
  '/docs/en/agent-sdk/model-context-protocol',
  '/docs/en/agent-sdk/multi-agent',
  '/docs/en/agent-sdk/guardrails',
  '/docs/en/agent-sdk/tracing',
  '/docs/en/agent-sdk/human-in-the-loop',
  // Administration
  '/docs/en/administration/administration-api',
  '/docs/en/administration/service-accounts',
  '/docs/en/administration/model-lifecycle',
  // API Reference
  '/docs/en/api/overview',
  '/docs/en/api/errors',
  '/docs/en/api/rate-limits',
  '/docs/en/api/versioning',
  '/docs/en/api/ip-addresses',
  '/docs/en/api/service-tiers',
  '/docs/en/api/messages',
  '/docs/en/api/messages-streaming',
  '/docs/en/api/message-batches',
  '/docs/en/api/models-list',
  '/docs/en/api/tokens-count',
  '/docs/en/api/files',
  // Resources
  '/docs/en/release-notes/overview',
  '/docs/en/release-notes/api',
  '/docs/en/release-notes/claude-apps',
  '/docs/en/resources/glossary',
  '/docs/en/resources/model-card',
  '/docs/en/resources/supported-regions',
].map((path) => `https://platform.claude.com${path}`);

// ─── Code.claude.com URL list (from sitemap, English only) ──────────────────

async function fetchCodeClaudeUrls(): Promise<string[]> {
  try {
    const res = await fetch('https://code.claude.com/docs/sitemap.xml', {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) throw new Error(`Sitemap HTTP ${res.status}`);
    const xml = await res.text();
    const urls: string[] = [];
    const regex = /<loc>(https:\/\/code\.claude\.com\/docs\/en\/[^<]+)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  } catch (err) {
    console.warn('Failed to fetch code.claude.com sitemap, using fallback list');
    return CODE_CLAUDE_FALLBACK;
  }
}

const CODE_CLAUDE_FALLBACK = [
  'overview', 'quickstart', 'setup', 'features-overview', 'interactive-mode',
  'cli-reference', 'common-workflows', 'best-practices', 'memory', 'settings',
  'permissions', 'hooks', 'hooks-guide', 'skills', 'sub-agents', 'agent-teams',
  'mcp', 'plugins', 'plugins-reference', 'discover-plugins', 'plugin-marketplaces',
  'vs-code', 'jetbrains', 'desktop', 'desktop-quickstart', 'chrome', 'slack',
  'claude-code-on-the-web', 'remote-control', 'github-actions', 'gitlab-ci-cd',
  'headless', 'how-claude-code-works', 'model-config', 'fast-mode', 'output-styles',
  'keybindings', 'statusline', 'terminal-config', 'network-config', 'devcontainer',
  'sandboxing', 'authentication', 'amazon-bedrock', 'google-vertex-ai',
  'microsoft-foundry', 'llm-gateway', 'third-party-integrations',
  'server-managed-settings', 'monitoring-usage', 'analytics', 'costs',
  'data-usage', 'security', 'legal-and-compliance', 'checkpointing',
  'troubleshooting',
].map((slug) => `https://code.claude.com/docs/en/${slug}`);

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrawlResult {
  url: string;
  title: string;
  contentText: string;
  sidebarLinks: { title: string; url?: string }[];
  crawledAt: string;
  contentLength: number;
}

// ─── HTML entity decoding ────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }
  // Hex entities: &#x27; &#x2F; etc.
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  // Decimal entities: &#039; &#39; etc.
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10)),
  );
  return decoded;
}

// ─── HTML extraction ─────────────────────────────────────────────────────────

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match) return 'Untitled';
  const raw = match[1].replace(/\s*[-|–]\s*Claude.*$/i, '').trim() || match[1].trim();
  return decodeHtmlEntities(raw);
}

function extractBodyText(html: string): string {
  let text = html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const mainMatch = text.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
  const articleMatch = text.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  const contentSource = mainMatch?.[1] ?? articleMatch?.[1] ?? text;

  let cleaned = contentSource.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&apos;/g, "'");
  cleaned = cleaned.replace(/&#039;/g, "'");
  // Hex entities: &#x27; &#x2F; etc.
  cleaned = cleaned.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  // Decimal entities: &#39; etc.
  cleaned = cleaned.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10)),
  );
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

function extractSidebarLinks(html: string): { title: string; url?: string }[] {
  const links: { title: string; url?: string }[] = [];
  // Try multiple sidebar patterns
  const patterns = [
    /<nav[^>]*(?:sidebar|side-nav|docs-nav|navigation)[^>]*>([\s\S]*?)<\/nav>/gi,
    /<aside[^>]*>([\s\S]*?)<\/aside>/gi,
    /<div[^>]*(?:sidebar|side-nav|navigation)[^>]*>([\s\S]*?)<\/div>/gi,
  ];

  for (const pattern of patterns) {
    let sidebarMatch;
    while ((sidebarMatch = pattern.exec(html)) !== null) {
      const sidebarHtml = sidebarMatch[1];
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(sidebarHtml)) !== null) {
        const url = linkMatch[1].trim();
        const title = linkMatch[2].trim();
        if (title && url && !url.startsWith('#') && !url.startsWith('javascript:')) {
          links.push({ title, url: url.startsWith('/') ? url : undefined });
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = `${l.title}|${l.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Fetch with retries ─────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<CrawlResult | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });

      if (res.status === 404) {
        console.warn(`  [404] ${url} - skipping`);
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const title = extractTitle(html);
      const contentText = extractBodyText(html);
      const sidebarLinks = extractSidebarLinks(html);

      // Skip if content is too short (likely CSR shell)
      if (contentText.length < 100) {
        console.warn(`  [SHORT] ${url} - only ${contentText.length} chars, may be CSR`);
      }

      return {
        url,
        title,
        contentText,
        sidebarLinks,
        crawledAt: new Date().toISOString(),
        contentLength: contentText.length,
      };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error(`  [FAIL] ${url} after ${MAX_RETRIES} attempts: ${err}`);
        return null;
      }
      await sleep(1000 * attempt);
    }
  }
  return null;
}

// ─── Supabase operations ─────────────────────────────────────────────────────

function computeHash(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function getSection(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts.length >= 3) return parts[2];
    return parts[1] ?? null;
  } catch {
    return null;
  }
}

async function saveToSupabase(result: CrawlResult): Promise<'new' | 'unchanged' | 'error'> {
  try {
    // Upsert page
    const { data: page, error: pageErr } = await supabase
      .from('pages')
      .upsert(
        {
          url: result.url,
          domain: getDomain(result.url),
          section: getSection(result.url),
          title: result.title,
          last_crawled_at: result.crawledAt,
        },
        { onConflict: 'url' },
      )
      .select()
      .single();

    if (pageErr) throw pageErr;

    const contentHash = computeHash(result.contentText);

    // Check if we already have this exact content
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

    // Insert new snapshot
    const sidebarTree =
      result.sidebarLinks.length > 0
        ? result.sidebarLinks.map((l) => ({ title: l.title, url: l.url }))
        : null;

    const { data: snapshot, error: snapErr } = await supabase
      .from('snapshots')
      .insert({
        page_id: page.id,
        content_hash: contentHash,
        content_text: result.contentText,
        sidebar_tree: sidebarTree,
        crawled_at: result.crawledAt,
      })
      .select()
      .single();

    if (snapErr) throw snapErr;

    // Record as 'added' (initial snapshot)
    const today = new Date().toISOString().split('T')[0];
    const { error: changeErr } = await supabase.from('changes').insert({
      page_id: page.id,
      snapshot_before_id: null,
      snapshot_after_id: snapshot.id,
      change_type: 'added',
      diff_html: null,
      diff_summary: `Initial snapshot of "${result.title}"`,
      detected_at: today,
    });

    if (changeErr) throw changeErr;

    return 'new';
  } catch (err) {
    console.error(`  [DB ERROR] ${result.url}: ${err}`);
    return 'error';
  }
}

// ─── Concurrent crawler ─────────────────────────────────────────────────────

async function crawlBatch(urls: string[], batchLabel: string): Promise<{
  crawled: number;
  saved: number;
  skipped: number;
  errors: number;
}> {
  const stats = { crawled: 0, saved: 0, skipped: 0, errors: 0 };
  const queue = [...urls];
  const active: Promise<void>[] = [];

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift()!;
      const result = await fetchPage(url);

      if (!result) {
        stats.skipped++;
        stats.crawled++;
        console.log(`  [${stats.crawled}/${urls.length}] SKIP ${url}`);
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      stats.crawled++;

      if (DRY_RUN) {
        console.log(
          `  [${stats.crawled}/${urls.length}] ${result.title} (${result.contentLength} chars, ${result.sidebarLinks.length} sidebar links)`,
        );
        stats.saved++;
      } else {
        const status = await saveToSupabase(result);
        if (status === 'new') {
          stats.saved++;
          console.log(
            `  [${stats.crawled}/${urls.length}] NEW ${result.title} (${result.contentLength} chars)`,
          );
        } else if (status === 'unchanged') {
          stats.skipped++;
          console.log(
            `  [${stats.crawled}/${urls.length}] UNCHANGED ${result.title}`,
          );
        } else {
          stats.errors++;
          console.log(
            `  [${stats.crawled}/${urls.length}] ERROR ${result.url}`,
          );
        }
      }

      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\n[${batchLabel}] Starting ${urls.length} URLs with concurrency ${CONCURRENCY}...`);

  for (let i = 0; i < Math.min(CONCURRENCY, urls.length); i++) {
    active.push(processNext());
  }

  await Promise.all(active);

  console.log(
    `[${batchLabel}] Done: ${stats.saved} saved, ${stats.skipped} skipped, ${stats.errors} errors`,
  );
  return stats;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Claude Docs Tracker — Initial Crawl ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Source: ${SOURCE}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  let platformUrls: string[] = [];
  let codeUrls: string[] = [];

  if (SOURCE === 'all' || SOURCE === 'platform') {
    platformUrls = PLATFORM_URLS;
    console.log(`\nPlatform docs: ${platformUrls.length} URLs`);
  }

  if (SOURCE === 'all' || SOURCE === 'code') {
    codeUrls = await fetchCodeClaudeUrls();
    console.log(`Code docs: ${codeUrls.length} URLs`);
  }

  const totalStats = { crawled: 0, saved: 0, skipped: 0, errors: 0 };

  if (platformUrls.length > 0) {
    const stats = await crawlBatch(platformUrls, 'platform.claude.com');
    totalStats.crawled += stats.crawled;
    totalStats.saved += stats.saved;
    totalStats.skipped += stats.skipped;
    totalStats.errors += stats.errors;
  }

  if (codeUrls.length > 0) {
    const stats = await crawlBatch(codeUrls, 'code.claude.com');
    totalStats.crawled += stats.crawled;
    totalStats.saved += stats.saved;
    totalStats.skipped += stats.skipped;
    totalStats.errors += stats.errors;
  }

  // Update daily report
  if (!DRY_RUN) {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('daily_reports').upsert(
      {
        report_date: today,
        total_changes: totalStats.saved,
        new_pages: totalStats.saved,
        modified_pages: 0,
        removed_pages: 0,
        ai_summary: `초기 크롤링 완료: ${totalStats.saved}개 문서의 초기 스냅샷을 저장했습니다.`,
      },
      { onConflict: 'report_date' },
    );
  }

  console.log('\n=== Summary ===');
  console.log(`Total crawled: ${totalStats.crawled}`);
  console.log(`New snapshots saved: ${totalStats.saved}`);
  console.log(`Skipped (404/unchanged): ${totalStats.skipped}`);
  console.log(`Errors: ${totalStats.errors}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
