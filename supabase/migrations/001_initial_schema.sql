-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Pages table
create table pages (
  id uuid primary key default uuid_generate_v4(),
  url text unique not null,
  domain text not null,
  section text,
  title text not null,
  last_crawled_at timestamptz,
  created_at timestamptz default now()
);

-- Snapshots table
create table snapshots (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid references pages(id) on delete cascade not null,
  content_hash text not null,
  content_text text not null,
  sidebar_tree jsonb,
  crawled_at timestamptz not null,
  created_at timestamptz default now()
);

-- Changes table
create table changes (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid references pages(id) on delete cascade not null,
  snapshot_before_id uuid references snapshots(id),
  snapshot_after_id uuid references snapshots(id) not null,
  change_type text not null check (change_type in ('added', 'modified', 'removed', 'sidebar_changed')),
  diff_html text,
  diff_summary text,
  detected_at date not null,
  created_at timestamptz default now()
);

-- Daily reports table
create table daily_reports (
  id uuid primary key default uuid_generate_v4(),
  report_date date unique not null,
  total_changes integer default 0,
  new_pages integer default 0,
  modified_pages integer default 0,
  removed_pages integer default 0,
  ai_summary text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_snapshots_page_id on snapshots(page_id);
create index idx_snapshots_crawled_at on snapshots(crawled_at desc);
create index idx_changes_page_id on changes(page_id);
create index idx_changes_detected_at on changes(detected_at desc);
create index idx_changes_change_type on changes(change_type);
create index idx_daily_reports_date on daily_reports(report_date desc);
create index idx_pages_domain on pages(domain);
