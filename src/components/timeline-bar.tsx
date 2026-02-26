interface TimelineBarProps {
  data: { date: string; count: number }[];
}

export function TimelineBar({ data }: TimelineBarProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item) => (
        <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-accent/80 hover:bg-accent rounded-t transition-colors cursor-pointer"
            style={{
              height: `${Math.max((item.count / maxCount) * 100, 4)}%`,
              minHeight: item.count > 0 ? '4px' : '2px',
            }}
            title={`${item.date}: ${item.count} changes`}
          />
          <span className="text-[10px] text-muted truncate w-full text-center">
            {item.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}
