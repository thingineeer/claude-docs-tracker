const BREAKING_KEYWORDS = [
  'deprecated', 'removed', 'breaking', 'no longer supported',
  'will be removed', 'end of life', 'sunset', 'discontinued',
  'migration required', 'incompatible', 'retired', 'replaced by',
];

export function detectBreakingChange(diffText: string): {
  isBreaking: boolean;
  matchedKeywords: string[];
} {
  // Only check ADDED lines (lines starting with + in diff)
  const addedLines = diffText.split('\n')
    .filter(line => line.startsWith('+') || line.startsWith('>'))
    .join(' ')
    .toLowerCase();

  const matched = BREAKING_KEYWORDS.filter(kw => addedLines.includes(kw.toLowerCase()));
  return { isBreaking: matched.length > 0, matchedKeywords: matched };
}
