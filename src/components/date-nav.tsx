'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface DateNavProps {
  currentDate: string;
  prevDate: string;
  nextDate: string;
  isToday: boolean;
}

export function DateNav({ currentDate, prevDate, nextDate, isToday }: DateNavProps) {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');

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
          &larr; {prevDate}
        </button>
        <h1 className="text-2xl font-bold">{currentDate}</h1>
        {!isToday ? (
          <button
            onClick={() => router.push(`/changes/${nextDate}`)}
            className="text-sm text-accent hover:underline"
          >
            {nextDate} &rarr;
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
