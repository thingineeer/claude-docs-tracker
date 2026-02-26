You are working on the claude-docs-tracker Next.js project. Your task is to redesign the homepage to look more polished, inspired by Claude's official docs (platform.claude.com/docs) card-based layout.

Read CLAUDE.md and MEMORY.md first to understand the project.

## Reference: Claude Docs Homepage
- Feature cards: 3-column grid with icon + title + description, rounded-xl, subtle border + shadow
- Clean section separation with generous whitespace (py-12 between sections)
- Typography: large headings, clean sans for body

## Files to Modify

### 1. `src/app/page.tsx` — Homepage restructure
Current structure: Hero stats → Dot strip → Recent Changes list
New structure:

**Section 1: Hero**
- Keep "Claude Docs Tracker" title but make it larger (text-3xl md:text-4xl font-bold tracking-tight)
- Subtitle: keep "Tracking changes across..." but lighter weight
- Stats: redesign as 3 small inline cards in a row:
  - Card 1: icon (document icon) + "147 Pages" + "Tracked"
  - Card 2: icon (bell icon) + "N Changes" + "Today"
  - Card 3: icon (calendar icon) + "Last updated" + relative time
- Stats cards: `rounded-xl border border-border bg-surface/50 p-4 flex items-center gap-3`

**Section 2: Activity Overview (replace dot strip)**
- Keep the Last 7 Days concept but improve visual:
  - Each day: vertical bar chart style instead of dots (small colored bars, height proportional to change count)
  - Or keep dots but add tooltip on hover showing "N changes on this date"
  - Background card with `rounded-xl border border-border bg-surface/30 p-6`
  - "View calendar →" link aligned right with arrow icon

**Section 3: Recent Changes (improved cards)**
- Each change card redesign:
  - Left: colored category dot/icon (use existing category system)
  - Category label as small chip above title (e.g., "Release Notes" chip in muted style)
  - Title: font-semibold, clickable link to original page
  - URL: truncated, monospace, text-xs text-muted
  - Summary: text-sm, max 2 lines with line-clamp-2
  - Date: relative time ("2 hours ago") instead of raw date
  - "Show Diff" button: ghost style, smaller, right-aligned
- Card wrapper: `rounded-xl border border-border hover:border-accent/30 hover:shadow-sm transition-all p-5`
- Add category icon from existing `src/lib/category-icons.tsx`

### 2. `src/components/change-card.tsx` — Card redesign
- Add category prop (derive from URL using getCategoryForPage)
- Import getCategoryForPage from `@/lib/categories` and CategoryIcon from `@/lib/category-icons`
- Add relative time display using date-fns `formatDistanceToNow`
- Improve badge styling: softer colors, rounded-md instead of sharp
  - added: bg-green-50 text-green-700 border border-green-200 (light) / bg-green-900/20 text-green-400 (dark)
  - modified: bg-blue-50 text-blue-700 border border-blue-200 (light) / bg-blue-900/20 text-blue-400 (dark)
  - removed: bg-red-50 text-red-700 border border-red-200 (light)
  - sidebar_changed: bg-purple-50 text-purple-700 border border-purple-200 (light)
- "Show Diff" button: `text-sm text-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-all`

### 3. `src/components/dot-strip.tsx` — Improve activity visualization
- Add title prop for accessibility
- Add hover tooltip showing date + change count
- Increase dot size slightly (w-3 h-3 minimum)
- Add subtle pulse animation on today's dot
- Empty days: show very faint dot (opacity-20) instead of near-invisible

## Constraints
- Keep all existing data fetching logic
- Keep server component architecture (page.tsx is async server component)
- Category detection should use existing getCategoryForPage from src/lib/categories.ts
- Ensure dark mode compatibility for all new styles
- Keep "View all" and "View calendar" navigation links
- This project uses Tailwind CSS v4 with @theme inline in globals.css
- Run `npx tsc --noEmit` after changes to verify no TypeScript errors
- Commit with conventional commits format (e.g., `feat: redesign homepage with card-based layout`)
