/**
 * Category classification system for calendar view.
 *
 * Maps each documentation page to one of 4 categories based on
 * its domain and section. Used for color-coded calendar dots,
 * filtering, and visual grouping across the UI.
 */

export type CategoryType =
  | 'platform-docs'
  | 'agents-mcp'
  | 'claude-code'
  | 'release-notes';

export interface CategoryConfig {
  /** Display name shown in UI */
  name: string;
  /** Icon key for SVG icon lookup */
  icon: string;
  /** Primary color hex (for badges, labels) */
  color: string;
  /** Dot color hex (for calendar view, slightly muted) */
  dotColor: string;
  /** Short description of what this category covers */
  description: string;
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  'platform-docs': {
    name: 'Platform Docs',
    icon: 'platform-docs',
    color: '#8B5CF6',
    dotColor: '#A78BFA',
    description: 'API reference, guides, getting started, and platform documentation',
  },
  'agents-mcp': {
    name: 'Agents & MCP',
    icon: 'agents-mcp',
    color: '#10B981',
    dotColor: '#34D399',
    description: 'Agent SDK, agents and tools, MCP protocol and integrations',
  },
  'claude-code': {
    name: 'Claude Code Docs',
    icon: 'claude-code',
    color: '#3B82F6',
    dotColor: '#60A5FA',
    description: 'CLI usage guides, IDE plugins, hooks, and configuration',
  },
  'release-notes': {
    name: 'Changelogs',
    icon: 'release-notes',
    color: '#F59E0B',
    dotColor: '#FBBF24',
    description: 'Version updates and release announcements (Claude Code, Platform)',
  },
} as const;

/**
 * Section-to-category mapping for platform.claude.com.
 *
 * Each key is the section slug extracted from
 * `platform.claude.com/docs/en/{section}/...`
 */
const PLATFORM_SECTION_MAP: Record<string, CategoryType> = {
  // Getting Started -> Platform Docs
  'intro': 'platform-docs',
  'get-started': 'platform-docs',

  // About Claude (models, pricing, etc.) -> Platform Docs
  'about-claude': 'platform-docs',

  // Build with Claude -> Platform Docs
  'build-with-claude': 'platform-docs',

  // Prompt Engineering -> Platform Docs
  'prompt-engineering': 'platform-docs',

  // API Reference -> Platform Docs
  'api': 'platform-docs',

  // Agent SDK & Tools -> Agents & MCP
  'agent-sdk': 'agents-mcp',
  'agents-and-tools': 'agents-mcp',

  // Administration -> Platform Docs (platform management)
  'administration': 'platform-docs',

  // Test & Evaluate -> Platform Docs
  'test-and-evaluate': 'platform-docs',

  // Release Notes
  'release-notes': 'release-notes',

  // Resources -> Platform Docs
  'resources': 'platform-docs',

  // Home (Documentation main page)
  'home': 'platform-docs',
};

/**
 * Section-to-category mapping for code.claude.com.
 *
 * code.claude.com URLs are `/docs/en/{slug}`, where the slug
 * itself becomes the section value.
 */
const CODE_SECTION_MAP: Record<string, CategoryType> = {
  // MCP-related -> Agents & MCP
  'mcp': 'agents-mcp',

  // Release notes
  'changelog': 'release-notes',
};

/**
 * Determine the category for a documentation page based on its
 * domain and section.
 *
 * @param domain - The hostname (e.g., "platform.claude.com", "code.claude.com")
 * @param section - The section slug extracted from the URL path, or null
 * @returns The matching CategoryType
 *
 * @example
 * ```ts
 * getCategoryForPage('platform.claude.com', 'api')           // 'platform-docs'
 * getCategoryForPage('code.claude.com', 'hooks')             // 'claude-code'
 * getCategoryForPage('platform.claude.com', 'agent-sdk')     // 'agents-mcp'
 * getCategoryForPage('platform.claude.com', 'release-notes') // 'release-notes'
 * getCategoryForPage('platform.claude.com', null)            // 'platform-docs'
 * ```
 */
export function getCategoryForPage(
  domain: string,
  section: string | null,
): CategoryType {
  // github.com: always release-notes
  if (domain === 'github.com') {
    return 'release-notes';
  }

  // code.claude.com: default to 'claude-code' unless overridden
  if (domain === 'code.claude.com') {
    if (section && section in CODE_SECTION_MAP) {
      return CODE_SECTION_MAP[section];
    }
    return 'claude-code';
  }

  // platform.claude.com (and any other domain): use section map
  if (section && section in PLATFORM_SECTION_MAP) {
    return PLATFORM_SECTION_MAP[section];
  }

  // Fallback: no section or unknown section on platform
  return 'platform-docs';
}

/**
 * Get the CategoryConfig for a given page.
 * Convenience wrapper combining lookup + config retrieval.
 */
export function getCategoryConfig(
  domain: string,
  section: string | null,
): CategoryConfig {
  const type = getCategoryForPage(domain, section);
  return CATEGORIES[type];
}

/** List all category types in display order. */
export const CATEGORY_ORDER: CategoryType[] = [
  'platform-docs',
  'agents-mcp',
  'claude-code',
  'release-notes',
];
