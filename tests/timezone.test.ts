import { toLocalDateString, getTodayString } from '@/lib/timezone';

describe('toLocalDateString', () => {
  it('converts UTC late night to next day in KST', () => {
    // Feb 26 22:34 UTC = Feb 27 07:34 KST
    expect(toLocalDateString('2026-02-26T22:34:00Z')).toBe('2026-02-27');
  });

  it('keeps same day when UTC time is early enough', () => {
    // Feb 27 01:56 UTC = Feb 27 10:56 KST
    expect(toLocalDateString('2026-02-27T01:56:00Z')).toBe('2026-02-27');
  });

  it('keeps same day for UTC daytime', () => {
    // Feb 26 00:59 UTC = Feb 26 09:59 KST
    expect(toLocalDateString('2026-02-26T00:59:00Z')).toBe('2026-02-26');
  });

  it('handles UTC afternoon crossing midnight KST', () => {
    // Feb 24 15:00 UTC = Feb 25 00:00 KST
    expect(toLocalDateString('2026-02-24T15:00:00Z')).toBe('2026-02-25');
  });

  it('accepts Date object', () => {
    const date = new Date('2026-02-26T22:34:00Z');
    expect(toLocalDateString(date)).toBe('2026-02-27');
  });

  it('returns YYYY-MM-DD format', () => {
    const result = toLocalDateString('2026-01-01T00:00:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTodayString', () => {
  it('returns a valid date string', () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
