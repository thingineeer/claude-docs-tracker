import { isNewsUrl, extractNewsTitle, extractNewsContent } from '@/crawler/anthropic-news-crawler';
import { getCategoryForPage } from '@/lib/categories';
import { getDomainFromUrl } from '@/crawler/sitemap-parser';

describe('isNewsUrl', () => {
  it('matches valid news article URLs', () => {
    expect(isNewsUrl('https://www.anthropic.com/news/claude-sonnet-4-6')).toBe(true);
    expect(isNewsUrl('https://www.anthropic.com/news/model-card')).toBe(true);
  });

  it('rejects news index page without slug', () => {
    expect(isNewsUrl('https://www.anthropic.com/news')).toBe(false);
  });

  it('rejects non-news URLs', () => {
    expect(isNewsUrl('https://www.anthropic.com/research/some-paper')).toBe(false);
    expect(isNewsUrl('https://www.anthropic.com/about')).toBe(false);
    expect(isNewsUrl('https://platform.claude.com/docs/en/api')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isNewsUrl('not-a-url')).toBe(false);
    expect(isNewsUrl('')).toBe(false);
  });
});

describe('extractNewsTitle', () => {
  it('extracts title from h1 tag', () => {
    const html = '<html><head><title>Test | Anthropic</title></head><body><h1>Breaking News</h1></body></html>';
    expect(extractNewsTitle(html)).toBe('Breaking News');
  });

  it('falls back to title tag without Anthropic suffix', () => {
    const html = '<html><head><title>Claude Sonnet 4.6 | Anthropic</title></head><body></body></html>';
    expect(extractNewsTitle(html)).toBe('Claude Sonnet 4.6');
  });

  it('returns Untitled when no title found', () => {
    const html = '<html><body><p>Content only</p></body></html>';
    expect(extractNewsTitle(html)).toBe('Untitled');
  });

  it('strips HTML from h1 content', () => {
    const html = '<h1><span>Styled</span> Title</h1>';
    expect(extractNewsTitle(html)).toBe('Styled Title');
  });
});

describe('extractNewsContent', () => {
  it('extracts text from article tag', () => {
    const html = '<html><body><article><p>Main content here</p></article></body></html>';
    const content = extractNewsContent(html);
    expect(content).toContain('Main content here');
  });

  it('removes script and style tags', () => {
    const html = '<article><script>alert("x")</script><p>Real content</p><style>.x{}</style></article>';
    const content = extractNewsContent(html);
    expect(content).not.toContain('alert');
    expect(content).not.toContain('.x{}');
    expect(content).toContain('Real content');
  });

  it('returns fallback for empty content', () => {
    const html = '<html><body></body></html>';
    const content = extractNewsContent(html);
    expect(content).toBeTruthy();
  });

  it('normalizes whitespace', () => {
    const html = '<article><p>Word1</p>   <p>Word2</p></article>';
    const content = extractNewsContent(html);
    expect(content).not.toContain('   ');
  });
});

describe('Anthropic News category classification', () => {
  it('classifies www.anthropic.com as anthropic-news', () => {
    expect(getCategoryForPage('www.anthropic.com', 'news')).toBe('anthropic-news');
    expect(getCategoryForPage('www.anthropic.com', null)).toBe('anthropic-news');
  });

  it('extracts domain correctly from news URL', () => {
    expect(getDomainFromUrl('https://www.anthropic.com/news/claude-sonnet-4-6')).toBe('www.anthropic.com');
  });
});
