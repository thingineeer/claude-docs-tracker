You are working on the claude-docs-tracker Next.js project. Your task is to redesign the navigation header to match Claude's official documentation site (platform.claude.com/docs) aesthetic.

Read CLAUDE.md and MEMORY.md first to understand the project.

## Reference: Claude Docs Navigation
- Logo: Clean text "Claude API Docs" with a small sparkle/star icon, no brackets/braces
- Nav items: Centered, with pill-shaped background on active item (rounded-full, subtle bg)
- Right side: theme toggle + optional action buttons
- Bottom border: single clean 1px line, no gradient
- Sticky header with backdrop-blur on scroll

## Files to Modify

### 1. `src/components/header.tsx`
- Remove the `{ }` braces from logo. Use a simple SVG sparkle icon (Claude's star shape) + text "Claude Docs Tracker"
- Logo should use font-semibold, tracking-tight, text-lg
- Nav links: add rounded-full px-3 py-1.5 background on active state (bg-surface)
- Add backdrop-blur-md bg-background/80 for scroll transparency
- Replace gradient bottom border with simple `border-b border-border`
- Dark mode toggle: add smooth rotate transition on icon swap
- Add hamburger button visible only on small screens (md:hidden)

### 2. `src/app/layout.tsx` (if header is rendered here)
- Ensure header has `sticky top-0 z-50` positioning
- Add smooth scroll-padding-top for anchor links

### 3. Create `src/components/mobile-nav.tsx` (NEW FILE)
- Create a mobile hamburger menu (hidden on md+, visible on mobile)
- Use a slide-in drawer from right side
- Include all nav links + dark mode toggle
- Add overlay backdrop when open
- Animate with CSS transitions (transform translateX)
- Close on route change and on clicking overlay

### Design Tokens (use these Tailwind classes)
- Active nav: `bg-surface rounded-full px-3 py-1.5 text-foreground font-medium`
- Inactive nav: `text-muted hover:text-foreground transition-colors`
- Header: `sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border`

## Constraints
- Keep all existing navigation links (Home, Calendar, Search)
- Keep the dark mode toggle functional
- Ensure keyboard navigation works (focus-visible states)
- Mobile nav must work on 375px width
- This project uses Tailwind CSS v4 with @theme inline in globals.css
- Run `npx tsc --noEmit` after changes to verify no TypeScript errors
- Commit with conventional commits format (e.g., `feat: redesign navigation header with mobile support`)
