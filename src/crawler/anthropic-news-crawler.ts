import { RATE_LIMIT_MS, MAX_RETRIES, USER_AGENT } from './config';
import { ANTHROPIC_NEWS_RECENT_LIMIT } from './config';
import { processSnapshot, type ProcessResult } from './snapshot-manager';
import type { CrawlResult } from './page-crawler';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch news article URLs from Anthropic's sitemap.
 * Filters for /news/{slug} paths only.
 */
export async function fetchAnthropicNewsUrls(): Promise<string[]> {
  const sitemapUrl = 'https://www.anthropic.com/sitemap.xml';

  let xml: string;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`Sitemap fetch failed: ${response.status}`);
      }

      xml = await response.text();
      break;
    } catch (error) {
      console.warn(`[anthropic-news] Sitemap attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt === MAX_RETRIES) throw error;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }

  // Extract <loc> URLs matching /news/ pattern
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml!)) !== null) {
    const url = match[1].trim();
    if (isNewsUrl(url)) {
      urls.push(url);
    }
  }

  console.log(`[anthropic-news] Found ${urls.length} news URLs in sitemap`);
  return urls;
}

/**
 * Check if a URL is an Anthropic news article.
 * Matches: https://www.anthropic.com/news/{slug}
 * Excludes: /news (index page without slug)
 */
export function isNewsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'www.anthropic.com') return false;
    const parts = parsed.pathname.split('/').filter(Boolean);
    // Must be /news/{slug} (at least 2 parts)
    return parts.length >= 2 && parts[0] === 'news';
  } catch {
    return false;
  }
}

/**
 * Crawl a single Anthropic news article and extract content.
 * Parses the <article> tag for the main content.
 */
export async function crawlNewsArticle(url: string): Promise<CrawlResult> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = extractNewsTitle(html);
      const contentText = extractNewsContent(html);

      return {
        url,
        title,
        contentText,
        sidebarTree: null,
        crawledAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`[anthropic-news] Attempt ${attempt}/${MAX_RETRIES} for ${url}:`, error);
      if (attempt === MAX_RETRIES) throw error;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }

  throw new Error(`Unreachable: crawlNewsArticle for ${url}`);
}

/**
 * Extract the page title from HTML.
 */
export function extractNewsTitle(html: string): string {
  // Try <h1> first (more specific)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const text = h1Match[1].replace(/<[^>]+>/g, '').trim();
    if (text) return text;
  }

  // Fallback to <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    // Remove " | Anthropic" suffix if present
    return titleMatch[1].replace(/\s*\|\s*Anthropic$/i, '').trim();
  }

  return 'Untitled';
}

/**
 * Extract article content text from HTML.
 * Targets <article> tag, strips HTML, normalizes whitespace.
 */
export function extractNewsContent(html: string): string {
  // Remove script and style tags
  let text = html;
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Try to extract <article> content
  const articleMatch = text.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  const contentSource = articleMatch?.[1] ?? text;

  // Strip HTML tags
  let cleaned = contentSource.replace(/<[^>]+>/g, ' ');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || '(No content)';
}

/**
 * Process Anthropic news articles through the snapshot pipeline.
 * Only processes the most recent articles to stay within Vercel timeout.
 */
export async function processAnthropicNews(): Promise<ProcessResult[]> {
  console.log('[anthropic-news] Fetching news URLs from sitemap...');
  const allUrls = await fetchAnthropicNewsUrls();

  // Only crawl recent articles to avoid Vercel timeout
  const urls = allUrls.slice(0, ANTHROPIC_NEWS_RECENT_LIMIT);
  console.log(`[anthropic-news] Crawling ${urls.length} recent articles (of ${allUrls.length} total)`);

  const results: ProcessResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const crawlResult = await crawlNewsArticle(urls[i]);
      const result = await processSnapshot(crawlResult);
      results.push(result);

      if (result.status !== 'unchanged') {
        console.log(`[anthropic-news] ${result.status}: ${result.url}`);
      }
    } catch (error) {
      console.error(`[anthropic-news] Skipping ${urls[i]}:`, error);
      results.push({
        url: urls[i],
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Rate limiting between requests
    if (i < urls.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  return results;
}
