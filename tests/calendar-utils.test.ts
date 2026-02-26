import {
  validateYear,
  validateMonth,
  validateDateString,
  getMonthDateRange,
  isToday,
  aggregateByDateAndCategory,
} from '@/lib/calendar-utils';

describe('calendar-utils', () => {
  describe('validateYear', () => {
    it('returns valid years within range', () => {
      expect(validateYear('2024')).toBe(2024);
      expect(validateYear('2026')).toBe(2026);
      expect(validateYear('2100')).toBe(2100);
    });

    it('returns null for years below 2024', () => {
      expect(validateYear('2023')).toBeNull();
      expect(validateYear('1999')).toBeNull();
      expect(validateYear('0')).toBeNull();
    });

    it('returns null for years above 2100', () => {
      expect(validateYear('2101')).toBeNull();
      expect(validateYear('9999')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateYear(null)).toBeNull();
    });

    it('returns null for NaN input', () => {
      expect(validateYear('abc')).toBeNull();
      expect(validateYear('')).toBeNull();
      expect(validateYear('12.5')).toBeNull();
    });

    it('returns null for negative years', () => {
      expect(validateYear('-1')).toBeNull();
    });
  });

  describe('validateMonth', () => {
    it('returns valid months 1-12', () => {
      expect(validateMonth('1')).toBe(1);
      expect(validateMonth('6')).toBe(6);
      expect(validateMonth('12')).toBe(12);
    });

    it('returns null for month 0', () => {
      expect(validateMonth('0')).toBeNull();
    });

    it('returns null for month 13', () => {
      expect(validateMonth('13')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(validateMonth(null)).toBeNull();
    });

    it('returns null for NaN input', () => {
      expect(validateMonth('abc')).toBeNull();
      expect(validateMonth('')).toBeNull();
    });

    it('returns null for negative months', () => {
      expect(validateMonth('-1')).toBeNull();
    });

    it('returns null for decimal months', () => {
      expect(validateMonth('1.5')).toBeNull();
    });
  });

  describe('validateDateString', () => {
    it('accepts valid YYYY-MM-DD dates', () => {
      expect(validateDateString('2026-01-01')).toBe(true);
      expect(validateDateString('2026-02-28')).toBe(true);
      expect(validateDateString('2026-12-31')).toBe(true);
      expect(validateDateString('2024-06-15')).toBe(true);
    });

    it('rejects invalid format strings', () => {
      expect(validateDateString('2026-1-1')).toBe(false);
      expect(validateDateString('26-01-01')).toBe(false);
      expect(validateDateString('2026/01/01')).toBe(false);
      expect(validateDateString('01-01-2026')).toBe(false);
      expect(validateDateString('not-a-date')).toBe(false);
      expect(validateDateString('')).toBe(false);
    });

    it('rejects dates with correct format but invalid values', () => {
      expect(validateDateString('2026-13-01')).toBe(false);
      expect(validateDateString('2026-00-01')).toBe(false);
      expect(validateDateString('2026-02-30')).toBe(false);
    });
  });

  describe('getMonthDateRange', () => {
    it('returns correct range for regular months', () => {
      expect(getMonthDateRange(2026, 1)).toEqual({
        startDate: '2026-01-01',
        endDate: '2026-02-01',
      });
      expect(getMonthDateRange(2026, 6)).toEqual({
        startDate: '2026-06-01',
        endDate: '2026-07-01',
      });
    });

    it('handles December with year rollover', () => {
      expect(getMonthDateRange(2026, 12)).toEqual({
        startDate: '2026-12-01',
        endDate: '2027-01-01',
      });
    });

    it('zero-pads single digit months', () => {
      const { startDate, endDate } = getMonthDateRange(2026, 3);
      expect(startDate).toBe('2026-03-01');
      expect(endDate).toBe('2026-04-01');
    });

    it('handles double digit months without extra padding', () => {
      const { startDate, endDate } = getMonthDateRange(2026, 11);
      expect(startDate).toBe('2026-11-01');
      expect(endDate).toBe('2026-12-01');
    });

    it('handles boundary year 2024', () => {
      expect(getMonthDateRange(2024, 1)).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-02-01',
      });
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split('T')[0];
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for a far future date', () => {
      expect(isToday('2099-12-31')).toBe(false);
    });
  });

  describe('aggregateByDateAndCategory', () => {
    it('returns empty object for empty array', () => {
      expect(aggregateByDateAndCategory([])).toEqual({});
    });

    it('aggregates a single change', () => {
      const result = aggregateByDateAndCategory([
        { detected_at: '2026-02-01', category: 'api-reference' },
      ]);
      expect(result).toEqual({
        '2026-02-01': {
          total: 1,
          categories: { 'api-reference': 1 },
        },
      });
    });

    it('aggregates multiple changes on the same day', () => {
      const result = aggregateByDateAndCategory([
        { detected_at: '2026-02-01', category: 'api-reference' },
        { detected_at: '2026-02-01', category: 'guides' },
        { detected_at: '2026-02-01', category: 'api-reference' },
      ]);
      expect(result).toEqual({
        '2026-02-01': {
          total: 3,
          categories: { 'api-reference': 2, 'guides': 1 },
        },
      });
    });

    it('aggregates changes across multiple days', () => {
      const result = aggregateByDateAndCategory([
        { detected_at: '2026-02-01', category: 'api-reference' },
        { detected_at: '2026-02-01', category: 'guides' },
        { detected_at: '2026-02-02', category: 'claude-code' },
        { detected_at: '2026-02-03', category: 'release-notes' },
        { detected_at: '2026-02-03', category: 'release-notes' },
      ]);
      expect(result['2026-02-01']).toEqual({
        total: 2,
        categories: { 'api-reference': 1, 'guides': 1 },
      });
      expect(result['2026-02-02']).toEqual({
        total: 1,
        categories: { 'claude-code': 1 },
      });
      expect(result['2026-02-03']).toEqual({
        total: 2,
        categories: { 'release-notes': 2 },
      });
    });

    it('handles all six category types', () => {
      const allCategories = [
        'api-reference',
        'claude-code',
        'guides',
        'agent-tools',
        'getting-started',
        'release-notes',
      ];
      const changes = allCategories.map((category) => ({
        detected_at: '2026-02-15',
        category,
      }));
      const result = aggregateByDateAndCategory(changes);
      expect(result['2026-02-15'].total).toBe(6);
      for (const cat of allCategories) {
        expect(result['2026-02-15'].categories[cat]).toBe(1);
      }
    });
  });
});
