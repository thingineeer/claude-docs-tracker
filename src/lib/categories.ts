/**
 * Category classification system for calendar view.
 *
 * Maps each documentation page to one of 4 categories based on
 * its domain and section. Used for color-coded calendar dots,
 * filtering, and visual grouping across the UI.
 */

export type CategoryType =
  | 'platform-docs'
  | 'agent-tools'
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
    color: '#3B82F6',
    dotColor: '#60A5FA',
    description: 'API reference, guides, getting started, and platform documentation',
  },
  'agent-tools': {
    name: 'Agents & Tools',
    icon: 'agent-tools',
    color: '#10B981',
    dotColor: '#34D399',
    description: 'Agent SDK, MCP, tool use, and agent capabilities',
  },
  'claude-code': {
    name: 'Claude Code',
    icon: 'claude-code',
    color: '#8B5CF6',
    dotColor: '#A78BFA',
    description: 'CLI tool, IDE plugins, hooks, and CI/CD integration',
  },
  'release-notes': {
    name: 'Release Notes',
    icon: 'release-notes',
    color: '#EC4899',
    dotColor: '#F472B6',
    description: 'Version updates, changelogs, and deprecation notices',
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

  // Agent SDK & Tools
  'agent-sdk': 'agent-tools',
  'agents-and-tools': 'agent-tools',

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
  // Getting started -> Platform Docs
  'overview': 'platform-docs',
  'quickstart': 'platform-docs',

  // MCP-related -> Agent & Tools
  'mcp': 'agent-tools',

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
 * getCategoryForPage('platform.claude.com', 'agent-sdk')     // 'agent-tools'
 * getCategoryForPage('platform.claude.com', 'release-notes') // 'release-notes'
 * getCategoryForPage('platform.claude.com', null)            // 'platform-docs'
 * ```
 */
export function getCategoryForPage(
  domain: string,
  section: string | null,
): CategoryType {
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
  'agent-tools',
  'claude-code',
  'release-notes',
];
