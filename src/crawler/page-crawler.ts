export interface CrawlResult {
  url: string;
  title: string;
  contentText: string;
  sidebarTree: SidebarNode[] | null;
  crawledAt: string;
}

export interface SidebarNode {
  title: string;
  url?: string;
  children?: SidebarNode[];
}

const RATE_LIMIT_MS = 2000;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlPage(url: string, retries = MAX_RETRIES): Promise<CrawlResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'claude-docs-tracker/1.0 (https://github.com/thingineeer/claude-docs-tracker)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = extractTitle(html);
      const contentText = extractBodyText(html);
      const sidebarTree = extractSidebarTree(html);

      return {
        url,
        title,
        contentText,
        sidebarTree,
        crawledAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`Attempt ${attempt}/${retries} failed for ${url}:`, error);
      if (attempt === retries) {
        throw new Error(
          `Failed to crawl ${url} after ${retries} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await sleep(1000 * attempt);
    }
  }

  throw new Error(`Unreachable: crawlPage for ${url}`);
}

export async function crawlPages(
  urls: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await crawlPage(urls[i]);
      results.push(result);
      onProgress?.(i + 1, urls.length);
    } catch (error) {
      console.error(`Skipping ${urls[i]}:`, error);
    }

    if (i < urls.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  return results;
}

export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : 'Untitled';
}

export function extractBodyText(html: string): string {
  let text = html;

  // Remove script and style tags with content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove nav, header, footer elements
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '');

  // Try to extract main/article content first
  const mainMatch = text.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
  const articleMatch = text.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
  const contentSource = mainMatch?.[1] ?? articleMatch?.[1] ?? text;

  // Strip remaining HTML tags
  let cleaned = contentSource.replace(/<[^>]+>/g, ' ');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function extractSidebarTree(html: string): SidebarNode[] | null {
  // Look for sidebar/nav structure
  const sidebarMatch = html.match(
    /<nav[^>]*(?:sidebar|side-nav|docs-nav)[^>]*>([\s\S]*?)<\/nav>/i,
  );

  if (!sidebarMatch) return null;

  const sidebarHtml = sidebarMatch[1];
  return parseSidebarLinks(sidebarHtml);
}

function parseSidebarLinks(html: string): SidebarNode[] {
  const nodes: SidebarNode[] = [];
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1].trim();
    const title = match[2].trim();
    if (title) {
      nodes.push({ title, url: url || undefined });
    }
  }

  return nodes;
}
