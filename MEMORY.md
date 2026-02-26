# MEMORY.md — 프로젝트 메모리

> 이 파일은 Claude Code 에이전트가 프로젝트 컨텍스트를 빠르게 파악하기 위한 메모리 파일입니다.
> 작업 후 반드시 업데이트하세요.

## 프로젝트 정보

- **이름**: claude-docs-tracker
- **설명**: Claude 공식 문서의 일일 변경사항을 추적하는 웹 서비스
- **소유자**: thingineeer
- **GitHub**: https://github.com/thingineeer/claude-docs-tracker
- **상태**: v1.3 전면 리디자인 완료
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
- Test: Jest + ts-jest (79개 테스트)

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
- 네비바: **Home / Calendar / Search** (3개만)
- 활성 페이지 accent 하이라이트
- 모바일: sm(640px) 이하 햄버거 메뉴, 로고 `{ CDT }`
- 푸터: GitHub, RSS, Calendar, Search 보조 링크

### API 라우트
- `/api/calendar` — 월별 캘린더 데이터
- `/api/calendar/[date]` — 일별 상세 (카테고리별 그룹핑)
- `/api/changes` — 검색 (`?q=`)
- `/api/changes/latest` — 최신 변경사항
- `/api/crawl` — 수동 크롤링 트리거
- `/api/cron/crawl` — 크론 크롤링
- `/api/feed/rss` — RSS 피드
- `/api/feed/json` — JSON 피드

## 카테고리 시스템 (4개, v1.3)

| 카테고리 | 매핑 | 색상 | 아이콘 |
|----------|------|------|--------|
| platform-docs | platform: 모든 섹션 + code: overview/quickstart | #3B82F6 | SVG 문서 아이콘 |
| agent-tools | agent-sdk, agents-and-tools, mcp | #10B981 | SVG 로봇 아이콘 |
| claude-code | code.claude.com 기본 | #8B5CF6 | SVG 터미널 아이콘 |
| release-notes | release-notes, changelog | #EC4899 | SVG 스피커 아이콘 |

- 아이콘: `src/lib/category-icons.tsx` (커스텀 SVG, 이모지 없음)
- 분류 로직: `src/lib/categories.ts` (`getCategoryForPage`)
- DB 동기화: `src/db/queries.ts` (`getCategoryFromPage`)

## 홈페이지 데이터 소스 (v1.3)

- Pages Tracked: `getPageCount()` → pages 테이블 COUNT
- Today 스탯: `getTodayStats()` → changes 테이블 직접 집계
- 7일 타임라인: `getRecentChangeCounts()` → changes 테이블 직접 집계
- (daily_reports 테이블 미사용 — 데이터 정합성 위해 changes에서 직접)

## Activity Dot Strip (v1.3)

- 바 차트 → 원형 점 시각화 교체
- 점 크기: 24px(0) ~ 44px(10+), 투명도 스케일
- 오늘 날짜: ring 하이라이트
- 클릭 → `/changes/YYYY-MM-DD` 이동

## DB 상태

- pages: 147개
- changes: 16개 (초기 크롤링 137건 삭제 후 실제 변경만)
- 마이그레이션: 001(초기), 002(sidebar), 003(category)

## 빌드 상태

- TypeScript: 0 에러
- Tests: 79/79 통과 (7 suites)
- 마지막 확인: 2026-02-26

## 보안 주의사항

- public repo — 모든 커밋 공개
- API 키, 시크릿 절대 커밋 금지 (.env → .gitignore)
- 상세 보안 규칙: CLAUDE.md 참고

## 참고 링크

- 기획서: ./PLAN.md
- 컨벤션: ./CLAUDE.md
- GitHub: https://github.com/thingineeer/claude-docs-tracker
- Production: https://claude-docs-tracker.vercel.app
