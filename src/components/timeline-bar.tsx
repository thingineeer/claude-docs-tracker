'use client';

import { useRouter } from 'next/navigation';
import { format, isToday, parseISO } from 'date-fns';

interface TimelineBarProps {
  data: { date: string; count: number }[];
}

function getDotSize(count: number): number {
  if (count === 0) return 24;
  if (count === 1) return 32;
  if (count === 2) return 36;
  if (count < 10) return 40;
  return 44;
}

function getDotOpacity(count: number): number {
  if (count === 0) return 0.12;
  if (count === 1) return 0.5;
  if (count === 2) return 0.7;
  return 1;
}

export function TimelineBar({ data }: TimelineBarProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      {data.map((item) => {
        const size = getDotSize(item.count);
        const opacity = getDotOpacity(item.count);
        const today = isToday(parseISO(item.date));
        const dayLabel = format(parseISO(item.date), 'EEE');
        const dateLabel = item.date.slice(5); // MM-DD

        return (
          <button
            key={item.date}
            onClick={() => router.push(`/changes/${item.date}`)}
            className="flex flex-col items-center gap-1.5 group"
            title={`${item.date}: ${item.count} changes`}
          >
            {/* Dot */}
            <div
              className={`
                rounded-full flex items-center justify-center
                transition-all duration-200
                group-hover:scale-110 group-hover:shadow-md
                ${today ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}
              `}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: `color-mix(in srgb, var(--accent) ${opacity * 100}%, transparent)`,
              }}
            >
              {item.count > 0 && (
                <span className={`text-xs font-bold ${opacity >= 0.7 ? 'text-white' : 'text-accent'}`}>
                  {item.count}
                </span>
              )}
            </div>

            {/* Labels */}
            <div className="flex flex-col items-center">
              <span className={`text-[10px] font-medium ${today ? 'text-accent' : 'text-muted'}`}>
                {dayLabel}
              </span>
              <span className="text-[9px] text-muted/60">
                {dateLabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
