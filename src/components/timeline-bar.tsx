'use client';

import { useRouter } from 'next/navigation';

interface TimelineBarProps {
  data: { date: string; count: number }[];
}

const Y_AXIS_CAP = 20;

function getBarHeight(count: number, cap: number): number {
  if (count === 0) return 0;
  // Linear scale up to cap, then clamp at 100%
  const pct = Math.min(count / cap, 1) * 100;
  return Math.max(pct, 6); // minimum 6% for any non-zero value
}

export function TimelineBar({ data }: TimelineBarProps) {
  const router = useRouter();
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  // Use the higher of Y_AXIS_CAP or actual max to avoid wasted space when all values are small
  const effectiveCap = Math.max(Y_AXIS_CAP, Math.min(maxCount, Y_AXIS_CAP));

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item) => {
        const isOverCap = item.count > Y_AXIS_CAP;

        return (
          <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-xs font-medium ${isOverCap ? 'text-accent font-bold' : 'text-muted'}`}>
              {item.count > 0 ? item.count : '--'}
            </span>
            <div
              className={`w-full rounded-t transition-colors cursor-pointer ${
                isOverCap
                  ? 'bg-accent hover:bg-accent/90'
                  : 'bg-accent/80 hover:bg-accent'
              }`}
              style={{
                height: `${getBarHeight(item.count, Y_AXIS_CAP)}%`,
                minHeight: item.count > 0 ? '4px' : '2px',
              }}
              title={`${item.date}: ${item.count} changes`}
              onClick={() => router.push(`/changes/${item.date}`)}
            />
            <span className="text-[10px] text-muted truncate w-full text-center">
              {item.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
