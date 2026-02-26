import { diffLines, diffWords } from 'diff';
import type { SidebarNode } from './page-crawler';

export interface DiffResult {
  hasChanges: boolean;
  diffHtml: string;
  addedLines: number;
  removedLines: number;
}

export interface SidebarDiffResult {
  added: SidebarNode[];
  removed: SidebarNode[];
  hasChanges: boolean;
}

export function generateTextDiff(oldText: string, newText: string): DiffResult {
  if (oldText === newText) {
    return { hasChanges: false, diffHtml: '', addedLines: 0, removedLines: 0 };
  }

  const changes = diffLines(oldText, newText);
  let diffHtml = '';
  let addedLines = 0;
  let removedLines = 0;

  for (const part of changes) {
    const escapedValue = escapeHtml(part.value);
    const lines = part.value.split('\n').filter(Boolean).length;

    if (part.added) {
      diffHtml += `<div class="diff-added">${escapedValue}</div>`;
      addedLines += lines;
    } else if (part.removed) {
      diffHtml += `<div class="diff-removed">${escapedValue}</div>`;
      removedLines += lines;
    } else {
      diffHtml += `<div class="diff-unchanged">${escapedValue}</div>`;
    }
  }

  return { hasChanges: true, diffHtml, addedLines, removedLines };
}

export function generateInlineDiff(oldText: string, newText: string): string {
  const changes = diffWords(oldText, newText);
  let html = '';

  for (const part of changes) {
    const escaped = escapeHtml(part.value);
    if (part.added) {
      html += `<ins class="diff-ins">${escaped}</ins>`;
    } else if (part.removed) {
      html += `<del class="diff-del">${escaped}</del>`;
    } else {
      html += escaped;
    }
  }

  return html;
}

export function generateSidebarDiff(
  oldTree: SidebarNode[] | null,
  newTree: SidebarNode[] | null,
): SidebarDiffResult {
  if (!oldTree && !newTree) {
    return { added: [], removed: [], hasChanges: false };
  }

  if (!oldTree) {
    return { added: newTree ?? [], removed: [], hasChanges: (newTree?.length ?? 0) > 0 };
  }

  if (!newTree) {
    return { added: [], removed: oldTree, hasChanges: oldTree.length > 0 };
  }

  const oldUrls = new Set(flattenUrls(oldTree));
  const newUrls = new Set(flattenUrls(newTree));

  const added = flattenNodes(newTree).filter((node) => node.url && !oldUrls.has(node.url));
  const removed = flattenNodes(oldTree).filter((node) => node.url && !newUrls.has(node.url));

  return {
    added,
    removed,
    hasChanges: added.length > 0 || removed.length > 0,
  };
}

function flattenUrls(nodes: SidebarNode[]): string[] {
  const urls: string[] = [];
  for (const node of nodes) {
    if (node.url) urls.push(node.url);
    if (node.children) urls.push(...flattenUrls(node.children));
  }
  return urls;
}

function flattenNodes(nodes: SidebarNode[]): SidebarNode[] {
  const result: SidebarNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) result.push(...flattenNodes(node.children));
  }
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
