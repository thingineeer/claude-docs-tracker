interface SidebarNode {
  title: string;
  url?: string;
}

interface SidebarTreeDiffProps {
  added: SidebarNode[];
  removed: SidebarNode[];
}

export function SidebarTreeDiff({ added, removed }: SidebarTreeDiffProps) {
  if (added.length === 0 && removed.length === 0) {
    return <p className="text-sm text-muted">No sidebar changes detected.</p>;
  }

  return (
    <div className="space-y-3">
      {added.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-1 text-green-600 dark:text-green-400">
            + Added ({added.length})
          </h4>
          <ul className="space-y-1">
            {added.map((node, i) => (
              <li key={i} className="text-sm pl-4 border-l-2 border-green-500 py-0.5">
                {node.url ? (
                  <a href={node.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                    {node.title}
                  </a>
                ) : (
                  node.title
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {removed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-1 text-red-600 dark:text-red-400">
            - Removed ({removed.length})
          </h4>
          <ul className="space-y-1">
            {removed.map((node, i) => (
              <li key={i} className="text-sm pl-4 border-l-2 border-red-500 py-0.5 line-through opacity-70">
                {node.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
