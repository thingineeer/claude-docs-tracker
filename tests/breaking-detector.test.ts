import { detectBreakingChange } from '@/lib/breaking-detector';

describe('detectBreakingChange', () => {
  it('detects "deprecated" in added lines', () => {
    const diff = '+This feature is deprecated\n-Old line removed';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(true);
    expect(result.matchedKeywords).toContain('deprecated');
  });

  it('ignores "deprecated" in removed lines (starting with -)', () => {
    const diff = '-This feature is deprecated\n Some context line';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(false);
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('returns false when no keywords are present', () => {
    const diff = '+Added a new feature\n+Updated documentation\n-Removed old text';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(false);
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('is case insensitive', () => {
    const diff = '+This API is DEPRECATED and will be REMOVED';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(true);
    expect(result.matchedKeywords).toContain('deprecated');
    expect(result.matchedKeywords).toContain('removed');
  });

  it('detects multiple keywords', () => {
    const diff = '+This is deprecated and no longer supported\n+Migration required for v2';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(true);
    expect(result.matchedKeywords).toContain('deprecated');
    expect(result.matchedKeywords).toContain('no longer supported');
    expect(result.matchedKeywords).toContain('migration required');
  });

  it('detects keywords in lines starting with >', () => {
    const diff = '>This endpoint has been sunset';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(true);
    expect(result.matchedKeywords).toContain('sunset');
  });

  it('handles empty diff text', () => {
    const result = detectBreakingChange('');
    expect(result.isBreaking).toBe(false);
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('detects all supported keywords', () => {
    const keywords = [
      'deprecated', 'removed', 'breaking', 'no longer supported',
      'will be removed', 'end of life', 'sunset', 'discontinued',
      'migration required', 'incompatible', 'retired', 'replaced by',
    ];

    for (const kw of keywords) {
      const diff = `+This feature is ${kw}`;
      const result = detectBreakingChange(diff);
      expect(result.isBreaking).toBe(true);
      expect(result.matchedKeywords).toContain(kw);
    }
  });

  it('does not match keywords in context lines (no prefix)', () => {
    const diff = 'This feature is deprecated\nNo prefix here removed';
    const result = detectBreakingChange(diff);
    expect(result.isBreaking).toBe(false);
    expect(result.matchedKeywords).toHaveLength(0);
  });
});
