# claude-docs-tracker

> Daily diff tracker for Claude official documentation (platform.claude.com/docs & code.claude.com/docs)

Automatically detects and visualizes changes in Claude's official documentation every day. Unlike release notes that only cover major features, this tool tracks **every change** — new pages, content edits, sidebar restructuring, and more.

## Why?

Claude's documentation changes frequently, but many updates go unannounced:
- New integration guides appear without fanfare
- API examples get updated silently
- Sidebar navigation restructures overnight

**claude-docs-tracker** catches it all and presents it in a developer-friendly diff view.

## Features

- **Daily Diff Dashboard** — See what changed today at a glance
- **Page-level Diffs** — Git-style diff view for every documentation page
- **Sidebar Structure Tracking** — Detect new/removed/moved menu items
- **AI Summaries** — Bilingual (EN/KR) summaries via Claude Haiku
- **RSS & JSON Feeds** — Subscribe to documentation changes
- **Webhook Alerts** — Discord & Slack notifications
- **Public API** — Query changes programmatically
- **Dark Mode** — System-aware dark/light theme

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Diff Engine | jsdiff |
| AI Summaries | Claude Haiku 4.5 |
| Deploy | Vercel |
| Scheduler | Vercel Cron |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- [Supabase](https://supabase.com) project
- [Anthropic API key](https://console.anthropic.com)

### Setup

1. Clone and install:

```bash
git clone https://github.com/cgmsw/claude-docs-tracker.git
cd claude-docs-tracker
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
# Fill in your credentials (see Environment Variables below)
```

3. Set up database:

Run the migration SQL in your Supabase SQL Editor:
```
supabase/migrations/001_initial_schema.sql
```

4. (Optional) Seed demo data:

```bash
npx tsx scripts/seed-demo-data.ts
```

5. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running the Crawler

Manual crawl (requires `CRON_SECRET`):

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Dry run (list URLs without crawling):

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/changes?date=YYYY-MM-DD` | Changes for a specific date |
| GET | `/api/changes/latest` | Latest 50 changes |
| GET | `/api/changes/page/:pageId` | Change history for a page |
| GET | `/api/sidebar-diff?from=...&to=...` | Sidebar structure changes |
| GET | `/api/feed/rss` | RSS 2.0 feed |
| GET | `/api/feed/json` | JSON Feed 1.1 |
| POST | `/api/crawl` | Trigger manual crawl (auth required) |

## Project Structure

```
claude-docs-tracker/
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   ├── components/       # UI components (DiffView, ChangeCard, etc.)
│   ├── crawler/          # Crawling engine (sitemap, page, diff, pipeline)
│   ├── db/               # Supabase client, types, queries
│   └── lib/              # AI summary, notifications
├── supabase/migrations/  # Database schema
├── scripts/              # Seed data, utilities
└── tests/                # Unit & integration tests
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `CLAUDE_API_KEY` | Yes | Anthropic API key for AI summaries |
| `CRON_SECRET` | Yes | Auth token for cron/crawl endpoints |
| `NEXT_PUBLIC_SITE_URL` | No | Public URL (defaults to Vercel URL) |
| `WEBHOOK_DISCORD_URL` | No | Discord webhook for notifications |
| `WEBHOOK_SLACK_URL` | No | Slack webhook for notifications |

## Deploying to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy — cron job runs automatically at UTC 00:00 (KST 09:00)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
4. Submit a pull request

## License

[MIT](LICENSE)
