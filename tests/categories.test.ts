import {
  getCategoryForPage,
  getCategoryConfig,
  CATEGORIES,
  CATEGORY_ORDER,
  type CategoryType,
} from '@/lib/categories';
import { formatChangeSummary, getChangeTypeIcon, getChangeTypeLabel } from '@/lib/format-change-summary';
import { getCategoryFromPage } from '@/db/queries';

describe('categories', () => {
  describe('getCategoryForPage', () => {
    it('classifies code.claude.com pages as claude-code by default', () => {
      expect(getCategoryForPage('code.claude.com', 'hooks')).toBe('claude-code');
      expect(getCategoryForPage('code.claude.com', 'plugins')).toBe('claude-code');
      expect(getCategoryForPage('code.claude.com', 'settings')).toBe('claude-code');
      expect(getCategoryForPage('code.claude.com', 'security')).toBe('claude-code');
    });

    it('overrides code.claude.com for special sections', () => {
      expect(getCategoryForPage('code.claude.com', 'overview')).toBe('getting-started');
      expect(getCategoryForPage('code.claude.com', 'quickstart')).toBe('getting-started');
      expect(getCategoryForPage('code.claude.com', 'mcp')).toBe('agent-tools');
      expect(getCategoryForPage('code.claude.com', 'changelog')).toBe('release-notes');
    });

    it('classifies platform.claude.com sections correctly', () => {
      expect(getCategoryForPage('platform.claude.com', 'api')).toBe('api-reference');
      expect(getCategoryForPage('platform.claude.com', 'administration')).toBe('api-reference');
      expect(getCategoryForPage('platform.claude.com', 'build-with-claude')).toBe('guides');
      expect(getCategoryForPage('platform.claude.com', 'about-claude')).toBe('guides');
      expect(getCategoryForPage('platform.claude.com', 'prompt-engineering')).toBe('guides');
      expect(getCategoryForPage('platform.claude.com', 'agent-sdk')).toBe('agent-tools');
      expect(getCategoryForPage('platform.claude.com', 'agents-and-tools')).toBe('agent-tools');
      expect(getCategoryForPage('platform.claude.com', 'test-and-evaluate')).toBe('guides');
      expect(getCategoryForPage('platform.claude.com', 'release-notes')).toBe('release-notes');
      expect(getCategoryForPage('platform.claude.com', 'intro')).toBe('getting-started');
      expect(getCategoryForPage('platform.claude.com', 'get-started')).toBe('getting-started');
      expect(getCategoryForPage('platform.claude.com', 'home')).toBe('getting-started');
    });

    it('handles null section', () => {
      expect(getCategoryForPage('platform.claude.com', null)).toBe('getting-started');
      expect(getCategoryForPage('code.claude.com', null)).toBe('claude-code');
    });

    it('handles unknown sections as guides fallback', () => {
      expect(getCategoryForPage('platform.claude.com', 'unknown-section')).toBe('guides');
    });

    it('handles unknown domains', () => {
      expect(getCategoryForPage('support.claude.com', 'some-section')).toBe('guides');
      expect(getCategoryForPage('support.claude.com', null)).toBe('getting-started');
    });
  });

  describe('getCategoryFromPage (DB query version)', () => {
    it('matches getCategoryForPage for common cases', () => {
      const testCases: [string, string | null][] = [
        ['code.claude.com', 'hooks'],
        ['code.claude.com', 'overview'],
        ['code.claude.com', 'mcp'],
        ['code.claude.com', 'changelog'],
        ['platform.claude.com', 'api'],
        ['platform.claude.com', 'agent-sdk'],
        ['platform.claude.com', 'release-notes'],
        ['platform.claude.com', 'intro'],
        ['platform.claude.com', 'build-with-claude'],
        ['platform.claude.com', 'agents-and-tools'],
        ['platform.claude.com', 'test-and-evaluate'],
        ['platform.claude.com', 'home'],
        ['platform.claude.com', null],
      ];

      for (const [domain, section] of testCases) {
        expect(getCategoryFromPage(domain, section)).toBe(
          getCategoryForPage(domain, section),
        );
      }
    });
  });

  describe('CATEGORIES constant', () => {
    it('has exactly 6 categories', () => {
      expect(Object.keys(CATEGORIES)).toHaveLength(6);
    });

    it('every category has required fields', () => {
      for (const config of Object.values(CATEGORIES)) {
        expect(config.name).toBeTruthy();
        expect(config.emoji).toBeTruthy();
        expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(config.dotColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(config.description).toBeTruthy();
      }
    });

    it('has unique colors', () => {
      const colors = Object.values(CATEGORIES).map((c) => c.color);
      expect(new Set(colors).size).toBe(colors.length);
    });
  });

  describe('CATEGORY_ORDER', () => {
    it('includes all category types', () => {
      const keys = Object.keys(CATEGORIES) as CategoryType[];
      expect([...CATEGORY_ORDER].sort()).toEqual([...keys].sort());
    });
  });

  describe('getCategoryConfig', () => {
    it('returns correct config for a page', () => {
      const config = getCategoryConfig('code.claude.com', 'hooks');
      expect(config.name).toBe('Claude Code');
      expect(config.emoji).toBeTruthy();
    });
  });
});

describe('format-change-summary', () => {
  describe('formatChangeSummary', () => {
    it('uses diffSummary when available', () => {
      const result = formatChangeSummary({
        title: 'Vision',
        changeType: 'modified',
        diffSummary: 'Added image input examples',
        categoryEmoji: '📡',
      });
      expect(result).toContain('Vision');
      expect(result).toContain('Added image input examples');
    });

    it('generates fallback for added pages', () => {
      const result = formatChangeSummary({
        title: 'Token Counting',
        changeType: 'added',
        diffSummary: null,
        categoryEmoji: '📡',
      });
      expect(result).toContain('Token Counting');
      expect(result).toContain('새 페이지 추가됨');
    });

    it('truncates long summaries', () => {
      const result = formatChangeSummary({
        title: 'Very Long Title',
        changeType: 'modified',
        diffSummary: 'A'.repeat(200),
        categoryEmoji: '📡',
        maxLength: 50,
      });
      expect(result.length).toBeLessThanOrEqual(50);
      expect(result).toContain('...');
    });
  });

  describe('getChangeTypeIcon', () => {
    it('returns correct icons', () => {
      expect(getChangeTypeIcon('added').icon).toBe('+');
      expect(getChangeTypeIcon('modified').icon).toBe('~');
      expect(getChangeTypeIcon('removed').icon).toBe('-');
      expect(getChangeTypeIcon('sidebar_changed').icon).toBe('#');
    });
  });

  describe('getChangeTypeLabel', () => {
    it('returns correct labels', () => {
      expect(getChangeTypeLabel('added')).toBe('New');
      expect(getChangeTypeLabel('modified')).toBe('Modified');
      expect(getChangeTypeLabel('removed')).toBe('Removed');
      expect(getChangeTypeLabel('sidebar_changed')).toBe('Sidebar');
    });
  });
});
