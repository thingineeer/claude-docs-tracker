interface DiffViewProps {
  diffHtml: string;
  maxHeight?: string;
}

export function DiffView({ diffHtml, maxHeight = '400px' }: DiffViewProps) {
  return (
    <div
      className="overflow-auto rounded-lg border border-border bg-surface font-mono text-sm"
      style={{ maxHeight }}
    >
      <div
        className="p-4 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    </div>
  );
}
