import { GITHUB_REPO, GITHUB_API_BASE, GITHUB_RELEASES_PER_PAGE, MAX_RETRIES } from './config';
import { processSnapshot, type ProcessResult } from './snapshot-manager';
import { getGitHubReleasePages, getLatestSnapshotForPage, insertChange } from '@/db/queries';
import { toLocalDateString, getTodayString } from '@/lib/timezone';
import type { CrawlResult } from './page-crawler';

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  html_url: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  created_at: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('[github] GITHUB_TOKEN not set — using unauthenticated rate limit (60 req/hr)');
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const allReleases: GitHubRelease[] = [];
  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/releases?per_page=${GITHUB_RELEASES_PER_PAGE}&page=${page}`;

    let releases: GitHubRelease[] | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, { headers });

        const remaining = response.headers.get('X-RateLimit-Remaining');
        const limit = response.headers.get('X-RateLimit-Limit');
        console.log(`[github] Page ${page} — Rate limit: ${remaining}/${limit}`);

        if (!response.ok) {
          throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
        }

        releases = await response.json();
        break;
      } catch (error) {
        console.warn(`[github] Page ${page}, attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        if (attempt === MAX_RETRIES) {
          throw error;
        }
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    if (!releases || releases.length === 0) break;

    const nonDraftReleases = releases.filter((r) => !r.draft);
    allReleases.push(...nonDraftReleases);

    if (releases.length < GITHUB_RELEASES_PER_PAGE) break; // last page

    if (page < maxPages) await sleep(1000); // rate limit delay
  }

  return allReleases;
}

export function releaseToCrawlResult(release: GitHubRelease): CrawlResult {
  return {
    url: release.html_url,
    title: `Claude Code ${release.tag_name}`,
    contentText: release.body || '(No release notes)',
    sidebarTree: null,
    crawledAt: new Date().toISOString(),
  };
}

export async function processGitHubReleases(): Promise<ProcessResult[]> {
  console.log('[github] Fetching GitHub releases...');
  const releases = await fetchGitHubReleases();
  console.log(`[github] Found ${releases.length} published releases`);

  const results: ProcessResult[] = [];

  for (const release of releases) {
    const crawlResult = releaseToCrawlResult(release);
    const detectedAt = toLocalDateString(release.published_at);
    const result = await processSnapshot(crawlResult, { detectedAt });
    results.push(result);

    if (result.status !== 'unchanged') {
      console.log(`[github] ${result.status}: ${result.url}`);
    }
  }

  return results;
}

export async function detectUnpublishedReleases(
  currentReleaseUrls: string[],
): Promise<number> {
  console.log('[github] Checking for unpublished releases...');

  const currentUrlSet = new Set(currentReleaseUrls);
  const dbPages = await getGitHubReleasePages();

  const today = getTodayString();
  let removedCount = 0;

  for (const page of dbPages) {
    if (!currentUrlSet.has(page.url)) {
      console.log(`[github] Unpublished release detected: ${page.url}`);

      const latestSnapshot = await getLatestSnapshotForPage(page.id);
      if (!latestSnapshot) continue;

      try {
        await insertChange({
          page_id: page.id,
          snapshot_before_id: latestSnapshot.id,
          snapshot_after_id: latestSnapshot.id,
          change_type: 'removed',
          diff_html: null,
          diff_summary: null,
          detected_at: today,
        });
        removedCount++;
      } catch (error) {
        console.warn(`[github] Failed to record removal for ${page.url}:`, error);
      }
    }
  }

  if (removedCount > 0) {
    console.log(`[github] Detected ${removedCount} unpublished releases`);
  }
  return removedCount;
}
