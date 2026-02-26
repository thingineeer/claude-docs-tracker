import { parseSitemapXml, getDomainFromUrl, getSectionFromUrl } from '@/crawler/sitemap-parser';

describe('parseSitemapXml', () => {
  it('parses valid sitemap XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://platform.claude.com/docs/en/overview</loc>
    <lastmod>2026-02-25</lastmod>
  </url>
  <url>
    <loc>https://code.claude.com/docs/en/getting-started</loc>
  </url>
  <url>
    <loc>https://example.com/other</loc>
  </url>
</urlset>`;

    const entries = parseSitemapXml(xml);
    expect(entries).toHaveLength(2);
    expect(entries[0].url).toBe('https://platform.claude.com/docs/en/overview');
    expect(entries[0].lastmod).toBe('2026-02-25');
    expect(entries[1].url).toBe('https://code.claude.com/docs/en/getting-started');
    expect(entries[1].lastmod).toBeUndefined();
  });

  it('returns empty array for empty sitemap', () => {
    const xml = `<?xml version="1.0"?><urlset></urlset>`;
    expect(parseSitemapXml(xml)).toHaveLength(0);
  });

  it('filters out non-documentation URLs', () => {
    const xml = `<urlset>
      <url><loc>https://example.com/page</loc></url>
    </urlset>`;
    expect(parseSitemapXml(xml)).toHaveLength(0);
  });

  it('filters out non-English locale URLs', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://platform.claude.com/docs/en/overview</loc></url>
  <url><loc>https://platform.claude.com/docs/ja/overview</loc></url>
  <url><loc>https://platform.claude.com/docs/ko/overview</loc></url>
  <url><loc>https://platform.claude.com/docs/de/overview</loc></url>
  <url><loc>https://code.claude.com/docs/en/quickstart</loc></url>
  <url><loc>https://code.claude.com/docs/zh-CN/quickstart</loc></url>
  <url><loc>https://code.claude.com/docs/fr/quickstart</loc></url>
</urlset>`;

    const entries = parseSitemapXml(xml);
    expect(entries).toHaveLength(2);
    expect(entries[0].url).toBe('https://platform.claude.com/docs/en/overview');
    expect(entries[1].url).toBe('https://code.claude.com/docs/en/quickstart');
  });
});

describe('getDomainFromUrl', () => {
  it('extracts domain', () => {
    expect(getDomainFromUrl('https://platform.claude.com/docs/en/overview')).toBe(
      'platform.claude.com',
    );
    expect(getDomainFromUrl('https://code.claude.com/docs/en/setup')).toBe('code.claude.com');
  });

  it('handles invalid URLs', () => {
    expect(getDomainFromUrl('not-a-url')).toBe('unknown');
  });
});

describe('getSectionFromUrl', () => {
  it('extracts section', () => {
    expect(getSectionFromUrl('https://platform.claude.com/docs/en/build-with-claude/caching')).toBe(
      'build-with-claude',
    );
  });

  it('returns null for short paths', () => {
    expect(getSectionFromUrl('https://platform.claude.com/docs')).toBeNull();
  });
});
