/**
 * Category classification system for calendar view.
 *
 * Maps each documentation page to one of 6 categories based on
 * its domain and section. Used for color-coded calendar dots,
 * filtering, and visual grouping across the UI.
 */

export type CategoryType =
  | 'api-reference'
  | 'claude-code'
  | 'guides'
  | 'agent-tools'
  | 'getting-started'
  | 'release-notes';

export interface CategoryConfig {
  /** Display name shown in UI */
  name: string;
  /** Emoji icon for visual identification */
  emoji: string;
  /** Primary color hex (for badges, labels) */
  color: string;
  /** Dot color hex (for calendar view, slightly muted) */
  dotColor: string;
  /** Short description of what this category covers */
  description: string;
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  'api-reference': {
    name: 'API Reference',
    emoji: '\u{1F4E1}',
    color: '#3B82F6',
    dotColor: '#60A5FA',
    description: 'API endpoints, SDKs, authentication, and developer platform docs',
  },
  'claude-code': {
    name: 'Claude Code',
    emoji: '\u{1F4BB}',
    color: '#8B5CF6',
    dotColor: '#A78BFA',
    description: 'CLI tool, IDE plugins, hooks, and CI/CD integration',
  },
  'guides': {
    name: 'Guides & Features',
    emoji: '\u{1F4D6}',
    color: '#D97757',
    dotColor: '#E5956F',
    description: 'Building with Claude, prompt engineering, and feature guides',
  },
  'agent-tools': {
    name: 'Agents & Tools',
    emoji: '\u{1F916}',
    color: '#10B981',
    dotColor: '#34D399',
    description: 'Agent SDK, MCP, tool use, and agent capabilities',
  },
  'getting-started': {
    name: 'Getting Started',
    emoji: '\u{1F680}',
    color: '#F59E0B',
    dotColor: '#FBBF24',
    description: 'Introduction, quickstart, setup, and overview pages',
  },
  'release-notes': {
    name: 'Release Notes',
    emoji: '\u{1F4CB}',
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
  // Getting Started
  'intro': 'getting-started',
  'get-started': 'getting-started',

  // About Claude (models, pricing, etc.) -> Guides
  'about-claude': 'guides',

  // Build with Claude -> Guides
  'build-with-claude': 'guides',

  // Prompt Engineering -> Guides
  'prompt-engineering': 'guides',

  // API Reference
  'api': 'api-reference',

  // Agent SDK & Tools
  'agent-sdk': 'agent-tools',

  // Administration -> API Reference (platform management)
  'administration': 'api-reference',

  // Release Notes
  'release-notes': 'release-notes',

  // Resources -> Guides
  'resources': 'guides',
};

/**
 * Section-to-category mapping for code.claude.com.
 *
 * code.claude.com URLs are `/docs/en/{slug}`, where the slug
 * itself becomes the section value.
 */
const CODE_SECTION_MAP: Record<string, CategoryType> = {
  // Getting started
  'overview': 'getting-started',
  'quickstart': 'getting-started',

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
 * getCategoryForPage('platform.claude.com', 'api')           // 'api-reference'
 * getCategoryForPage('code.claude.com', 'hooks')             // 'claude-code'
 * getCategoryForPage('platform.claude.com', 'agent-sdk')     // 'agent-tools'
 * getCategoryForPage('platform.claude.com', 'release-notes') // 'release-notes'
 * getCategoryForPage('platform.claude.com', null)            // 'getting-started'
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
  if (!section) {
    return 'getting-started';
  }

  return 'guides';
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
  'getting-started',
  'guides',
  'api-reference',
  'agent-tools',
  'claude-code',
  'release-notes',
];
