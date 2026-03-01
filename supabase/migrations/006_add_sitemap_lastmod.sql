-- Add sitemap_lastmod to track changes via sitemap for CSR pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS sitemap_lastmod text;
