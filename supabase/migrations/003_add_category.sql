ALTER TABLE pages ADD COLUMN category TEXT;
CREATE INDEX idx_pages_category ON pages(category);

-- Update existing pages based on domain + section mapping
UPDATE pages SET category = CASE
  WHEN domain = 'code.claude.com' THEN 'claude-code'
  WHEN section IN ('release-notes') THEN 'release-notes'
  WHEN section IN ('agent-sdk') THEN 'agent-sdk'
  WHEN section IN ('intro', 'get-started', 'quickstart') THEN 'getting-started'
  WHEN domain = 'platform.claude.com' THEN 'claude-api'
  ELSE 'general'
END;
