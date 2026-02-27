# TASK: v3.0 — 경쟁사 분석 기반 성장 기능 구현

> 작업 전 반드시 `CLAUDE.md`와 `MEMORY.md`를 읽어 프로젝트 컨텍스트를 파악하라.
> 현재 v2.1 상태이며, 카테고리 재설계 + 검색 버그 수정 + diff_summary AI 연결이 완료되어 있다.

---

## 배경: 경쟁사 Releasebot 분석

Releasebot(releasebot.io)은 $59/월 유료 서비스로 300개 벤더의 릴리즈 노트를 수집한다.
Anthropic만 458건의 릴리즈 노트가 있고, Claude Code(237건), Claude Developer Platform(103건) 등으로 세분화되어 있다.

**Releasebot의 강점**: 넓은 커버리지, RSS/Email/API/CSV/MCP/Slack/n8n/Zapier 등 다양한 접근 방식, vendor→product→release 관계형 데이터 구조

**Releasebot이 못 하는 것 (우리의 무기)**:
- 릴리즈 노트 없이 슬쩍 바뀐 문서 변경 감지 불가능
- 실제 어떤 문장이 바뀌었는지 line diff 제공 불가
- 사이드바 구조 변경 감지 불가
- 즉, Releasebot은 "공식 발표만" 수집, 우리는 "실제 변경"을 수집

이 차별점을 살려서 다음 기능들을 구현한다.

---

## Phase 1: 토론 (구현 전)

다음 기능 목록에 대해 찬성자/반증자 토론을 진행하라.
기술적 타당성, 구현 복잡도, 사용자 가치, 우선순위를 논의한 뒤 최종 구현 목록을 확정하라.

---

## Phase 2: 구현 (토론 결론에 따라 에이전트 팀 병렬 실행)

### Task A: Silent Changes 감지 & 태깅

**개념**: 릴리즈 노트에 공식 발표 없이 슬쩍 바뀐 문서를 "Silent Change"로 태깅한다.
이게 Releasebot과의 핵심 차별점이다.

**구현**:
1. `src/db/types.ts`에 change 레코드에 `is_silent` boolean 필드 추가 (또는 기존 change_type 활용)
2. `supabase/migrations/005_add_silent_flag.sql` 생성
3. `src/crawler/snapshot-manager.ts`에서 변경 감지 시:
   - 같은 날짜에 해당 페이지가 릴리즈 노트 카테고리가 아닌데 변경됐으면 → `is_silent = true`
   - 릴리즈 노트에 언급된 페이지면 → `is_silent = false`
   - 심플하게: `release-notes` 카테고리가 아닌 change는 모두 silent로 간주해도 됨
4. UI: change-card에 "🔇 Silent Change" 뱃지 표시 (릴리즈 노트에 없는 변경)
5. 홈페이지, 검색, 캘린더에서 Silent Changes 필터링 가능

### Task B: Breaking Change 자동 감지

**개념**: diff에서 "deprecated", "removed", "breaking", "no longer", "will be removed" 키워드를 자동 감지하여 경고 태그 부여

**구현**:
1. `src/lib/breaking-detector.ts` 신규 생성
   ```typescript
   const BREAKING_KEYWORDS = [
     'deprecated', 'removed', 'breaking', 'no longer supported',
     'will be removed', 'end of life', 'sunset', 'discontinued',
     'migration required', 'incompatible', 'retired'
   ];

   export function detectBreakingChange(diffText: string): {
     isBreaking: boolean;
     matchedKeywords: string[];
   }
   ```
2. `snapshot-manager.ts`에서 변경 감지 후 `detectBreakingChange()` 호출
3. `changes` 테이블에 `is_breaking` boolean 필드 추가 (migration 005에 포함)
4. UI: change-card에 빨간색 "⚠️ Breaking" 뱃지, 캘린더에서 빨간 dot 표시
5. 홈페이지에 "Breaking Changes" 섹션 또는 필터 추가

### Task C: 주간 다이제스트 자동 생성

**개념**: 매주 월요일 "이번 주 Claude 문서에서 바뀐 것" 요약을 자동 생성

**구현**:
1. `src/lib/weekly-digest.ts` 신규 생성
   - 지난 7일간의 changes를 조회
   - Claude Haiku API로 한국어+영어 주간 요약 생성
   - Breaking changes 하이라이트
   - Silent changes 개수 표시
