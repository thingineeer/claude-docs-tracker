You are working on the claude-docs-tracker Next.js project. Your task is to polish the Search page, Changes detail page, and add global micro-interactions.

Read CLAUDE.md and MEMORY.md first to understand the project.

## Files to Modify

### 1. `src/app/search/page.tsx` — Search page improvement
- Add keyboard shortcut hint: show "⌘K" badge inside the search input (right side)
- Search input: `rounded-xl border-2 border-border focus-within:border-accent bg-surface/30 px-4 py-3`
- Remove the separate "Search" button — search on Enter key press
- Or: convert button to a subtle icon-only search button inside the input field (right side)
- Add loading spinner while searching (use a simple SVG spinner)
- Empty state: show search suggestions like "Try: vision, streaming, tool use, MCP"
- Results: add keyword highlighting in title and summary (wrap matches in <mark> tag with bg-accent/20 rounded style)
- Show result count: "Found N changes matching 'query'"

### 2. Create `src/components/command-k.tsx` (NEW FILE)
- Global ⌘K (Mac) / Ctrl+K (Windows) shortcut component
- On trigger: navigate to /search page and focus the search input
- Add this component to layout.tsx so it works on every page
- Use useEffect with keydown listener, check metaKey/ctrlKey + 'k'

### 3. `src/app/changes/[date]/page.tsx` — Changes detail page polish
- Date navigation: make prev/next buttons more prominent with arrow icons + date text
- Date picker input: ensure English locale formatting (not "2026. 02. 26." Korean format)
  - The native `<input type="date">` renders in browser locale — consider showing a custom formatted display
  - Show date like "February 26, 2026" as a heading, with the native date picker as a small icon button
- Section headers (New Pages, Modified Pages, etc.): add count badge + SVG icon
  - New: green plus-circle icon
  - Modified: blue pencil icon
  - Removed: red trash icon
  - Sidebar: purple layout icon
- Improve "Back to calendar" breadcrumb link styling
- When no changes: show a nicer empty state with calendar icon + message
- IMPORTANT: validateDateString() check with redirect was recently added — do NOT remove this

### 4. `src/app/layout.tsx` — Footer redesign
- Current footer has: GitHub, RSS, Calendar, Search links + MIT License + Powered by
- Redesign footer:
  - Clean layout: left side = "Claude Docs Tracker" + GitHub icon link + RSS icon link
  - Right side = "MIT License · Powered by Next.js"
  - Style: `border-t border-border py-6 text-sm text-muted`
  - Keep all existing links (GitHub, RSS) but make them icon-based with hover tooltips
  - Remove redundant text nav links (Calendar, Search are in header already)

### 5. `src/app/globals.css` — Add global micro-interactions
Add these utility styles after existing styles:

```css
/* Focus ring style matching Claude docs */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Card hover transition utility */
.card-hover {
  transition: border-color 0.2s, box-shadow 0.2s;
}
.card-hover:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* Skeleton loading animation */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

## Constraints
- Search must remain a server component page with client-side form interaction
- ⌘K shortcut should not conflict with browser defaults (preventDefault only when not in input)
- Keyword highlighting must be XSS-safe (use textContent splitting, NOT dangerouslySetInnerHTML)
- All changes must work in both light and dark mode
- Keep existing URL structure (/search?q=..., /changes/[date])
- Footer must keep RSS feed link accessible (important for users)
- This project uses Tailwind CSS v4 with @theme inline in globals.css
- Run `npx tsc --noEmit` after changes to verify no TypeScript errors
- Commit with conventional commits format (e.g., `feat: polish search page and add global shortcuts`)
