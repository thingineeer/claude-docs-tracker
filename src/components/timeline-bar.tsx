'use client';

import { useRouter } from 'next/navigation';
import { format, isToday, parseISO } from 'date-fns';

interface TimelineBarProps {
  data: { date: string; count: number }[];
}

function getDotSize(count: number): number {
  if (count === 0) return 28;
  if (count === 1) return 34;
  if (count === 2) return 38;
  if (count < 10) return 42;
  return 48;
}

function getDotOpacity(count: number): number {
  if (count === 0) return 0.2;
  if (count === 1) return 0.5;
  if (count === 2) return 0.7;
  return 1;
}

export function TimelineBar({ data }: TimelineBarProps) {
  const router = useRouter();

  return (
    <>
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--accent); }
          50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent); }
        }
        .dot-today-pulse {
          animation: dot-pulse 2s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center justify-between gap-2 py-2">
        {data.map((item) => {
          const size = getDotSize(item.count);
          const opacity = getDotOpacity(item.count);
          const today = isToday(parseISO(item.date));
          const dayLabel = format(parseISO(item.date), 'EEE');
          const dateLabel = item.date.slice(5); // MM-DD
          const tooltipText = `${item.date}: ${item.count} change${item.count !== 1 ? 's' : ''}`;

          return (
            <button
              key={item.date}
              onClick={() => router.push(`/changes/${item.date}`)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
              title={tooltipText}
            >
              {/* Dot */}
              <div
                className={`
                  rounded-full flex items-center justify-center
                  transition-all duration-200
                  group-hover:scale-[1.15] group-hover:shadow-md
                  ${today ? 'ring-2 ring-accent ring-offset-2 ring-offset-background dot-today-pulse' : ''}
                `}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: item.count === 0
                    ? `color-mix(in srgb, var(--muted) 20%, transparent)`
                    : `color-mix(in srgb, var(--accent) ${opacity * 100}%, transparent)`,
                  minWidth: '12px',
                  minHeight: '12px',
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
    </>
  );
}
