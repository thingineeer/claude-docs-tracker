export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

const TARGET_DOMAINS = [
  'https://platform.claude.com/docs',
  'https://code.claude.com/docs',
];

const SITEMAP_URLS = [
  'https://platform.claude.com/sitemap.xml',
  'https://code.claude.com/docs/sitemap.xml',
];

export async function fetchSitemapUrls(): Promise<SitemapEntry[]> {
  const allEntries: SitemapEntry[] = [];

  for (const sitemapUrl of SITEMAP_URLS) {
    try {
      const entries = await parseSitemap(sitemapUrl);
      allEntries.push(...entries);
    } catch (error) {
      console.warn(`Failed to fetch sitemap from ${sitemapUrl}:`, error);
    }
  }

  return allEntries;
}

async function parseSitemap(url: string): Promise<SitemapEntry[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'claude-docs-tracker/1.0 (https://github.com/thingineeer/claude-docs-tracker)',
    },
  });

  if (!response.ok) {
    throw new Error(`Sitemap fetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseSitemapXml(xml);
}

export function parseSitemapXml(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const urlRegex = /<url>([\s\S]*?)<\/url>/g;
  const locRegex = /<loc>([^<]+)<\/loc>/;
  const lastmodRegex = /<lastmod>([^<]+)<\/lastmod>/;

  let match;
  while ((match = urlRegex.exec(xml)) !== null) {
    const urlBlock = match[1];
    const locMatch = locRegex.exec(urlBlock);
    if (!locMatch) continue;

    const url = locMatch[1].trim();
    const lastmodMatch = lastmodRegex.exec(urlBlock);
    const lastmod = lastmodMatch?.[1]?.trim();

    if (isDocumentationUrl(url)) {
      entries.push({ url, ...(lastmod ? { lastmod } : {}) });
    }
  }

  return entries;
}

function isDocumentationUrl(url: string): boolean {
  return TARGET_DOMAINS.some((domain) => url.startsWith(domain)) && isEnglishLocale(url);
}

function isEnglishLocale(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    // URL pattern: /docs/{locale}/... — only track English (en)
    if (pathParts.length >= 2 && pathParts[0] === 'docs') {
      return pathParts[1] === 'en';
    }
    return true; // Allow URLs that don't match the locale pattern
  } catch {
    return false;
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'unknown';
  }
}

export function getSectionFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    // e.g., /docs/en/build-with-claude/... => "build-with-claude"
    if (pathParts.length >= 3) {
      return pathParts[2];
    }
    return pathParts[1] ?? null;
  } catch {
    return null;
  }
}
