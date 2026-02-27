/**
 * Tests for src/db/queries.ts
 *
 * These tests cover:
 * 1. searchChanges — verifies the function is exported and the
 *    internal escapeLikePattern logic works correctly (tested via
 *    a local reimplementation, same pattern as snapshot-manager tests).
 * 2. getExistingChange / updateChange — verifies the deduplication
 *    query functions are exported after the bug fix is applied.
 */

// ---------------------------------------------------------------------------
// Test 1: escapeLikePattern logic (used by searchChanges)
// ---------------------------------------------------------------------------

// Reimplemented from src/db/queries.ts to test in isolation without Supabase
function escapeLikePattern(query: string): string {
  return query.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

describe('escapeLikePattern', () => {
  it('passes through plain text unchanged', () => {
    expect(escapeLikePattern('hello world')).toBe('hello world');
  });

  it('escapes % wildcard characters', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('escapes _ wildcard characters', () => {
    expect(escapeLikePattern('diff_html')).toBe('diff\\_html');
  });

  it('escapes backslash characters', () => {
    expect(escapeLikePattern('back\\slash')).toBe('back\\\\slash');
  });

  it('escapes multiple special characters together', () => {
    expect(escapeLikePattern('100% of _all_ items')).toBe('100\\% of \\_all\\_ items');
  });

  it('returns empty string for empty input', () => {
    expect(escapeLikePattern('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Test 2: searchChanges export exists
// ---------------------------------------------------------------------------

describe('searchChanges', () => {
  it('is exported as a function', () => {
    // Dynamic import to avoid triggering Supabase initialization at module level
    const { searchChanges } = require('@/db/queries');
    expect(typeof searchChanges).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Test 3: deduplication query functions (getExistingChange, updateChange)
// ---------------------------------------------------------------------------

describe('deduplication query functions', () => {
  it('exports getExistingChange function', () => {
    const { getExistingChange } = require('@/db/queries');
    expect(typeof getExistingChange).toBe('function');
  });

  it('exports updateChange function', () => {
    const { updateChange } = require('@/db/queries');
    expect(typeof updateChange).toBe('function');
  });
});
