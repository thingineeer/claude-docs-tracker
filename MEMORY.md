# MEMORY.md — 프로젝트 메모리

> 이 파일은 Claude Code 에이전트가 프로젝트 컨텍스트를 빠르게 파악하기 위한 메모리 파일입니다.
> 작업 후 반드시 업데이트하세요.

## 프로젝트 정보

- **이름**: claude-docs-tracker
- **설명**: Claude 공식 문서의 일일 변경사항을 추적하는 웹 서비스
- **소유자**: thingineeer
- **GitHub**: https://github.com/thingineeer/claude-docs-tracker
- **상태**: v3.0 경쟁사 분석 기반 성장 기능 구현 완료
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
- Test: Jest + ts-jest (89개 테스트, 8 suites)

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
- 헤더: sparkle 아이콘 + "Claude Docs Tracker" (pill-shaped active nav)
- sticky top-0 backdrop-blur-md, 모바일 md:hidden 햄버거 → 슬라이드 드로어
- 푸터: 좌측 "Claude Docs Tracker" + GitHub/RSS 아이콘, 우측 "MIT License · Next.js"
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

## 카테고리 시스템 (4개, v2.1)

| 카테고리 | slug | 매핑 | 색상 | 아이콘 |
|----------|------|------|------|--------|
| Platform Docs | `platform-docs` | platform: API, guides, getting-started 등 | #8B5CF6 (purple) | SVG 문서 아이콘 |
| Claude Code | `claude-code` | code.claude.com 전체 (overview, quickstart 포함) | #3B82F6 (blue) | SVG 터미널 아이콘 |
| Agents & MCP | `agents-mcp` | agent-sdk, agents-and-tools, mcp | #10B981 (green) | SVG 로봇 아이콘 |
| Release Notes | `release-notes` | platform release-notes + code changelog | #F59E0B (amber) | SVG 스피커 아이콘 |

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
- `/api/changes/suggestions`: 최근 변경 페이지 타이틀 기반
- search/page.tsx에서 API 호출, 하드코딩 제거
- fallback: ['Claude Code', 'API', 'prompt', 'model']

## DB 상태

- pages: 147개
- changes: 16개 (초기 크롤링 137건 삭제 후 실제 변경만)
- 마이그레이션: 001(초기), 002(sidebar), 003(category), 004(category rename), 005(silent+breaking flags)

## 빌드 상태

- TypeScript: 0 에러
- Tests: 89/89 통과 (8 suites)
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

## 보안 주의사항

- public repo — 모든 커밋 공개
- API 키, 시크릿 절대 커밋 금지 (.env → .gitignore)
- 상세 보안 규칙: CLAUDE.md 참고

## 참고 링크

- 기획서: ./PLAN.md
- 컨벤션: ./CLAUDE.md
- GitHub: https://github.com/thingineeer/claude-docs-tracker
- Production: https://claude-docs-tracker.vercel.app
