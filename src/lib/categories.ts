export type CategoryType =
  | 'api-reference'
  | 'claude-code'
  | 'guides'
  | 'release-notes'
  | 'support'
  | 'other';

export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const CATEGORY_CONFIG: Record<CategoryType, CategoryConfig> = {
  'api-reference': {
    label: 'API Reference',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
  'claude-code': {
    label: 'Claude Code',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
  },
  guides: {
    label: 'Guides',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
  },
  'release-notes': {
    label: 'Release Notes',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
  },
  support: {
    label: 'Support',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-900/40',
  },
  other: {
    label: 'Other',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/40',
  },
};

export const ALL_CATEGORIES: CategoryType[] = Object.keys(CATEGORY_CONFIG) as CategoryType[];

export function getCategoryForPage(page: {
  domain: string;
  section: string | null;
  url?: string;
}): CategoryType {
  const { domain, section, url } = page;
  const lowerUrl = url?.toLowerCase() ?? '';
  const lowerSection = section?.toLowerCase() ?? '';

  if (domain === 'code.claude.com') {
    return 'claude-code';
  }

  if (domain === 'support.claude.com') {
    if (lowerUrl.includes('release') || lowerSection.includes('release')) {
      return 'release-notes';
    }
    return 'support';
  }

  if (domain === 'platform.claude.com') {
    if (lowerUrl.includes('release-notes') || lowerSection.includes('release')) {
      return 'release-notes';
    }
    if (
      lowerUrl.includes('/api/') ||
      lowerUrl.includes('api-reference') ||
      lowerSection.includes('api')
    ) {
      return 'api-reference';
    }
    if (lowerUrl.includes('guide') || lowerSection.includes('guide')) {
      return 'guides';
    }
  }

  if (lowerUrl.includes('api') || lowerSection.includes('api')) {
    return 'api-reference';
  }

  if (lowerUrl.includes('guide') || lowerSection.includes('guide')) {
    return 'guides';
  }

  return 'other';
}
