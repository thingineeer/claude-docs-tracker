'use client';

import { useRouter } from 'next/navigation';

interface TimelineBarProps {
  data: { date: string; count: number }[];
}

function getBarHeight(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount <= 1) return 100;
  const scaled = Math.sqrt(count) / Math.sqrt(maxCount);
  return Math.max(scaled * 100, 8);
}

export function TimelineBar({ data }: TimelineBarProps) {
  const router = useRouter();
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item) => (
        <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-muted">
            {item.count > 0 ? item.count : '--'}
          </span>
          <div
            className="w-full bg-accent/80 hover:bg-accent rounded-t transition-colors cursor-pointer"
            style={{
              height: `${getBarHeight(item.count, maxCount)}%`,
              minHeight: item.count > 0 ? '4px' : '2px',
            }}
            title={`${item.date}: ${item.count} changes`}
            onClick={() => router.push(`/changes/${item.date}`)}
          />
          <span className="text-[10px] text-muted truncate w-full text-center">
            {item.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}
