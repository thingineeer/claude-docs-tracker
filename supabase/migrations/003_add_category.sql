ALTER TABLE pages ADD COLUMN category TEXT;
CREATE INDEX idx_pages_category ON pages(category);

-- Update existing pages based on domain + section mapping
-- Must match src/lib/categories.ts getCategoryForPage() logic
UPDATE pages SET category = CASE
  -- code.claude.com: default to 'claude-code' with overrides
  WHEN domain = 'code.claude.com' AND section IN ('overview', 'quickstart') THEN 'getting-started'
  WHEN domain = 'code.claude.com' AND section = 'mcp' THEN 'agent-tools'
  WHEN domain = 'code.claude.com' AND section = 'changelog' THEN 'release-notes'
  WHEN domain = 'code.claude.com' THEN 'claude-code'
  -- platform.claude.com section mappings
  WHEN section = 'release-notes' THEN 'release-notes'
  WHEN section = 'agent-sdk' THEN 'agent-tools'
  WHEN section IN ('intro', 'get-started') THEN 'getting-started'
  WHEN section IN ('api', 'administration') THEN 'api-reference'
  WHEN section IN ('build-with-claude', 'about-claude', 'prompt-engineering', 'resources') THEN 'guides'
  WHEN section IS NULL THEN 'getting-started'
  ELSE 'guides'
END;
