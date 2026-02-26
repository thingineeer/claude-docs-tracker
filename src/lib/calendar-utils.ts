/**
 * Calendar data utilities for validation and aggregation.
 *
 * Used by /api/calendar and /api/calendar/[date] routes
 * to validate query parameters and transform change data
 * into calendar-friendly structures.
 */

/**
 * Validate year parameter.
 * Accepts years from 2024 to 2100 inclusive.
 *
 * @param yearStr - Raw year string from query params
 * @returns Parsed year number or null if invalid
 */
export function validateYear(yearStr: string | null): number | null {
  if (!yearStr) return null;
  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 2024 || year > 2100) return null;
  return year;
}

/**
 * Validate month parameter (1-12).
 *
 * @param monthStr - Raw month string from query params
 * @returns Parsed month number (1-12) or null if invalid
 */
export function validateMonth(monthStr: string | null): number | null {
  if (!monthStr) return null;
  if (!/^\d+$/.test(monthStr)) return null;
  const month = parseInt(monthStr, 10);
  if (isNaN(month) || month < 1 || month > 12) return null;
  return month;
}

/**
 * Validate date string in YYYY-MM-DD format.
 *
 * @param dateStr - Date string to validate
 * @returns true if the string is a valid YYYY-MM-DD date
 */
export function validateDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (month < 1 || month > 12 || day < 1) return false;
  // Construct a Date and verify it round-trips to the same values
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Get the date range for a given month (start inclusive, end exclusive).
 *
 * Returns ISO date strings suitable for range queries:
 * `WHERE detected_at >= startDate AND detected_at < endDate`
 *
 * @param year - Full year (e.g. 2026)
 * @param month - Month number 1-12
 * @returns Object with startDate and endDate strings in YYYY-MM-DD format
 */
export function getMonthDateRange(
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
  return { startDate, endDate };
}

/**
 * Determine if a date string represents today.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if the date matches today in the local timezone
 */
export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

/**
 * Aggregated data for a single calendar day.
 */
export interface CalendarDayData {
  /** Total number of changes detected on this day */
  total: number;
  /** Breakdown of changes by category */
  categories: Record<string, number>;
}

/**
 * Aggregate an array of changes by date and category.
 *
 * Groups changes into a date-keyed map where each entry
 * contains the total count and per-category breakdown.
 * Used to populate the monthly calendar grid.
 *
 * @param changes - Array of change records with detected_at and category
 * @returns Map of date strings to CalendarDayData
 *
 * @example
 * ```ts
 * const result = aggregateByDateAndCategory([
 *   { detected_at: '2026-02-01', category: 'api-reference' },
 *   { detected_at: '2026-02-01', category: 'guides' },
 *   { detected_at: '2026-02-02', category: 'api-reference' },
 * ]);
 * // {
 * //   '2026-02-01': { total: 2, categories: { 'api-reference': 1, 'guides': 1 } },
 * //   '2026-02-02': { total: 1, categories: { 'api-reference': 1 } },
 * // }
 * ```
 */
export function aggregateByDateAndCategory(
  changes: Array<{
    detected_at: string;
    category: string;
  }>,
): Record<string, CalendarDayData> {
  const result: Record<string, CalendarDayData> = {};

  for (const change of changes) {
    const date = change.detected_at;
    if (!result[date]) {
      result[date] = { total: 0, categories: {} };
    }
    result[date].total++;
    result[date].categories[change.category] =
      (result[date].categories[change.category] || 0) + 1;
  }

  return result;
}
