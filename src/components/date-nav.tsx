'use client';

import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { getTodayString } from '@/lib/timezone';

interface DateNavProps {
  currentDate: string;
  prevDate: string;
  nextDate: string;
  isToday: boolean;
}

function formatNavDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'EEE, MMM d', { locale: enUS });
  } catch {
    return dateStr;
  }
}

function formatCurrentDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'EEEE, MMMM d, yyyy', { locale: enUS });
  } catch {
    return dateStr;
  }
}

export function DateNav({ currentDate, prevDate, nextDate, isToday }: DateNavProps) {
  const router = useRouter();
  const today = getTodayString();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (selected) {
      router.push(`/changes/${selected}`);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/changes/${prevDate}`)}
          className="text-sm text-accent hover:underline"
        >
          &larr; {formatNavDate(prevDate)}
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{formatCurrentDate(currentDate)}</h1>
        </div>
        {!isToday ? (
          <button
            onClick={() => router.push(`/changes/${nextDate}`)}
            className="text-sm text-accent hover:underline"
          >
            {formatNavDate(nextDate)} &rarr;
          </button>
        ) : (
          <span className="text-sm text-muted">Today</span>
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <input
          type="date"
          value={currentDate}
          max={today}
          onChange={handleDateChange}
          className="text-sm px-3 py-1.5 rounded border border-border bg-background text-foreground cursor-pointer"
        />
        {!isToday && (
          <button
            onClick={() => router.push(`/changes/${today}`)}
            className="text-sm px-3 py-1.5 rounded border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
          >
            Go to Today
          </button>
        )}
      </div>
    </div>
  );
}
