You are working on the claude-docs-tracker Next.js project. Your task is to update the design system to match Claude's official documentation site (platform.claude.com/docs) aesthetic.

Read CLAUDE.md and MEMORY.md first to understand the project.

## Reference: Claude Docs Design Language
- Background: warm off-white (#faf9f7 or similar), NOT pure white
- Dark mode: warm dark (#1a1816 or #282421), NOT pure black (#0a0a0a)
- Cards: subtle warm-gray borders with very slight shadow, rounded-xl (12px+)
- Text hierarchy: primary text near-black (#1a1a1a), muted text warm-gray (#6b6560)
- Accent: keep the existing #D97757 (it already matches Claude's orange/terracotta)
- Font: Keep Geist Sans (it's close to Claude docs' clean sans-serif)

## Files to Modify
- `src/app/globals.css` — Update CSS custom properties:
  - Light mode: --background: #faf9f7, --surface: #f0ede8, --border: #e0dcd5, --muted: #6b6560, --foreground: #1a1a1a
  - Dark mode: --background: #1a1816, --surface: #252220, --border: #3a3632, --muted: #9a958f, --foreground: #ede9e3
  - Add new variables: --card-shadow: 0 1px 3px rgba(0,0,0,0.04), --hover-bg: rgba(0,0,0,0.03)
  - Dark mode card-shadow: 0 1px 3px rgba(0,0,0,0.2)
  - Also add to @theme inline block: --color-card-shadow and --color-hover-bg

## Constraints
- Do NOT change the accent color (#D97757) — it already fits
- Do NOT change font families
- Make sure diff colors (added/removed) still have good contrast on the new backgrounds
- Test that all text passes WCAG AA contrast ratio on new backgrounds
- Keep all Tailwind class references working (they use var() references)
- This project uses Tailwind CSS v4 with @theme inline block — new CSS variables must be registered there too
- Run `npx tsc --noEmit` after changes to verify no TypeScript errors
- Commit with conventional commits format (e.g., `style: update design tokens to warm palette`)
