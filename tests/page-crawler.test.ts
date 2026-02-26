import { extractTitle, extractBodyText } from '@/crawler/page-crawler';

describe('extractTitle', () => {
  it('extracts title from HTML', () => {
    expect(extractTitle('<html><head><title>Test Page</title></head></html>')).toBe('Test Page');
  });

  it('returns Untitled for missing title', () => {
    expect(extractTitle('<html><head></head></html>')).toBe('Untitled');
  });
});

describe('extractBodyText', () => {
  it('strips HTML tags', () => {
    const html = '<div><p>Hello <strong>world</strong></p></div>';
    expect(extractBodyText(html)).toContain('Hello');
    expect(extractBodyText(html)).toContain('world');
    expect(extractBodyText(html)).not.toContain('<strong>');
  });

  it('removes script tags and content', () => {
    const html = '<div>content<script>alert("xss")</script>more</div>';
    const result = extractBodyText(html);
    expect(result).not.toContain('alert');
    expect(result).toContain('content');
    expect(result).toContain('more');
  });

  it('removes nav, header, footer', () => {
    const html = `
      <nav>Navigation</nav>
      <header>Header</header>
      <main>Main content here</main>
      <footer>Footer</footer>
    `;
    const result = extractBodyText(html);
    expect(result).toContain('Main content here');
    expect(result).not.toContain('Navigation');
    expect(result).not.toContain('Footer');
  });

  it('extracts main content when available', () => {
    const html = '<body><aside>Sidebar</aside><main><p>Important content</p></main></body>';
    const result = extractBodyText(html);
    expect(result).toContain('Important content');
  });
});
