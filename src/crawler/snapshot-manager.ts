import { createHash } from 'crypto';
import {
  upsertPage,
  insertSnapshot,
  getLatestSnapshot,
  insertChange,
} from '@/db/queries';
import { getDomainFromUrl, getSectionFromUrl } from './sitemap-parser';
import { generateTextDiff, generateSidebarDiff } from './diff-generator';
import type { CrawlResult } from './page-crawler';
import type { ChangeType } from '@/db/types';

export function computeHash(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

export interface ProcessResult {
  url: string;
  status: 'new' | 'modified' | 'unchanged' | 'error';
  changeType?: ChangeType;
  error?: string;
}

export async function processSnapshot(crawlResult: CrawlResult): Promise<ProcessResult> {
  try {
    const page = await upsertPage({
      url: crawlResult.url,
      domain: getDomainFromUrl(crawlResult.url),
      section: getSectionFromUrl(crawlResult.url),
      title: crawlResult.title,
    });

    const contentHash = computeHash(crawlResult.contentText);
    const latestSnapshot = await getLatestSnapshot(page.id);

    if (latestSnapshot && latestSnapshot.content_hash === contentHash) {
      return { url: crawlResult.url, status: 'unchanged' };
    }

    const newSnapshot = await insertSnapshot({
      page_id: page.id,
      content_hash: contentHash,
      content_text: crawlResult.contentText,
      sidebar_tree: crawlResult.sidebarTree as Record<string, unknown> | null,
      crawled_at: crawlResult.crawledAt,
    });

    const isNewPage = !latestSnapshot;
    const changeType: ChangeType = isNewPage ? 'added' : 'modified';
    const today = new Date().toISOString().split('T')[0];

    let diffHtml: string | null = null;
    if (!isNewPage && latestSnapshot) {
      const diff = generateTextDiff(latestSnapshot.content_text, crawlResult.contentText);
      diffHtml = diff.diffHtml;

      const sidebarDiff = generateSidebarDiff(
        latestSnapshot.sidebar_tree as unknown as null,
        crawlResult.sidebarTree,
      );
      if (sidebarDiff.hasChanges && !diff.hasChanges) {
        await insertChange({
          page_id: page.id,
          snapshot_before_id: latestSnapshot.id,
          snapshot_after_id: newSnapshot.id,
          change_type: 'sidebar_changed',
          diff_html: null,
          diff_summary: null,
          detected_at: today,
        });
      }
    }

    await insertChange({
      page_id: page.id,
      snapshot_before_id: latestSnapshot?.id ?? null,
      snapshot_after_id: newSnapshot.id,
      change_type: changeType,
      diff_html: diffHtml,
      diff_summary: null,
      detected_at: today,
    });

    return { url: crawlResult.url, status: isNewPage ? 'new' : 'modified', changeType };
  } catch (error) {
    return {
      url: crawlResult.url,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
