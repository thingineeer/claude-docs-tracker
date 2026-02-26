import { createHash } from 'crypto';
import {
  upsertPage,
  insertSnapshot,
  getLatestSnapshot,
  insertChange,
  getCategoryFromPage,
} from '@/db/queries';
import { getDomainFromUrl, getSectionFromUrl } from './sitemap-parser';
import { generateTextDiff, generateSidebarDiff } from './diff-generator';
import type { CrawlResult } from './page-crawler';
import type { ChangeType } from '@/db/types';

const MAX_CONTENT_SIZE_BYTES = 1024 * 1024; // 1MB

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
    const domain = getDomainFromUrl(crawlResult.url);
    const section = getSectionFromUrl(crawlResult.url);
    const page = await upsertPage({
      url: crawlResult.url,
      domain,
      section,
      title: crawlResult.title,
      category: getCategoryFromPage(domain, section),
    });

    const contentHash = computeHash(crawlResult.contentText);
    const latestSnapshot = await getLatestSnapshot(page.id);

    if (latestSnapshot && latestSnapshot.content_hash === contentHash) {
      return { url: crawlResult.url, status: 'unchanged' };
    }

    let contentText = crawlResult.contentText;
    const contentSizeBytes = Buffer.byteLength(contentText, 'utf-8');
    if (contentSizeBytes > MAX_CONTENT_SIZE_BYTES) {
      console.warn(
        `Content size ${contentSizeBytes} bytes exceeds limit ${MAX_CONTENT_SIZE_BYTES} bytes for ${crawlResult.url}. Truncating.`,
      );
      // Truncate to approximately 1MB (accounting for UTF-8 encoding)
      contentText = contentText.substring(0, MAX_CONTENT_SIZE_BYTES);
    }

    const newSnapshot = await insertSnapshot({
      page_id: page.id,
      content_hash: contentHash,
      content_text: contentText,
      sidebar_tree: crawlResult.sidebarTree as Record<string, unknown> | null,
      crawled_at: crawlResult.crawledAt,
    });

    const isNewPage = !latestSnapshot;
    const changeType: ChangeType = isNewPage ? 'added' : 'modified';
    const today = new Date().toISOString().split('T')[0];

    let diffHtml: string | null = null;
    let sidebarOnlyChange = false;

    if (!isNewPage && latestSnapshot) {
      const diff = generateTextDiff(latestSnapshot.content_text, crawlResult.contentText);
      diffHtml = diff.diffHtml;

      const sidebarDiff = generateSidebarDiff(
        latestSnapshot.sidebar_tree as unknown as null,
        crawlResult.sidebarTree,
      );
      if (sidebarDiff.hasChanges && !diff.hasChanges) {
        sidebarOnlyChange = true;
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

    // Skip inserting a 'modified' change when only the sidebar changed
    if (!sidebarOnlyChange) {
      await insertChange({
        page_id: page.id,
        snapshot_before_id: latestSnapshot?.id ?? null,
        snapshot_after_id: newSnapshot.id,
        change_type: changeType,
        diff_html: diffHtml,
        diff_summary: null,
        detected_at: today,
      });
    }

    return {
      url: crawlResult.url,
      status: isNewPage ? 'new' : 'modified',
      changeType: sidebarOnlyChange ? 'sidebar_changed' : changeType,
    };
  } catch (error) {
    return {
      url: crawlResult.url,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
