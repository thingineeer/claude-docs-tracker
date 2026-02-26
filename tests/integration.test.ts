import { parseSitemapXml, getDomainFromUrl, getSectionFromUrl } from '@/crawler/sitemap-parser';
import { extractTitle, extractBodyText } from '@/crawler/page-crawler';
import { generateTextDiff, generateSidebarDiff } from '@/crawler/diff-generator';

describe('Integration: Crawl to Diff Pipeline', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Extended Thinking - Claude Docs</title></head>
    <body>
      <nav class="sidebar">
        <a href="/docs/overview">Overview</a>
        <a href="/docs/extended-thinking">Extended Thinking</a>
      </nav>
      <main>
        <h1>Extended Thinking</h1>
        <p>Extended thinking allows Claude to think step by step before responding.</p>
        <p>This feature improves accuracy on complex tasks.</p>
      </main>
      <footer>Copyright 2026</footer>
    </body>
    </html>
  `;

  it('extracts page title from HTML', () => {
    const title = extractTitle(sampleHtml);
    expect(title).toBe('Extended Thinking - Claude Docs');
  });

  it('extracts main content, excluding nav and footer', () => {
    const text = extractBodyText(sampleHtml);
    expect(text).toContain('Extended Thinking');
    expect(text).toContain('step by step');
    expect(text).not.toContain('Copyright 2026');
  });

  it('generates diff between two versions', () => {
    const oldText = 'Extended thinking allows Claude to think.\nThis is version 1.';
    const newText = 'Extended thinking allows Claude to reason step by step.\nThis is version 2.\nNew paragraph added.';

    const diff = generateTextDiff(oldText, newText);
    expect(diff.hasChanges).toBe(true);
    expect(diff.diffHtml).toContain('diff-added');
    expect(diff.diffHtml).toContain('diff-removed');
  });

  it('detects sidebar structure changes', () => {
    const oldSidebar = [
      { title: 'Overview', url: '/docs/overview' },
      { title: 'Models', url: '/docs/models' },
    ];
    const newSidebar = [
      { title: 'Overview', url: '/docs/overview' },
      { title: 'Models', url: '/docs/models' },
      { title: 'Extended Thinking', url: '/docs/extended-thinking' },
    ];

    const sidebarDiff = generateSidebarDiff(oldSidebar, newSidebar);
    expect(sidebarDiff.hasChanges).toBe(true);
    expect(sidebarDiff.added).toHaveLength(1);
    expect(sidebarDiff.added[0].title).toBe('Extended Thinking');
  });

  it('full pipeline: sitemap → extract → diff', () => {
    // Step 1: Parse sitemap
    const sitemapXml = `<urlset>
      <url><loc>https://platform.claude.com/docs/en/extended-thinking</loc></url>
    </urlset>`;
    const entries = parseSitemapXml(sitemapXml);
    expect(entries).toHaveLength(1);

    // Step 2: Get metadata
    const url = entries[0].url;
    expect(getDomainFromUrl(url)).toBe('platform.claude.com');
    expect(getSectionFromUrl(url)).toBe('extended-thinking');

    // Step 3: Extract content
    const title = extractTitle(sampleHtml);
    const content = extractBodyText(sampleHtml);
    expect(title).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);

    // Step 4: Generate diff
    const diff = generateTextDiff('', content);
    expect(diff.hasChanges).toBe(true);
  });
});

describe('Integration: Mock Data Rendering', () => {
  it('generates valid diff HTML for rendering', () => {
    const oldContent = 'Claude supports tool use.\nModels available: Sonnet, Haiku.';
    const newContent = 'Claude supports tool use and web search.\nModels available: Sonnet, Haiku, Opus.';

    const diff = generateTextDiff(oldContent, newContent);
    expect(diff.hasChanges).toBe(true);
    expect(diff.diffHtml).toContain('diff-');
    // HTML should be escaped
    expect(diff.diffHtml).not.toContain('<script');
  });

  it('handles empty content gracefully', () => {
    const diff = generateTextDiff('', '');
    expect(diff.hasChanges).toBe(false);
  });

  it('handles large content diff', () => {
    const oldText = Array.from({ length: 100 }, (_, i) => `Line ${i}: original content`).join('\n');
    const newText = Array.from({ length: 100 }, (_, i) =>
      i % 10 === 0 ? `Line ${i}: MODIFIED content` : `Line ${i}: original content`
    ).join('\n');

    const diff = generateTextDiff(oldText, newText);
    expect(diff.hasChanges).toBe(true);
    expect(diff.addedLines).toBeGreaterThan(0);
    expect(diff.removedLines).toBeGreaterThan(0);
  });
});
