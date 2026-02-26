You are the lead architect for the claude-docs-tracker project. Read CLAUDE.md, MEMORY.md, and UX-IMPROVEMENT-REPORT.md first to fully understand the project structure, current state, and design goals.

Then spawn 5 parallel sub-agents (using the Task tool) to execute the UX overhaul. Each agent works on separate files so there are no conflicts. All agents must read CLAUDE.md before starting work.

The goal: make the site visually match Claude's official documentation site (platform.claude.com/docs) — warm color palette, card-based layouts, polished interactions.

---

## Agent 1: Design System & Colors
Files: `src/app/globals.css`

Update CSS custom properties to a warm palette inspired by Claude docs:
- Light: --background: #faf9f7, --surface: #f0ede8, --border: #e0dcd5, --muted: #6b6560, --foreground: #1a1a1a
- Dark: --background: #1a1816, --surface: #252220, --border: #3a3632, --muted: #9a958f, --foreground: #ede9e3
- Add: --card-shadow, --hover-bg variables (and register them in @theme inline block)
- Keep accent #D97757 unchanged. Keep font families unchanged.
- Verify diff colors (added/removed) still have good contrast on new backgrounds.
- Run `npx tsc --noEmit` to verify. Commit: `style: update design tokens to warm palette`

## Agent 2: Navigation & Header
Files: `src/components/header.tsx`, `src/components/mobile-nav.tsx` (new), `src/app/layout.tsx`

- Remove `{ }` braces from logo → sparkle SVG icon + "Claude Docs Tracker" text (font-semibold tracking-tight)
- Nav links: pill-shaped active state (bg-surface rounded-full px-3 py-1.5)
- Header: sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border (no gradient)
- Dark mode toggle: add smooth rotate transition
- Create mobile-nav.tsx: hamburger menu (md:hidden), slide-in drawer, overlay backdrop, close on route change
- Run `npx tsc --noEmit` to verify. Commit: `feat: redesign navigation with mobile support`

## Agent 3: Homepage & Cards
Files: `src/app/page.tsx`, `src/components/change-card.tsx`, `src/components/dot-strip.tsx`

- Hero: larger title (text-3xl md:text-4xl font-bold tracking-tight), stats as 3 inline cards (rounded-xl border border-border bg-surface/50 p-4) with icons
- Dot strip: bigger dots (w-3 h-3), hover tooltips with date+count, pulse animation on today, opacity-20 for empty days
- Change cards: add category icon (from src/lib/category-icons.tsx), category chip label, relative time (formatDistanceToNow), softer badge colors (bg-green-50/bg-blue-50/bg-red-50 etc), ghost-style Show Diff button
- Card wrapper: rounded-xl border hover:border-accent/30 hover:shadow-sm transition-all p-5
- Keep server component architecture and all data fetching logic intact
- Run `npx tsc --noEmit` to verify. Commit: `feat: redesign homepage with card-based layout`

## Agent 4: Calendar & Day Detail
Files: `src/components/calendar-grid.tsx`, `src/components/calendar-view.tsx`, `src/components/day-detail.tsx`, `src/app/calendar/page.tsx`

- Fix Korean month display → English locale (import enUS from date-fns if needed)
- Calendar cells: min-h-[80px] md:min-h-[100px], hover:bg-surface/50 rounded-lg, today cell bg-accent/10 border-2 border-accent
- Month nav buttons: rounded-lg p-2 hover:bg-surface with chevron icons
- Desktop (lg+): grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 — day detail as right sidebar (sticky top-24)
- Day detail: human-readable date ("Thursday, Feb 26"), mini cards with category icons, "View full details →" link, max-h with scroll
- CRITICAL: do NOT break the setSelectedDate(null) in handleMonthChange or the race condition fix in useEffect
- Run `npx tsc --noEmit` to verify. Commit: `feat: polish calendar with sidebar layout`

## Agent 5: Search, Changes Detail & Global Polish
Files: `src/app/search/page.tsx`, `src/app/changes/[date]/page.tsx`, `src/components/command-k.tsx` (new), `src/app/layout.tsx` (footer only), `src/app/globals.css` (append utilities only)

- Search: rounded-xl input, remove separate button (search on Enter), add ⌘K badge hint, loading spinner, keyword highlighting (XSS-safe, no innerHTML), result count, suggestion chips for empty state
- Create command-k.tsx: global ⌘K/Ctrl+K shortcut → navigate to /search and focus input. Add to layout.tsx
- Changes/[date]: English date formatting (not Korean locale), section header icons (green plus/blue pencil/red trash/purple layout), improved date nav with day names ("← Wed, Feb 25")
- CRITICAL: do NOT remove validateDateString() redirect logic
- Footer: simplify to "Claude Docs Tracker" + icon links (GitHub, RSS) left, "MIT License · Next.js" right, border-t border-border py-6
- globals.css: append focus-visible ring, .card-hover transition, .skeleton shimmer animation
- Run `npx tsc --noEmit` to verify. Commit: `feat: polish search and add global interactions`

---

After all 5 agents complete, run `npx tsc --noEmit` one final time to confirm zero errors across the whole project. If any agent's changes conflict, resolve them.
