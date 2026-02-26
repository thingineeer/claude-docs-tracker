interface DiffViewProps {
  diffHtml: string;
  maxHeight?: string;
}

/**
 * Sanitizes HTML to allow only safe diff-related tags.
 * Whitelist: <div>, <span>, <del>, <ins>, <br>
 * Only allows class attributes (for styling).
 */
function sanitizeDiffHtml(html: string): string {
  // Allow only specific safe tags with optional class attributes
  // Pattern: opening tag, closing tag, and text content
  const tagRegex = /(<\/?(?:div|span|del|ins|br)\s*(?:class="[^"]*")?\s*\/??>)|([^<]+)|(<[^>]+>)/g;
  let sanitized = '';

  let match;
  const regex = new RegExp(tagRegex);
  // Manually reset regex for proper iteration
  const matches = Array.from(html.matchAll(/<\/?(?:div|span|del|ins|br)\s*(?:class="[^"]*")?\s*\/??>|[^<]+|<[^>]+>/g));

  for (const m of matches) {
    const text = m[0];
    // Allow the safe tags with class attributes
    if (/<\/?(?:div|span|del|ins|br)(?:\s+class="[^"]*")?\/?>/.test(text)) {
      sanitized += text;
    }
    // Allow plain text (between tags)
    else if (!/^</.test(text)) {
      sanitized += text;
    }
    // Strip any other tags
  }

  return sanitized;
}

export function DiffView({ diffHtml, maxHeight = '400px' }: DiffViewProps) {
  const sanitized = sanitizeDiffHtml(diffHtml);

  return (
    <div
      className="overflow-auto rounded-lg border border-border bg-surface font-mono text-sm"
      style={{ maxHeight }}
    >
      <div
        className="p-4 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}
