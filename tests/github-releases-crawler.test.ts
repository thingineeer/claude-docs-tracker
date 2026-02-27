import { releaseToCrawlResult, type GitHubRelease } from '@/crawler/github-releases-crawler';
import { getCategoryForPage } from '@/lib/categories';
import { getDomainFromUrl, getSectionFromUrl } from '@/crawler/sitemap-parser';

function makeRelease(overrides: Partial<GitHubRelease> = {}): GitHubRelease {
  return {
    id: 1,
    tag_name: 'v2.1.62',
    name: 'v2.1.62',
    html_url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.62',
    body: '## What\'s Changed\n\n* Fix: resolved crash on startup\n* Feat: added new theme support',
    draft: false,
    prerelease: false,
    published_at: '2025-06-15T10:30:00Z',
    created_at: '2025-06-15T09:00:00Z',
    ...overrides,
  };
}

describe('releaseToCrawlResult', () => {
  it('converts a normal release to CrawlResult', () => {
    const release = makeRelease();
    const result = releaseToCrawlResult(release);

    expect(result.url).toBe('https://github.com/anthropics/claude-code/releases/tag/v2.1.62');
    expect(result.title).toBe('Claude Code v2.1.62');
    expect(result.contentText).toContain('Fix: resolved crash');
    expect(result.sidebarTree).toBeNull();
    expect(result.crawledAt).toBeTruthy();
  });

  it('handles null body with fallback text', () => {
    const release = makeRelease({ body: null });
    const result = releaseToCrawlResult(release);

    expect(result.contentText).toBe('(No release notes)');
  });

  it('handles empty body with fallback text', () => {
    const release = makeRelease({ body: '' });
    const result = releaseToCrawlResult(release);

    expect(result.contentText).toBe('(No release notes)');
  });
});

describe('GitHub URL domain/section parsing', () => {
  const githubUrl = 'https://github.com/anthropics/claude-code/releases/tag/v2.1.62';

  it('extracts domain as github.com', () => {
    expect(getDomainFromUrl(githubUrl)).toBe('github.com');
  });

  it('extracts section from GitHub URL', () => {
    // Path: /anthropics/claude-code/releases/tag/v2.1.62
    // pathParts[2] = 'releases'
    const section = getSectionFromUrl(githubUrl);
    expect(section).toBe('releases');
  });
});

describe('GitHub category classification', () => {
  it('classifies github.com as release-notes', () => {
    expect(getCategoryForPage('github.com', 'releases')).toBe('release-notes');
    expect(getCategoryForPage('github.com', 'claude-code')).toBe('release-notes');
    expect(getCategoryForPage('github.com', null)).toBe('release-notes');
  });
});

describe('fetchGitHubReleases', () => {
  it('filters out draft releases with pagination', async () => {
    const mockReleases = [
      makeRelease({ id: 1, tag_name: 'v2.1.62', draft: false }),
      makeRelease({ id: 2, tag_name: 'v2.1.63-rc1', draft: true }),
      makeRelease({ id: 3, tag_name: 'v2.1.61', draft: false }),
    ];

    const originalFetch = global.fetch;
    // Page 1 returns releases (< per_page, so pagination stops)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([
        ['X-RateLimit-Remaining', '59'],
        ['X-RateLimit-Limit', '60'],
      ]),
      json: () => Promise.resolve(mockReleases),
    });

    const { fetchGitHubReleases } = await import('@/crawler/github-releases-crawler');
    const releases = await fetchGitHubReleases();

    expect(releases).toHaveLength(2);
    expect(releases.every((r) => !r.draft)).toBe(true);
    expect(releases.map((r) => r.tag_name)).toEqual(['v2.1.62', 'v2.1.61']);
    // Only one fetch call since 3 < GITHUB_RELEASES_PER_PAGE (100)
    expect(global.fetch).toHaveBeenCalledTimes(1);

    global.fetch = originalFetch;
  });

  it('paginates through multiple pages until empty response', async () => {
    const page1Releases = Array.from({ length: 100 }, (_, i) =>
      makeRelease({ id: i + 1, tag_name: `v1.0.${i}`, draft: false }),
    );
    const page2Releases = [
      makeRelease({ id: 101, tag_name: 'v0.9.0', draft: false }),
      makeRelease({ id: 102, tag_name: 'v0.8.0', draft: true }),
    ];

    const originalFetch = global.fetch;
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      const data = callCount === 1 ? page1Releases : page2Releases;
      return Promise.resolve({
        ok: true,
        headers: new Map([
          ['X-RateLimit-Remaining', '58'],
          ['X-RateLimit-Limit', '60'],
        ]),
        json: () => Promise.resolve(data),
      });
    });

    const { fetchGitHubReleases } = await import('@/crawler/github-releases-crawler');
    const releases = await fetchGitHubReleases();

    // 100 from page 1 + 1 non-draft from page 2
    expect(releases).toHaveLength(101);
    expect(releases.every((r) => !r.draft)).toBe(true);
    // 2 fetch calls: page 1 (100 items) + page 2 (2 items, < 100 so stops)
    expect(global.fetch).toHaveBeenCalledTimes(2);

    global.fetch = originalFetch;
  });

  it('stops at empty page response', async () => {
    const page1Releases = Array.from({ length: 100 }, (_, i) =>
      makeRelease({ id: i + 1, tag_name: `v1.0.${i}`, draft: false }),
    );

    const originalFetch = global.fetch;
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      const data = callCount === 1 ? page1Releases : [];
      return Promise.resolve({
        ok: true,
        headers: new Map([
          ['X-RateLimit-Remaining', '58'],
          ['X-RateLimit-Limit', '60'],
        ]),
        json: () => Promise.resolve(data),
      });
    });

    const { fetchGitHubReleases } = await import('@/crawler/github-releases-crawler');
    const releases = await fetchGitHubReleases();

    expect(releases).toHaveLength(100);
    // 2 fetch calls: page 1 (100 items) + page 2 (empty, stops)
    expect(global.fetch).toHaveBeenCalledTimes(2);

    global.fetch = originalFetch;
  });

  it('warns when GITHUB_TOKEN is not set', async () => {
    const originalFetch = global.fetch;
    const originalToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([
        ['X-RateLimit-Remaining', '59'],
        ['X-RateLimit-Limit', '60'],
      ]),
      json: () => Promise.resolve([]),
    });

    const { fetchGitHubReleases } = await import('@/crawler/github-releases-crawler');
    await fetchGitHubReleases();

    expect(warnSpy).toHaveBeenCalledWith(
      '[github] GITHUB_TOKEN not set — using unauthenticated rate limit (60 req/hr)',
    );

    warnSpy.mockRestore();
    global.fetch = originalFetch;
    if (originalToken !== undefined) {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });
});

describe('detectedAt date extraction', () => {
  it('extracts YYYY-MM-DD from published_at', () => {
    const release = makeRelease({ published_at: '2025-06-15T10:30:00Z' });
    const detectedAt = release.published_at.split('T')[0];
    expect(detectedAt).toBe('2025-06-15');
  });
});
