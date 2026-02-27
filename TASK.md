# TASK: 카테고리 재설계 + 검색 버그 수정

> 작업 전 반드시 `CLAUDE.md`와 `MEMORY.md`를 읽어 프로젝트 컨텍스트를 파악하라.

---

## Phase 1: 카테고리 토론 (구현 전 반드시 수행)

현재 4개 카테고리에 UX 문제가 있다. 새로운 분류를 토론으로 확정하라.

### 현재 문제
- Claude Code v2.1.59 같은 changelog가 "Release Notes"로 분류됨 → 사용자는 "Claude Code"에 있을 거라 기대
- "Claude Code" 카테고리에는 CLI 설정 가이드만 남아서, 정작 버전 업데이트가 없음
- Agents & Tools 카테고리의 페이지 수가 너무 적어 독립 카테고리 의미가 약함

### 제안: 3개 카테고리

| 카테고리 | slug | 포함 내용 |
|---|---|---|
| **Platform Docs** | `platform-docs` | API reference, guides, getting started, about-claude, build-with-claude, prompt-engineering, administration, test-and-evaluate, resources, home |
| **Claude Code** | `claude-code` | code.claude.com 전체 (hooks, IDE, CLI, configuration, overview, quickstart 등) + agent-sdk, agents-and-tools, MCP |
| **Changelogs** | `changelogs` | platform.claude.com/release-notes + code.claude.com/changelog |

### 토론 방식
1. **찬성자**: 위 3개 분류의 장점을 논증. Agents & Tools가 Claude Code에 합쳐지는 이유, Changelogs 이름의 직관성.
2. **반증자**: 반대 논거. Agents & Tools 독립 필요성, "Changelogs" vs "Release Notes" vs "Updates" 네이밍, Claude Code에 MCP/Agent SDK가 들어가는 것의 혼란.
3. **결론**: 최종 분류 확정. 카테고리 수, 이름, slug, 색상, 아이콘까지 결정.

토론 시 고려사항:
- 실제 데이터: platform.claude.com ~93페이지, code.claude.com ~54페이지
- agent-tools 현재 7페이지 (agent-sdk 2 + agents-and-tools 약 5), MCP 관련 수 페이지
- 각 카테고리에 의미 있는 수의 페이지가 필요
- 캘린더 dot 색상만으로 변경 종류를 즉시 파악 가능해야 함

---

## Phase 2: 구현 (토론 결론에 따라 에이전트 팀 병렬 실행)

### Task A: 카테고리 시스템 재설계

토론 확정 분류에 따라 수정:

1. **`src/lib/categories.ts`** — 핵심
   - `CategoryType` 타입 변경
   - `CATEGORIES` config (name, icon, color, dotColor, description)
   - `PLATFORM_SECTION_MAP`, `CODE_SECTION_MAP` 재매핑
   - `getCategoryForPage()` 로직 수정
   - `CATEGORY_ORDER` 업데이트

2. **`src/lib/category-icons.tsx`** — 새 카테고리에 맞게 아이콘 수정

3. **`supabase/migrations/004_update_categories.sql`** — 새 마이그레이션
   ```sql
   UPDATE pages SET category = CASE ... END;
   ```

4. **관련 컴포넌트** (타입 참조 업데이트):
   - `src/components/calendar-grid.tsx`
   - `src/components/calendar-view.tsx`
   - `src/components/category-legend.tsx`
   - `src/components/day-detail.tsx`
   - `src/components/change-card.tsx`
   - `src/app/api/calendar/route.ts`
   - `src/app/api/calendar/[date]/route.ts`

### Task B: 검색 버그 수정 (Critical — 3건)

**버그 1: diff_summary가 전부 null**
- `src/crawler/snapshot-manager.ts` 87행, 101행: `diff_summary: null` 하드코딩
- `src/lib/ai-summary.ts`에 `generateChangeSummary()` 함수 존재하지만 **호출되는 곳이 없음**
- 수정: 크롤링 파이프라인에서 변경 감지 후 `generateChangeSummary()`를 호출하여 diff_summary를 채울 것
- 호출 위치: `snapshot-manager.ts`의 `processSnapshot()` 내부, change insert 직전
- CLAUDE_API_KEY 환경변수 없으면 graceful하게 null fallback (try-catch)

**버그 2: 검색 범위 너무 좁음**
- `src/db/queries.ts` 149행의 `searchChanges()`:
  ```typescript
  .or(`diff_summary.ilike.%${q}%,pages.title.ilike.%${q}%`)
  ```
- `pages.url`도 검색 대상에 추가:
  ```typescript
  .or(`diff_summary.ilike.%${q}%,pages.title.ilike.%${q}%,pages.url.ilike.%${q}%`)
  ```

**버그 3: 추천 칩 하드코딩으로 검색 결과 0**
- `src/app/search/page.tsx` 17행: `const SUGGESTION_CHIPS = ['vision', 'streaming', 'tool use', 'MCP']`
- 이 키워드들로 검색하면 결과가 0건 → 사용자 신뢰 훼손
- 해결: 실제 검색 결과가 나오는 키워드로 변경 (예: `['Claude Code', 'Sonnet', 'API', 'prompt caching']`)
- 또는: API에서 최근 변경된 페이지 타이틀 기반으로 동적 생성

### Task C: 검색 UI border 수정

- `src/app/search/page.tsx` 113행:
  ```tsx
  <div className="relative rounded-xl border-2 border-[var(--border)] ...">
  ```
- `border-2` (2px) → `border` (1px)로 변경하여 다른 UI 요소와 통일
- focus 시 accent 색상 변경은 유지

### Task D: 마이그레이션 스크립트

- 새 카테고리에 맞춰 DB의 `pages.category` 값을 일괄 업데이트
- `scripts/run-migration.mjs` 참고하여 동일 패턴으로 `scripts/run-migration-004.mjs` 작성

---

## Phase 3: 검증

1. `npx tsc --noEmit` — TypeScript 에러 0
2. `npm test` — 모든 테스트 통과 (기존 카테고리 관련 테스트 업데이트 필요)
3. 이전 카테고리 잔재 확인:
   ```bash
   grep -r "agent-tools" src/ --include="*.ts" --include="*.tsx"
   ```
   (새 분류에서 사용하지 않는 이전 slug가 남아있으면 안 됨)
4. `MEMORY.md` 업데이트 (새 카테고리 정보, 변경 이력 반영)
5. `CLAUDE.md` 현재 상태 요약 섹션 업데이트

---

## 완료 기준
- [ ] 카테고리 토론 완료, 결론 문서화
- [ ] 새 카테고리로 전체 코드 수정
- [ ] 검색 3건 버그 수정
- [ ] border UI 통일
- [ ] 마이그레이션 스크립트 작성
- [ ] TypeScript 0 에러 + 테스트 통과
- [ ] MEMORY.md, CLAUDE.md 업데이트
