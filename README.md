# claude-docs-tracker

Daily diff tracker for Claude official documentation.

Automatically detects and visualizes changes in [platform.claude.com/docs](https://platform.claude.com/docs) and [code.claude.com/docs](https://code.claude.com/docs).

## Features

- **Daily Diff Dashboard** — See what changed today at a glance
- **Page-level Diffs** — Git-style diff view for every documentation page
- **Sidebar Structure Tracking** — Detect new/removed/moved menu items
- **AI Summaries** — Natural language summaries of changes via Claude Haiku
- **RSS & JSON Feeds** — Developer-friendly notification feeds
- **Webhook Alerts** — Discord & Slack notifications

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Crawler**: Playwright
- **Diff Engine**: jsdiff
- **AI**: Claude Haiku 4.5
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project ([supabase.com](https://supabase.com))

### Setup

1. Clone the repository:

```bash
git clone https://github.com/cgmsw/claude-docs-tracker.git
cd claude-docs-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Fill in your Supabase and Claude API credentials
```

4. Run the database migration:

Apply `supabase/migrations/001_initial_schema.sql` to your Supabase project.

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
claude-docs-tracker/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── changes/      # Daily changes page
│   │   └── page.tsx      # Home
│   ├── components/       # Shared components
│   ├── crawler/          # Crawling engine
│   ├── db/               # DB client & queries
│   └── lib/              # Utilities
├── supabase/
│   └── migrations/       # DB migrations
├── tests/                # Tests
└── public/               # Static files
```

## Environment Variables

See `.env.example` for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `CLAUDE_API_KEY` | Yes | Anthropic API key |
| `CRON_SECRET` | Yes | Secret for cron job authentication |
| `WEBHOOK_DISCORD_URL` | No | Discord webhook URL |
| `WEBHOOK_SLACK_URL` | No | Slack webhook URL |

## License

MIT
