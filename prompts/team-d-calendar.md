You are working on the claude-docs-tracker Next.js project. Your task is to polish the Calendar page UI to match Claude's official docs (platform.claude.com/docs) aesthetic.

Read CLAUDE.md and MEMORY.md first to understand the project.

## Reference Design
- Claude docs uses clean, spacious layouts with generous padding
- Cards have rounded-xl corners, subtle borders, and slight shadows
- Interactive elements have clear hover/focus states

## Files to Modify

### 1. `src/components/calendar-grid.tsx` — Calendar visual polish
- Fix Korean month display: ensure format uses English locale
  - Change: `format(currentMonth, 'MMMM yyyy')` — verify it outputs English (should already, but check locale)
  - If "2026년 2월" still appears, explicitly pass `{ locale: enUS }` from date-fns/locale/en-US
- Increase cell padding: min-h-[80px] md:min-h-[100px] for each day cell
- Add hover effect on day cells: `hover:bg-surface/50 transition-colors cursor-pointer rounded-lg`
- Today's cell: `bg-accent/10 border-2 border-accent rounded-lg` (instead of just ring)
- Category dots: slightly larger (w-2 h-2), with small gap between them
- Month navigation buttons: `rounded-lg p-2 hover:bg-surface transition-colors` with chevron SVG icons
- Add subtle grid lines: `divide-x divide-y divide-border/50`

### 2. `src/components/calendar-view.tsx` — Layout improvement
- On desktop (lg+): show day detail as a right sidebar panel instead of below calendar
  - Layout: `grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6`
  - Calendar on left, day detail on right (sticky top-24)
  - Day detail panel: `rounded-xl border border-border bg-surface/30 p-5`
- On mobile: keep current below-calendar layout
- Add loading skeleton while fetching calendar data
- Smooth transition when switching months (opacity fade)
- IMPORTANT: selectedDate reset on month change was recently fixed with setSelectedDate(null) in handleMonthChange — do NOT break this

### 3. `src/components/day-detail.tsx` — Detail panel redesign
- Header: show date in "Thursday, Feb 26" format (more human-readable) using date-fns format
- Change items: mini cards with category icon + title + change type badge
- "View full details →" link to /changes/[date] page
- Empty state: friendly icon + "No changes on this day" message (currently shows English text, keep it)
- Max height with scroll on desktop sidebar mode (max-h-[calc(100vh-8rem)] overflow-y-auto)

### 4. `src/app/calendar/page.tsx` — Page header
- Title "Calendar" is fine, subtitle "Browse documentation changes by date" already exists
- Add a "Go to today" button if viewing a different month

## Constraints
- Calendar data fetching is client-side (useEffect with race condition fix) — keep this architecture
- Category system uses 4 types: platform-docs, agent-tools, claude-code, release-notes
- Ensure the calendar works correctly across month boundaries
- selectedDate reset on month change was recently fixed — do NOT revert this
- Dark mode must work for all new styles
- This project uses Tailwind CSS v4 with @theme inline in globals.css
- Run `npx tsc --noEmit` after changes to verify no TypeScript errors
- Commit with conventional commits format (e.g., `feat: polish calendar page with sidebar layout`)
