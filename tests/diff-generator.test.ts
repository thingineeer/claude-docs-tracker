import {
  generateTextDiff,
  generateInlineDiff,
  generateSidebarDiff,
} from '@/crawler/diff-generator';

describe('generateTextDiff', () => {
  it('detects no changes', () => {
    const result = generateTextDiff('hello world', 'hello world');
    expect(result.hasChanges).toBe(false);
    expect(result.diffHtml).toBe('');
  });

  it('detects added lines', () => {
    const result = generateTextDiff('line1\n', 'line1\nline2\n');
    expect(result.hasChanges).toBe(true);
    expect(result.addedLines).toBeGreaterThan(0);
    expect(result.diffHtml).toContain('diff-added');
  });

  it('detects removed lines', () => {
    const result = generateTextDiff('line1\nline2\n', 'line1\n');
    expect(result.hasChanges).toBe(true);
    expect(result.removedLines).toBeGreaterThan(0);
    expect(result.diffHtml).toContain('diff-removed');
  });

  it('escapes HTML in content', () => {
    const result = generateTextDiff('<script>alert(1)</script>\n', 'safe text\n');
    expect(result.diffHtml).not.toContain('<script>');
    expect(result.diffHtml).toContain('&lt;script&gt;');
  });
});

describe('generateInlineDiff', () => {
  it('generates inline word diff', () => {
    const result = generateInlineDiff('hello world', 'hello claude');
    expect(result).toContain('<del');
    expect(result).toContain('<ins');
  });
});

describe('generateTextDiff for new pages', () => {
  it('generates added diff when old text is empty', () => {
    const result = generateTextDiff('', 'New content for the page');
    expect(result.hasChanges).toBe(true);
    expect(result.diffHtml).toContain('diff-added');
    expect(result.diffHtml).toContain('New content for the page');
    expect(result.addedLines).toBeGreaterThan(0);
    expect(result.removedLines).toBe(0);
  });

  it('generates full content as added for multi-line new content', () => {
    const content = '## What\'s Changed\n\n* Fix: resolved crash\n* Feat: new theme support';
    const result = generateTextDiff('', content);
    expect(result.hasChanges).toBe(true);
    expect(result.diffHtml).toContain('diff-added');
    expect(result.addedLines).toBeGreaterThan(0);
    expect(result.removedLines).toBe(0);
  });

  it('marks all lines as added when old text is empty string', () => {
    const newContent = 'Line 1\nLine 2\nLine 3\n';
    const result = generateTextDiff('', newContent);
    expect(result.hasChanges).toBe(true);
    expect(result.diffHtml).not.toContain('diff-removed');
    expect(result.addedLines).toBe(3);
  });

  it('escapes HTML in new page content', () => {
    const result = generateTextDiff('', '<script>alert("xss")</script>');
    expect(result.hasChanges).toBe(true);
    expect(result.diffHtml).toContain('diff-added');
    expect(result.diffHtml).not.toContain('<script>');
    expect(result.diffHtml).toContain('&lt;script&gt;');
  });
});

describe('generateSidebarDiff', () => {
  it('returns no changes for identical trees', () => {
    const tree = [{ title: 'Home', url: '/home' }];
    const result = generateSidebarDiff(tree, tree);
    expect(result.hasChanges).toBe(false);
  });

  it('detects added items', () => {
    const oldTree = [{ title: 'Home', url: '/home' }];
    const newTree = [
      { title: 'Home', url: '/home' },
      { title: 'New Page', url: '/new' },
    ];
    const result = generateSidebarDiff(oldTree, newTree);
    expect(result.hasChanges).toBe(true);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].title).toBe('New Page');
  });

  it('detects removed items', () => {
    const oldTree = [
      { title: 'Home', url: '/home' },
      { title: 'Old Page', url: '/old' },
    ];
    const newTree = [{ title: 'Home', url: '/home' }];
    const result = generateSidebarDiff(oldTree, newTree);
    expect(result.hasChanges).toBe(true);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].title).toBe('Old Page');
  });

  it('handles null trees', () => {
    expect(generateSidebarDiff(null, null).hasChanges).toBe(false);
    expect(generateSidebarDiff(null, [{ title: 'A', url: '/a' }]).hasChanges).toBe(true);
    expect(generateSidebarDiff([{ title: 'A', url: '/a' }], null).hasChanges).toBe(true);
  });
});
