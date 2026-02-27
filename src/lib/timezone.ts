export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Seoul';

export function toLocalDateString(utcDateOrString: Date | string): string {
  const date = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function getTodayString(): string {
  return toLocalDateString(new Date());
}
