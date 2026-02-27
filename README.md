# Claude Docs Tracker

> Track every change across Claude's documentation — including the ones they don't announce.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://claude-docs-tracker.vercel.app)

**[Live Demo](https://claude-docs-tracker.vercel.app)**

## What makes this different?

Services like Releasebot track **official announcements** — the changes vendors *want* you to see.

We track **actual changes** — including the ones that never appear in any changelog.

|  | Releasebot | Claude Docs Tracker |
|---|---|---|
| Official release notes | Yes | Yes |
| Silent documentation changes | No | Yes |
| Line-by-line diffs | No | Yes |
| Breaking change detection | No | Yes |
| Sidebar structure changes | No | Yes |
| Free & open source | No ($59/mo) | Yes (MIT) |

## Features

- **Silent Change Detection** — Flag documentation changes that don't appear in any release notes
- **Breaking Change Alerts** — Auto-detect deprecated APIs, removed features, and migration requirements
- **Line-by-Line Diffs** — See exactly what changed, word by word
- **AI-Powered Summaries** — Claude Haiku generates concise summaries for every change
- **Calendar View** — Browse changes by date with category-colored dots
- **Full-Text Search** — Find changes by keyword across all tracked pages
- **RSS & JSON Feeds** — Subscribe in your favorite reader
- **Discord & Slack Webhooks** — Get notified instantly when breaking changes are detected
- **Dark Mode** — System-aware dark/light theme with a warm color palette

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Diff Engine | jsdiff |
| AI Summaries | Claude Haiku 4.5 |
| Deployment | Vercel |
| Scheduler | Vercel Cron |
| Tests | Jest + ts-jest |

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)

### Setup

1. Clone and install:

```bash
git clone https://github.com/thingineeer/claude-docs-tracker.git
cd claude-docs-tracker
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLAUDE_API_KEY=
CRON_SECRET=
WEBHOOK_DISCORD_URL=       # optional
WEBHOOK_SLACK_URL=         # optional
NEXT_PUBLIC_SITE_URL=      # optional, defaults to Vercel URL
```

3. Set up the database:

Run the migration files in your Supabase SQL Editor in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/003_add_category.sql
supabase/migrations/004_update_categories.sql
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Usage

### Get changes for a specific date

```bash
curl https://claude-docs-tracker.vercel.app/api/changes?date=2026-02-26
```

### Get the latest changes

```bash
curl https://claude-docs-tracker.vercel.app/api/changes/latest
```

### Search changes by keyword

```bash
curl https://claude-docs-tracker.vercel.app/api/changes?q=deprecated
```

### Subscribe via feeds

- **RSS**: `https://claude-docs-tracker.vercel.app/api/feed/rss`
- **JSON Feed**: `https://claude-docs-tracker.vercel.app/api/feed/json`

### Trigger a manual crawl (requires authentication)

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Project Structure

```
claude-docs-tracker/
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   │   ├── api/          # REST endpoints (calendar, changes, crawl, cron, feed)
│   │   ├── calendar/     # Calendar view page
│   │   ├── changes/      # Daily change detail page ([date] dynamic)
│   │   ├── search/       # Full-text search page
│   │   └── page.tsx      # Home (stats + activity dot strip + recent changes)
│   ├── components/       # Shared UI components
│   ├── crawler/          # Crawling engine (sitemap, page, diff, pipeline)
│   ├── db/               # Supabase client, types, queries
│   └── lib/              # Utilities (categories, icons, formatters)
├── scripts/              # Crawling & migration scripts
├── supabase/migrations/  # Database schema migrations
├── tests/                # Unit tests (Jest)
└── public/               # Static assets
```

## Categories

Changes are automatically classified into four categories:

| Category | Scope | Color |
|----------|-------|-------|
| Platform Docs | API guides, getting started, build with Claude | Purple |
| Claude Code | code.claude.com — overview, quickstart, IDE integrations | Blue |
| Agents & MCP | Agent SDK, tools, MCP connector | Green |
| Release Notes | Official release notes and changelogs | Amber |

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

See [CLAUDE.md](CLAUDE.md) for detailed code style and commit conventions.

## License

[MIT](LICENSE)
