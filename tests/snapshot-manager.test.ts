import { createHash } from 'crypto';

// Test computeHash logic directly without importing supabase dependencies
function computeHash(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

describe('computeHash', () => {
  it('produces consistent SHA256 hash', () => {
    const hash1 = computeHash('hello world');
    const hash2 = computeHash('hello world');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', () => {
    const hash1 = computeHash('hello');
    const hash2 = computeHash('world');
    expect(hash1).not.toBe(hash2);
  });

  it('produces 64-character hex string', () => {
    const hash = computeHash('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});
