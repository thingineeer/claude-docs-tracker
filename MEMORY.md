# MEMORY.md — 프로젝트 메모리

> 이 파일은 Claude Code 에이전트가 프로젝트 컨텍스트를 빠르게 파악하기 위한 메모리 파일입니다.
> 작업 후 반드시 업데이트하세요.

## 프로젝트 정보

- **이름**: Claude Patch Notes (repo: claude-docs-tracker)
- **설명**: Claude 공식 문서의 일일 변경사항을 추적하는 웹 서비스
- **소유자**: thingineeer
- **GitHub**: https://github.com/thingineeer/claude-docs-tracker
- **상태**: v4.0 브랜드 리네이밍 + Apple-level UX 리디자인 완료
- **Production URL**: https://claude-docs-tracker.vercel.app
- **라이선스**: MIT
- **공개 여부**: public 오픈소스 (처음부터)

## 기술 스택

- Framework: Next.js 14+ (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS v4 (CSS custom properties 기반 다크모드)
- DB: Supabase (PostgreSQL, Seoul 리전, ref: ngleawriplmzzpfrojde)
- Crawler: fetch (code.claude.com SSR) + Playwright (platform.claude.com CSR)
- Diff: jsdiff
- AI: Claude Haiku 4.5 API
- Deploy: Vercel (GitHub 자동 배포, main push 시 프로덕션)
- Test: Jest + ts-jest (114개 테스트, 10 suites)

## 현재 페이지 구조 (v1.3)

### 페이지 (4개)
| 경로 | 설명 | 네비 |
|------|------|------|
| `/` | 홈 — 인라인 스탯, Activity Dot Strip, Recent Changes | Home |
| `/calendar` | 월별 캘린더 그리드 + 카테고리 필터 + 일별 상세 | Calendar |
| `/search` | 변경사항 키워드 검색 | Search |
| `/changes/[date]` | 일별 변경사항 상세 (캘린더에서 링크) | - |

### 삭제된 페이지
- `/changes` (History redirect) — 삭제, Calendar이 흡수
- `/sidebar-diff` — 삭제, 빈 페이지였음

### 네비게이션
- 헤더: sparkle 아이콘 + "Claude Patch Notes" (pill-shaped active nav)
- sticky top-0 backdrop-blur-md, 모바일 md:hidden 햄버거 → 슬라이드 드로어
- 푸터: 좌측 "Claude Patch Notes" + GitHub/RSS 아이콘, 우측 "MIT License · Next.js"
- 글로벌 Cmd+K → /search 포커스 (command-k.tsx)

### API 라우트
- `/api/calendar` — 월별 캘린더 데이터
- `/api/calendar/[date]` — 일별 상세 (카테고리별 그룹핑)
- `/api/changes` — 검색 (`?q=`)
- `/api/changes/latest` — 최신 변경사항
- `/api/crawl` — 수동 크롤링 트리거
- `/api/cron/crawl` — 크론 크롤링
- `/api/feed/rss` — RSS 피드
- `/api/feed/json` — JSON 피드

## 카테고리 시스템 (4개, v3.0)

| 카테고리 (표시명) | slug | 매핑 | 색상 | 아이콘 |
|----------|------|------|------|--------|
| Platform Docs | `platform-docs` | platform: API, guides, getting-started 등 | #8B5CF6 (purple) | SVG 문서 아이콘 |
| Claude Code Docs | `claude-code` | code.claude.com 전체 (overview, quickstart 포함) | #3B82F6 (blue) | SVG 터미널 아이콘 |
| Agents & MCP | `agents-mcp` | agent-sdk, agents-and-tools, mcp | #10B981 (green) | SVG 로봇 아이콘 |
| Changelogs | `release-notes` | platform release-notes + code changelog | #F59E0B (amber) | SVG 스피커 아이콘 |

- 아이콘: `src/lib/category-icons.tsx` (커스텀 SVG, 이모지 없음)
- 분류 로직: `src/lib/categories.ts` (`getCategoryForPage`)
- DB 동기화: `src/db/queries.ts` (`getCategoryFromPage → categories.ts의 getCategoryForPage re-export`)
- 마이그레이션: `supabase/migrations/004_update_categories.sql`, `scripts/run-migration-004.mjs`
- 변경점 (v2.0→v2.1): agent-tools→agents-mcp 리네이밍, overview/quickstart→claude-code 이동, 색상 재배치

## 홈페이지 데이터 소스 (v1.3)

- Pages Tracked: `getPageCount()` → pages 테이블 COUNT
- Today 스탯: `getTodayStats()` → changes 테이블 직접 집계
- 7일 타임라인: `getRecentChangeCounts()` → changes 테이블 직접 집계
- (daily_reports 테이블 미사용 — 데이터 정합성 위해 changes에서 직접)

## UX Overhaul (v2.0 — 2026-02-26)

### 디자인 시스템
- Warm palette: light #faf9f7, dark #1a1816 (순수 흰/검 → 따뜻한 톤)
- 신규 토큰: --card-shadow, --hover-bg (@theme inline 등록)
- globals.css: focus-visible ring, .card-hover, .skeleton shimmer 유틸리티 추가

### 홈페이지
- 스탯 3개 카드 (SVG 아이콘 + 값), dot strip 카드 래핑
- change-card: 카테고리 칩 + 상대 시간 + softer badge + ghost Show Diff
- dot strip: w-3 h-3 크기, hover 툴팁, 오늘 pulse 애니메이션

### 캘린더
- 영어 locale 강제 (enUS), 셀 min-h 증가, today accent border
- 데스크톱: grid-cols-[1fr_360px] 사이드바 레이아웃 (day detail sticky)
- "Go to today" 버튼, day-detail 미니 카드 + "View full details →" 링크

### 검색 & 변경 상세
- 검색: 인라인 입력 (Enter 검색), Cmd+K 뱃지, 키워드 하이라이팅 (XSS-safe)
- suggestion chips (empty state), 결과 카운트
- changes/[date]: 섹션 아이콘 (green/blue/red/purple SVG), 영어 날짜 네비

### 신규 파일
- `src/components/header.tsx` — 리디자인된 헤더
- `src/components/mobile-nav.tsx` — 모바일 슬라이드 드로어
- `src/components/command-k.tsx` — 글로벌 Cmd+K 단축키

### 삭제된 파일 (클린업)
- `src/components/navbar.tsx` — header.tsx로 대체, 데드코드 삭제
- `prompts/` 디렉토리 (6파일) — 프로세스 산출물, 프로덕션 레포에 불필요
- `UX-IMPROVEMENT-REPORT.md` — 프로세스 산출물
- `CALENDAR_FEATURE_PROMPT.md` — 프로세스 산출물

## v3.0 신규 기능 (2026-02-27)

### Silent Changes 감지
- changes 테이블에 `is_silent` boolean 추가
- release-notes 카테고리가 아닌 변경 = silent로 태깅
- change-card에 "Silent Change" 뱃지 표시

### Breaking Change 자동 감지
- `src/lib/breaking-detector.ts`: diff 추가분에서 12개 키워드 스캔
- changes 테이블에 `is_breaking` boolean 추가
- change-card에 빨간 "Breaking" 뱃지 표시
- 테스트: 9개 (tests/breaking-detector.test.ts)

### 주간 다이제스트
- `src/lib/weekly-digest.ts`: 지난 7일 변경 집계 + AI 요약
- `/api/cron/digest`: 매주 월요일 09:00 UTC 크론
- 변경 0건이면 스킵 (API 비용 절약)

### Public API v1
- `/api/v1/changes?from=&to=&category=&limit=` — 변경사항 조회
- `/api/v1/pages?category=&domain=` — 추적 페이지 목록
- `/api/v1/stats` — 통계 (페이지수, 변경수, 카테고리 분포)
- 모든 엔드포인트 CORS 활성화, 캐시 적용

### Webhook 강화
- `sendBreakingChangeAlert()`: breaking change 감지 시 즉시 Discord/Slack 알림
- Discord: 빨간 embed, Slack: 빨간 사이드바 attachment
- pipeline.ts에서 크롤링 완료 후 자동 호출

### 검색 추천 칩 동적화
- `/api/changes/suggestions`: 키워드 빈도 분석 기반 (getSearchSuggestions)
- search/page.tsx에서 API 호출, 하드코딩 제거
- fallback: ['API', 'model', 'Claude', 'deprecated']

## GitHub Releases 크롤러 (v4.1, 2026-02-27)

### 기능
- `src/crawler/github-releases-crawler.ts`: GitHub API로 anthropics/claude-code 릴리즈 크롤링
- 기존 daily cron pipeline에 통합 (Phase 2)
- `detected_at`에 `published_at` (실제 릴리즈 날짜) 사용
- github.com 도메인 → `release-notes` 카테고리 자동 분류
- 삭제/비공개화 감지 (`detectUnpublishedReleases`)

### 버그 수정 이력
- **페이지네이션 미구현**: 최초 구현 시 `?per_page=100` 1페이지만 요청 → 100개 이후 릴리즈 누락. page 파라미터 추가하여 최대 10페이지(1000개) 순회하도록 수정
- **relative time 부정확**: `detected_at`이 날짜만(`YYYY-MM-DD`) 저장되어 `parseISO()`가 자정 UTC로 파싱 → "about 12 hours ago" 표시. `created_at` (정확한 ISO 타임스탬프) 사용하도록 ChangeCard 수정
- **GITHUB_TOKEN 미설정 경고**: 미인증 시 60 req/hr 제한이므로 경고 로그 추가
- **검색 불능 (P0)**: `searchChanges()`가 `diff_summary`+`pages.title`+`pages.url`만 검색 → `diff_html` 미포함으로 모든 키워드 검색 0건. `diff_html.ilike` 추가하여 수정
- **새 페이지 diff 누락**: 새 페이지(`isNewPage`)일 때 `diffHtml`이 null → diff 미표시. `generateTextDiff('', content)`로 전체 내용을 added diff로 생성하도록 수정
- **중복 엔트리**: 같은 릴리즈가 다른 크롤링 사이클에서 중복 change 레코드 생성. `getExistingChange()` + `updateChange()`로 동일 page+date 중복 방지

### 관련 파일
- `src/crawler/github-releases-crawler.ts` — 핵심 크롤러
- `src/crawler/config.ts` — GITHUB_REPO, GITHUB_API_BASE 상수
- `src/crawler/pipeline.ts` — skipGitHub 옵션, githubReleases 카운트
- `src/db/queries.ts` — getGitHubReleasePages(), getExistingChange(), updateChange()
- `scripts/seed-github-releases.ts` — 초기 데이터 시드 스크립트
- `.env.example` — GITHUB_TOKEN (optional)

## DB 상태

- pages: 191개 (platform 84 + code 57 + github 50)
- changes: 16개 + GitHub releases 50건
- 마이그레이션: 001(초기), 002(sidebar), 003(category), 004(category rename), 005(silent+breaking flags)

## 빌드 상태

- TypeScript: 0 에러
- Tests: 114/114 통과 (10 suites)
- 마지막 확인: 2026-02-27

## QA 수정 이력 (v1.3.1 — 2026-02-26)

### 완료된 수정
- 한국어/영어 혼재 3곳 통일 (format-change-summary, day-detail, calendar-grid)
- snapshot-manager: sidebar만 변경 시 중복 change 레코드 방지
- getCategoryFromPage 중복 함수 → categories.ts의 getCategoryForPage로 통합
- calendar/[date] API: validateDateString() 적용 (2월 30일 등 방어)
- 연도 범위 불일치 통일 (2024-2100)
- calendar-view race condition 수정 (빠른 월 전환 시 stale data 방지)
- supabase.ts: 환경변수 빈 문자열 방어
- changes API: 검색 쿼리 200자 제한
- search/page: 검색 결과 없을 때 올바른 쿼리 표시
- change-card: Show Diff 버튼 접근성(aria-expanded, aria-label)
- DiffView: XSS 방어 (HTML sanitizer 추가)
- 검색 LIKE 특수문자 이스케이프
- 크롤러 전체 타임아웃 추가
- API 에러 응답 형식 통일
- 검색 버튼 빈 입력 비활성화
- RSS/JSON 피드 CORS 헤더 추가
- HTML 엔티티 디코딩 중복 제거
- 크롤러 상수 config.ts로 중앙화

## v4.0 Brand + UX Overhaul (2026-02-27)

### 브랜드 리네이밍
- "Claude Docs Tracker" → "Claude Patch Notes" (전체 앱)
- layout.tsx metadata, header, footer, page.tsx, RSS/JSON 피드 전부 업데이트
- URL(claude-docs-tracker.vercel.app)과 내부 slug는 유지

### Apple-level UX 리디자인
- 홈페이지: font-semibold(not bold), text-2xl md:text-3xl, 스탯 카드 p-3, 아이콘 w-4
- change-card: 카테고리 칩 → 작은 컬러 도트(w-2 h-2)로 간소화, Show Diff → 텍스트 링크
- Diff 토글: max-height transition 애니메이션 추가
- 캘린더 empty state: "The docs were stable on this day" + "View latest changes" 링크
- day-detail: 카테고리 description 표시, 미니 카드에 좌측 컬러 보더
- category-legend: 활성 시 bg-{color}/10 배경, 비활성 opacity-40
- calendar-grid: hover:bg-surface/70 transition 추가
- 검색: 결과 카운트 pill 뱃지, 빈 상태 개선
- globals.css: fadeIn/slideUpFadeIn 애니메이션, 다크모드 스크롤바, text-rendering: optimizeLegibility

### 검색 수정
- searchChanges()에 `diff_html` 필드 검색 추가 (primary + fallback 모두)
- searchChanges() fallback에 pages.title 검색 추가
- getSearchSuggestions(): 키워드 빈도 분석으로 추천 칩 생성 (stopword 필터링)
- 추천 칩이 실제 결과를 반환하도록 보장

### README 간소화
- Quick Start, Setup, Contributing, Project Structure, API Usage 섹션 제거
- 비교 테이블 + Features + Built With + License만 유지 (showcase 전용)

## v4.2 버그 수정 (2026-02-27)

### 검색 불능 수정 (P0 Critical)
- `searchChanges()`에 `diff_html.ilike` 추가 (primary + fallback)
- 이전: diff_summary(대부분 null) + title + url만 검색 → "MCP" 등 0건
- 이후: diff 본문 키워드 검색 가능

### 새 페이지 diff 생성 (P1 High)
- `processSnapshot()`에서 `isNewPage`일 때 `generateTextDiff('', content)` 호출
- 새 릴리즈(v2.1.61, v2.1.62 등) diff 내용 정상 표시

### 중복 엔트리 방지 (P1 High)
- `getExistingChange(pageId, detectedAt)`: 동일 page+date 기존 변경 조회
- `updateChange(changeId, updates)`: 기존 변경 레코드 업데이트
- 같은 날 재크롤링 시 insert 대신 update → 중복 제거

### 신규 테스트 파일
- `tests/queries.test.ts`: escapeLikePattern 6개 + 함수 export 3개
- `tests/diff-generator.test.ts`: 새 페이지 diff 테스트 4개 추가

## 깃 플로우 규칙

- worktree 사용 시 feature 브랜치에서 작업 → `git merge --no-ff` 로 main에 병합
- 직접 main에 커밋하지 않고 반드시 merge commit 생성 (branching graph 유지)
- 선형 커밋 그래프 금지 — merge-based flow 엄수

## 보안 주의사항

- public repo — 모든 커밋 공개
- API 키, 시크릿 절대 커밋 금지 (.env → .gitignore)
- 상세 보안 규칙: CLAUDE.md 참고

## 참고 링크

- 기획서: ./PLAN.md
- 컨벤션: ./CLAUDE.md
- GitHub: https://github.com/thingineeer/claude-docs-tracker
- Production: https://claude-docs-tracker.vercel.app
