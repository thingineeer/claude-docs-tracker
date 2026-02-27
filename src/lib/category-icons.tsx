import React from 'react';

interface IconProps {
  className?: string;
}

/** Platform Docs - a document/page icon */
export function PlatformDocsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M10 2v4h4" />
      <path d="M5 9h6M5 12h4" />
    </svg>
  );
}

/** Agents & MCP - a robot icon */
export function AgentsMcpIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="5" width="8" height="8" rx="1" />
      <circle cx="6.5" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none" />
      <path d="M6 5V3.5a2 2 0 0 1 4 0V5" />
      <path d="M3 8H2M14 8h-1" />
    </svg>
  );
}

/** Claude Code - a terminal icon */
export function ClaudeCodeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="2" width="14" height="12" rx="2" />
      <path d="M4 7l2.5 2L4 11" />
      <path d="M8 11h4" />
    </svg>
  );
}

/** Release Notes - a megaphone/announcement icon */
export function ReleaseNotesIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 6v4h2l4 4V2L4 6H2z" />
      <path d="M12 5.5a4 4 0 0 1 0 5" />
      <path d="M14 3.5a7 7 0 0 1 0 9" />
    </svg>
  );
}

/** Anthropic News - a newspaper icon */
export function AnthropicNewsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="12" height="12" rx="1" />
      <path d="M5 5h6M5 8h3M5 11h6" />
      <rect x="10" y="8" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Map from category type string to icon component */
export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  'platform-docs': PlatformDocsIcon,
  'agents-mcp': AgentsMcpIcon,
  'claude-code': ClaudeCodeIcon,
  'release-notes': ReleaseNotesIcon,
  'anthropic-news': AnthropicNewsIcon,
};

/** Renders the appropriate SVG icon for a given category */
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  if (!Icon) return null;
  return <Icon className={className ?? 'w-4 h-4'} />;
}
