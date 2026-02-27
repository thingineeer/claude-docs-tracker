-- Migration: Update category system (agent-tools → agents-mcp, color changes, overview/quickstart reclassification)

-- 1. Rename agent-tools to agents-mcp
UPDATE pages SET category = 'agents-mcp' WHERE category = 'agent-tools';

-- 2. Move overview/quickstart from platform-docs to claude-code
UPDATE pages SET category = 'claude-code'
WHERE domain = 'code.claude.com'
  AND section IN ('overview', 'quickstart')
  AND category = 'platform-docs';

-- 3. Ensure MCP pages are agents-mcp (in case any were claude-code)
UPDATE pages SET category = 'agents-mcp'
WHERE section = 'mcp';