2. `src/app/api/cron/digest/route.ts` — 주간 크론 엔드포인트
3. `src/app/digest/page.tsx` — 주간 다이제스트 페이지 (또는 홈페이지에 통합)
4. `vercel.json`에 주간 크론 추가
5. digest 데이터를 `daily_reports` 테이블 활용하거나 새 테이블 생성

### Task D: Public API 정비

**개념**: Releasebot처럼 외부에서 구조화된 데이터에 접근할 수 있는 공개 API

**구현**:
1. `src/app/api/v1/changes/route.ts` — 변경사항 조회 API
   ```
   GET /api/v1/changes?from=2026-02-20&to=2026-02-27&category=claude-code
   ```
   응답:
   ```json
   {
     "changes": [{
       "id": "...",
       "title": "Claude Code v2.1.59",
       "url": "https://code.claude.com/...",
       "change_type": "modified",
       "category": "release-notes",
       "is_silent": false,
       "is_breaking": false,
       "summary": "...",
       "detected_at": "2026-02-26",
       "diff_url": "/changes/2026-02-26#change-id"
     }],
     "meta": { "total": 5, "from": "2026-02-20", "to": "2026-02-27" }
   }
   ```
2. `src/app/api/v1/pages/route.ts` — 추적 중인 페이지 목록
3. `src/app/api/v1/stats/route.ts` — 통계 (총 페이지수, 변경수 등)
4. 모든 v1 API에 CORS 헤더, rate limiting 고려
5. API 문서 페이지: `src/app/api-docs/page.tsx` (간단한 사용법 설명)

### Task E: Webhook & 알림 시스템 강화

**개념**: Breaking change 감지 시 자동 알림

**구현**:
1. `src/lib/notifications.ts` 확장 (이미 존재하는 파일)
   - Discord webhook: breaking change 감지 시 빨간 embed
   - Slack webhook: 동일
2. `src/app/api/cron/crawl/route.ts`에서 크롤링 완료 후:
   - breaking change가 있으면 즉시 알림
   - 일반 변경은 일일 다이제스트로
3. 환경변수: `WEBHOOK_DISCORD_URL`, `WEBHOOK_SLACK_URL` (이미 .env.example에 있음)

### Task F: 검색 추천 칩 동적 생성

**개념**: 하드코딩된 추천 칩을 실제 데이터 기반으로 변경

**구현**:
1. `src/db/queries.ts`에 `getPopularSearchTerms()` 추가
   - 최근 30일 변경된 페이지의 title에서 자주 등장하는 키워드 추출
   - 또는 간단하게: 최근 변경된 페이지 title 5개를 추천 칩으로 사용
2. `src/app/search/page.tsx`에서 API 호출하여 동적 칩 렌더링
3. 현재 하드코딩된 `SUGGESTION_CHIPS` 제거

### Task G: README.md 리뉴얼

**개념**: 오픈소스 프로젝트로서 매력적인 README로 리뉴얼

**구현**:
1. README.md에 포함할 내용:
   - 한 줄 설명 + 뱃지 (TypeScript, MIT, Vercel)
   - **"Why not Releasebot?"** 또는 **"What makes this different?"** 섹션
     - "Releasebot tracks announcements. We track actual changes."
     - "We detect silent changes that never appear in release notes."
     - "Line-by-line diffs, not just summaries."
   - 스크린샷 (홈, 캘린더, diff view)
   - Features 목록 (Silent Change 감지, Breaking Change 경고, 주간 다이제스트, Public API)
   - Quick Start (로컬 개발 설정)
   - API 사용법 간단 예시
   - Contributing 가이드
   - License
2. 스크린샷은 나중에 추가할 수 있으니 placeholder로 두어도 됨

---

## Phase 3: 검증

1. `npx tsc --noEmit` — TypeScript 에러 0
2. `npm test` — 모든 테스트 통과 (새 기능에 대한 테스트도 추가)
3. 새 API 엔드포인트 동작 확인
4. 마이그레이션 스크립트 동작 확인
5. MEMORY.md, CLAUDE.md 업데이트 (v3.0 반영)
6. TASK.md 삭제 (작업 완료 후)

---

## 완료 기준
- [ ] Silent Changes 태깅 구현
- [ ] Breaking Change 자동 감지
- [ ] 주간 다이제스트 자동 생성
- [ ] Public API v1 (changes, pages, stats)
- [ ] Webhook 알림 강화 (breaking change)
- [ ] 검색 추천 칩 동적화
- [ ] README.md 리뉴얼
- [ ] TypeScript 0 에러 + 테스트 통과
- [ ] MEMORY.md, CLAUDE.md 업데이트
