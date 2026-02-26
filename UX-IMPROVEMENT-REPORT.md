# Claude Docs Tracker — UX Improvement Report

> **Reference**: Claude Official Docs (platform.claude.com/docs)
> **Target**: https://claude-docs-tracker.vercel.app
> **Date**: 2026-02-26
> **Purpose**: Agent team prompts for CLI-based parallel execution

---

## Executive Summary

Claude 공식 문서 사이트(platform.claude.com/docs)와 비교 분석한 결과, claude-docs-tracker는 기능적으로 잘 동작하지만 시각적 완성도와 UX 측면에서 개선 여지가 있습니다. 공식 문서의 디자인 언어(다크 테마 기본, 카드 기반 레이아웃, 세련된 타이포그래피, 여백 활용)를 참고하여 5개 팀으로 나누어 병렬 작업을 진행합니다.

---

## Team A: Design System & Color Palette Overhaul

### 목표
Claude 공식 문서의 디자인 토큰을 참고하여 색상 체계를 개선합니다.

### 현재 문제점
1. **Light mode 배경이 순수 흰색(#ffffff)**: Claude docs는 크림/베이지(#f5f0e8 계열) 톤의 따뜻한 배경을 사용
2. **Dark mode가 순수 검정(#0a0a0a)**: Claude docs는 따뜻한 다크(#282421 계열)를 사용하여 눈이 편함
3. **accent 색상(#D97757)은 좋으나**, Claude docs의 더 정교한 그라데이션 및 hover 상태가 부족
4. **border 색상이 너무 얇고 희미**: Claude docs는 카드 테두리에 subtle하지만 명확한 구분선 사용

### Prompt for Agent

```
You are working on the claude-docs-tracker Next.js project. Your task is to update the design system to match Claude's official documentation site (platform.claude.com/docs) aesthetic.

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

## Constraints
- Do NOT change the accent color (#D97757) — it already fits
- Do NOT change font families
- Make sure diff colors (added/removed) still have good contrast on the new backgrounds
- Test that all text passes WCAG AA contrast ratio on new backgrounds
- Keep all Tailwind class references working (they use var() references)
```

---

## Team B: Navigation & Header Redesign

### 목표
Claude docs 스타일의 깔끔하고 고급스러운 네비게이션으로 개선합니다.

### 현재 문제점
1. **로고 `{ Claude Docs Tracker }`가 개발자스러움**: Claude docs는 sparkle 아이콘 + 깔끔한 텍스트 로고 사용
2. **네비게이션이 단순 텍스트 링크**: Claude docs는 pill-shaped active indicator 사용
3. **다크모드 토글이 아이콘만**: 전환 애니메이션 없음
4. **헤더에 bottom border가 gradient accent line**: 약간 산만함
5. **모바일 네비 없음**: 햄버거 메뉴 또는 bottom tab 필요

### Prompt for Agent

```
You are working on the claude-docs-tracker Next.js project. Your task is to redesign the navigation header to match Claude's official documentation site aesthetic.

## Reference: Claude Docs Navigation
- Logo: Clean text "Claude API Docs" with a small sparkle/star icon, no brackets/braces
- Nav items: Centered, with pill-shaped background on active item (rounded-full, subtle bg)
- Right side: theme toggle + optional action buttons
- Bottom border: single clean 1px line, no gradient
- Sticky header with backdrop-blur on scroll

## Files to Modify

### 1. `src/components/header.tsx`
- Remove the `{ }` braces from logo. Use a simple SVG sparkle icon (Claude's ✦) + text "Claude Docs Tracker"
- Logo should use font-semibold, tracking-tight, text-lg
- Nav links: add rounded-full px-3 py-1.5 background on active state (bg-surface)
- Add backdrop-blur-md bg-background/80 for scroll transparency
- Replace gradient bottom border with simple `border-b border-border`
- Dark mode toggle: add smooth rotate transition on icon swap

### 2. `src/app/layout.tsx` (if header is rendered here)
- Ensure header has `sticky top-0 z-50` positioning
- Add smooth scroll-padding-top for anchor links

### 3. Create `src/components/mobile-nav.tsx` (NEW FILE)
- Create a mobile hamburger menu (hidden on md+, visible on mobile)
- Use a slide-in drawer from right side
- Include all nav links + dark mode toggle
- Add overlay backdrop when open
- Animate with CSS transitions (transform translateX)

### 4. Update `src/components/header.tsx` to include mobile nav trigger
- Add hamburger button visible only on small screens (md:hidden)
- Import and render MobileNav component

## Design Tokens (use these Tailwind classes)
- Active nav: `bg-surface rounded-full px-3 py-1.5 text-foreground font-medium`
- Inactive nav: `text-muted hover:text-foreground transition-colors`
- Header: `sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border`

## Constraints
- Keep all existing navigation links (Home, Calendar, Search)
- Keep the dark mode toggle functional
- Ensure keyboard navigation works (focus-visible states)
- Mobile nav must work on 375px width
```

---

## Team C: Homepage Layout & Cards Redesign

### 목표
홈페이지를 Claude docs의 카드 기반 레이아웃처럼 정보가 잘 정리된 대시보드로 개선합니다.

### 현재 문제점
1. **스탯 표시가 큰 숫자만 나열**: Claude docs는 아이콘 + 라벨 + 값을 카드 안에 정리
2. **"Last 7 Days" dot strip이 의미 전달 부족**: 점 크기로만 변경 수를 표현, 숫자가 있지만 hover 정보 없음
3. **Recent Changes 카드가 단조로움**: 뱃지 + 제목 + URL + 설명이 flat하게 나열됨
4. **카테고리 구분이 없음**: 홈에서 어떤 카테고리 변경인지 바로 알 수 없음
5. **빈 날짜(변경 없음)에 대한 시각 피드백 부족**: 점이 작고 희미하여 의미 불명확

### Prompt for Agent

```
You are working on the claude-docs-tracker Next.js project. Your task is to redesign the homepage to look more polished, inspired by Claude's official docs card-based layout.

## Reference: Claude Docs Homepage
- Feature cards: 3-column grid with icon + title + description, rounded-xl, subtle border + shadow
- Clean section separation with generous whitespace (py-12 between sections)
- Typography: large serif-like headings for hero, clean sans for body

## Files to Modify

### 1. `src/app/page.tsx` — Homepage restructure
Current structure: Hero stats → Dot strip → Recent Changes list
New structure:

**Section 1: Hero**
- Keep "Claude Docs Tracker" title but make it larger (text-3xl md:text-4xl font-bold tracking-tight)
- Subtitle: keep "Tracking changes across..." but lighter weight
- Stats: redesign as 3 small inline cards in a row:
  - Card 1: icon (document icon) + "147 Pages" + "Tracked"
  - Card 2: icon (bell icon) + "1 Change" + "Today"
  - Card 3: icon (calendar icon) + "Last updated" + relative time
- Stats cards: `rounded-xl border border-border bg-surface/50 p-4 flex items-center gap-3`

**Section 2: Activity Overview (replace dot strip)**
- Keep the Last 7 Days concept but improve visual:
  - Each day: vertical bar chart style instead of dots (small colored bars, height = change count)
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
- Add category prop (derive from URL domain/section)
- Import getCategoryForPage and CategoryIcon
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
```

---

## Team D: Calendar Page & Day Detail Polish

### 목표
캘린더 페이지를 더 인터랙티브하고 정보밀도 높게 개선합니다.

### 현재 문제점
1. **월 표시가 한국어("2026년 2월")**: 영어 프로젝트인데 locale 불일치
2. **캘린더 셀이 너무 밀집**: 여백 부족, 클릭 영역이 좁음
3. **Day detail 패널이 캘린더 아래에 뜸**: 옆에 나오거나 모달이 더 자연스러움
4. **카테고리 범례가 하단에 작게 표시**: 더 눈에 띄게 필요
5. **날짜 네비게이션(이전/다음 월) 버튼이 투박**: 아이콘만, hover 효과 없음

### Prompt for Agent

```
You are working on the claude-docs-tracker Next.js project. Your task is to polish the Calendar page UI.

## Reference Design
- Claude docs uses clean, spacious layouts with generous padding
- Cards have rounded-xl corners, subtle borders, and slight shadows
- Interactive elements have clear hover/focus states

## Files to Modify

### 1. `src/components/calendar-grid.tsx` — Calendar visual polish
- Fix Korean month display: ensure format uses English locale
  - Change: `format(currentMonth, 'MMMM yyyy')` — verify it outputs English (should already, but check locale)
  - If "2026년 2월" still appears, explicitly pass `{ locale: enUS }` from date-fns
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

### 3. `src/components/day-detail.tsx` — Detail panel redesign
- Header: show date in "Thursday, Feb 26" format (more human-readable)
- Change items: mini cards with category icon + title + change type badge
- "View full details →" link to /changes/[date] page
- Empty state: friendly illustration or icon + "No changes on this day" message
- Max height with scroll on desktop sidebar mode

### 4. `src/app/calendar/page.tsx` — Page header
- Title "Calendar" is fine, but add a subtitle like "Browse documentation changes by date"
- Add a "Go to today" button if viewing a different month
- Breadcrumb-style month selector would be nice but optional

## Constraints
- Calendar data fetching is client-side (useEffect) — keep this architecture
- Category system uses 4 types: platform-docs, agent-tools, claude-code, release-notes
- Ensure the calendar works correctly across month boundaries
- selectedDate reset on month change was recently fixed — don't break this
- Dark mode must work for all new styles
```

---

## Team E: Search Page, Changes Detail Page & Global Polish

### 목표
검색 페이지와 변경 상세 페이지의 완성도를 높이고, 전체적인 마이크로인터랙션을 추가합니다.

### 현재 문제점
1. **검색 페이지가 너무 심플**: 입력창 + 버튼만 있음, Claude docs처럼 ⌘K 바로가기 힌트 없음
2. **검색 결과 카드가 홈페이지와 동일한 flat 디자인**: 검색 키워드 하이라이팅 없음
3. **Changes/[date] 페이지**: 날짜 네비게이션은 있으나 date picker UI가 한국어 locale
4. **Footer가 너무 기본적**: Claude docs는 깔끔한 하단 링크 + 브랜딩
5. **페이지 전환 시 로딩 인디케이터 없음**: Next.js 기본 동작에 의존
6. **전체적으로 hover/focus/active 상태가 부족**: 인터랙션 피드백 약함

### Prompt for Agent

```
You are working on the claude-docs-tracker Next.js project. Your task is to polish the Search page, Changes detail page, and add global micro-interactions.

## Files to Modify

### 1. `src/app/search/page.tsx` — Search page improvement
- Add keyboard shortcut hint: show "⌘K" badge inside the search input (right side)
- Add global ⌘K shortcut to focus search input from any page
- Search input: `rounded-xl border-2 border-border focus-within:border-accent bg-surface/30 px-4 py-3`
- Remove the separate "Search" button — make it search on Enter (keep debounce)
- Or: convert button to an icon-only search button inside the input field (right side)
- Add loading spinner while searching
- Empty state: show search suggestions like "Try: vision, streaming, tool use, MCP"
- Results: add keyword highlighting in title and summary (wrap matches in <mark>)

### 2. `src/components/search-form.tsx` (if exists, or create)
- Extract search logic into a reusable component
- Support ⌘K global shortcut
- Debounced search with 300ms delay
- Show result count: "Found N changes matching 'query'"

### 3. `src/app/changes/[date]/page.tsx` — Changes detail page polish
- Date navigation: make prev/next buttons more prominent with arrow icons + date text
- Date picker input: ensure English locale formatting (not "2026. 02. 26." Korean format)
  - Use `<input type="date">` with explicit formatting or a custom date display
- Section headers (New Pages, Modified Pages, etc.): add count badge + icon
  - New: green plus-circle icon
  - Modified: blue pencil icon
  - Removed: red trash icon
  - Sidebar: purple layout icon
- Add "Back to calendar" breadcrumb link (already exists but improve styling)
- When no changes: show a nicer empty state with calendar icon + message

### 4. `src/components/date-nav.tsx` — Date navigation redesign
- Prev/Next: `flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface border border-border transition-all`
- Show day name: "← Wed, Feb 25" and "Fri, Feb 27 →"
- Today indicator: `bg-accent text-white rounded-full px-3 py-1 text-sm font-medium`
- Date picker: style as a clean dropdown/popover instead of native browser picker

### 5. `src/app/layout.tsx` — Global improvements
- Add page transition loading bar (NProgress style or Next.js built-in)
  - Simple: thin accent-colored bar at top of page during navigation
- Footer redesign:
  - Clean layout: left side = "Claude Docs Tracker · Open Source" + GitHub icon link
  - Right side = "Built with Next.js · MIT License"
  - Style: `border-t border-border py-6 text-sm text-muted`
  - Remove redundant nav links from footer (they're in header)

### 6. `src/app/globals.css` — Add global micro-interactions
Add these utility styles:
```css
/* Smooth page transitions */
@view-transition { navigation: auto; }

/* Focus ring style matching Claude docs */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Card hover transition */
.card-hover {
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.1s;
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
- Search must remain a server component page with client form
- ⌘K shortcut should not conflict with browser defaults
- Keyword highlighting must be XSS-safe (use text content, not innerHTML)
- All changes must work in both light and dark mode
- Keep existing URL structure (/search?q=..., /changes/[date])
- Footer changes should not break the existing RSS/JSON feed links (keep them accessible somewhere)
```

---

## Execution Guide

### CLI에서 에이전트 팀 스폰하는 방법

각 팀의 Prompt를 별도의 Claude Code 세션에서 실행합니다. 의존성 순서:

```
Phase 1 (먼저): Team A (Design System) — 다른 팀의 기반이 되는 색상 체계
Phase 2 (병렬): Team B + C + D + E — Phase 1 완료 후 동시 실행 가능
```

### 실행 예시

```bash
# Phase 1: Design System 먼저
claude -p "$(cat UX-IMPROVEMENT-REPORT.md | sed -n '/^## Team A/,/^---$/p')"

# Phase 2: 나머지 병렬 실행 (각각 별도 터미널에서)
claude -p "$(cat UX-IMPROVEMENT-REPORT.md | sed -n '/^## Team B/,/^---$/p')" &
claude -p "$(cat UX-IMPROVEMENT-REPORT.md | sed -n '/^## Team C/,/^---$/p')" &
claude -p "$(cat UX-IMPROVEMENT-REPORT.md | sed -n '/^## Team D/,/^---$/p')" &
claude -p "$(cat UX-IMPROVEMENT-REPORT.md | sed -n '/^## Team E/,/^---$/p')" &
wait
```

### 또는 각 팀 프롬프트를 개별 파일로 추출

```bash
# 개별 파일 생성 후 실행
claude -p "$(cat prompts/team-a-design-system.md)"
claude -p "$(cat prompts/team-b-navigation.md)"
# ...
```

---

## Summary Table

| Team | Focus | Files | Priority | Est. Complexity |
|------|-------|-------|----------|----------------|
| A | Design System & Colors | globals.css | Phase 1 (먼저) | Low |
| B | Navigation & Header | header.tsx, mobile-nav.tsx, layout.tsx | Phase 2 | Medium |
| C | Homepage & Cards | page.tsx, change-card.tsx, dot-strip.tsx | Phase 2 | High |
| D | Calendar & Day Detail | calendar-grid.tsx, calendar-view.tsx, day-detail.tsx | Phase 2 | Medium |
| E | Search, Changes, Global | search/page.tsx, changes/page.tsx, date-nav.tsx, globals.css, layout.tsx | Phase 2 | High |

---

## Notes

- 이 보고서는 Claude 공식 문서(platform.claude.com/docs)의 디자인을 참고하여 작성되었습니다
- 기존 기능과 데이터 구조는 변경하지 않습니다 (UI/UX only)
- 모든 변경은 light/dark mode 양쪽에서 동작해야 합니다
- Tailwind CSS v4 (CSS-first config) 사용 중이므로 @theme inline 블록 내에서 커스텀 색상 정의
- 기존 카테고리 시스템(4개)과 아이콘을 최대한 활용합니다
