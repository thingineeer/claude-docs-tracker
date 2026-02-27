# TASK: 타임존 버그 수정 + Anthropic News 크롤러 추가 + 검색 수정

> **실행 규칙**: 아래 작업을 Part 1 → Part 2 → Part 3 순서대로 구현하라.
> 각 Part 완료 후 반드시 `/compact` 실행하여 컨텍스트를 정리하고 다음 Part로 넘어가라.
> 모든 Part 완료 후 `npx tsc --noEmit && npm run build` 로 타입 체크 + 빌드 성공을 확인하라.

---

## Part 1: 타임존 버그 수정 (KST 날짜 불일치)

### 문제

`github-releases-crawler.ts`에서 `release.published_at.split('T')[0]`으로 UTC 날짜만 추출하여,
한국 사용자에게 릴리즈 날짜가 하루 밀려 보이는 버그.

예: v2.1.61 → GitHub `2026-02-26T22:34:00Z` → KST 2/27인데 사이트에 2/26으로 표시

### 수정

#### 1-1. `src/lib/timezone.ts` 생성

```typescript
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Seoul';

export function toLocalDateString(utcDateOrString: Date | string): string {
  const date = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function getTodayString(): string {
  return toLocalDateString(new Date());
}
```

#### 1-2. 프로젝트 전체에서 `.split('T')[0]` 패턴 찾아서 교체

- `src/crawler/github-releases-crawler.ts` → `toLocalDateString(release.published_at)`
- `src/crawler/snapshot-manager.ts` → `getTodayString()`

#### 1-3. 프론트엔드 "오늘" 비교도 교체

- `src/app/changes/[date]/page.tsx`의 `format(new Date(), 'yyyy-MM-dd')` → `getTodayString()`
- `src/app/calendar/calendar-view.tsx`의 `format(new Date(), 'yyyy-MM-dd')` → `getTodayString()`

#### 1-4. 테스트 작성

```typescript
// KST = UTC+9
expect(toLocalDateString('2026-02-26T22:34:00Z')).toBe('2026-02-27');
expect(toLocalDateString('2026-02-27T01:56:00Z')).toBe('2026-02-27');
expect(toLocalDateString('2026-02-26T00:59:00Z')).toBe('2026-02-26');
expect(toLocalDateString('2026-02-24T15:00:00Z')).toBe('2026-02-25');
```

#### 1-5. `.env.local`에 추가 (기본값이 Asia/Seoul이라 선택사항)

```
NEXT_PUBLIC_APP_TIMEZONE=Asia/Seoul
```

**Part 1 완료 후 `/compact` 실행**

---

## Part 2: Anthropic News 크롤러 추가

### 데이터 소스 정보

- Sitemap: `https://www.anthropic.com/sitemap.xml` → `/news/{slug}` URL 141개
- RSS 없음, HTML 스크래핑 필요
- 기사 구조: `<article>` 안에 카테고리(Product/Announcements/Policy), 날짜, 제목, 본문
- 개별 기사 URL 예시: `https://www.anthropic.com/news/claude-sonnet-4-6`

### 2-1. `src/lib/categories.ts` — 카테고리 추가

```typescript
// CategoryType에 'anthropic-news' 추가
export type CategoryType = '...' | 'anthropic-news';

// 카테고리 정의
'anthropic-news': {
  label: 'Anthropic News',
  color: '#EC4899',
  description: 'Anthropic 공식 뉴스 및 블로그',
  icon: '📰'
}

// getCategoryForPage()에서 도메인 매핑
if (domain === 'www.anthropic.com' && url.includes('/news/')) return 'anthropic-news';
```

### 2-2. `src/crawler/anthropic-news-crawler.ts` — 새 파일 생성

`github-releases-crawler.ts` 패턴을 그대로 따라서 3개 함수 구현:

1. **`fetchAnthropicNewsUrls()`**: anthropic.com/sitemap.xml에서 `/news/{slug}` URL 추출
2. **`crawlNewsArticle(url)`**: 개별 기사 HTML → CrawlResult 변환 (`<article>` 파싱)
3. **`processAnthropicNews()`**: URL 목록 → 크롤링 → processSnapshot() → ProcessResult[] 반환

주의사항:
- Rate limiting: 2초 간격 (config.RATE_LIMIT_MS)
- Vercel timeout 대응: 최신 20개만 크롤링 (`RECENT_NEWS_LIMIT = 20`)
- 첫 실행 시 전체 시딩은 별도 스크립트로

### 2-3. `src/crawler/pipeline.ts` — 통합

`runPipeline()`에 `processAnthropicNews()` 호출 추가.
`PipelineOptions`에 `skipAnthropicNews?: boolean` 추가.

### 2-4. UI 업데이트

- 홈페이지 카테고리 필터에 'Anthropic News' 추가
- 검색 suggestion chips에 "Sonnet 4.6", "Safety" 등 추가
- 일별 변경 페이지에서 anthropic-news 카테고리 표시

**Part 2 완료 후 `/compact` 실행**

---

## Part 3: 검색 수정

### 문제

`src/db/queries.ts`의 `searchChanges()`가 `diff_summary`(대부분 null) + `pages.title`만 검색.
"MCP", "sonnet", "Claude" 등 모든 검색이 0건 반환.

### 수정

#### 3-1. `searchChanges()` 검색 범위 확장

```typescript
// 기존: diff_summary.ilike + pages.title.ilike만
// 수정: diff_html도 검색 범위에 포함
// .or(`diff_summary.ilike.%${query}%,diff_html.ilike.%${query}%`)
// + pages inner join으로 title 검색
```

#### 3-2. 검색 결과가 나오는지 확인

수정 후 아래 검색어로 결과가 1건 이상 나와야 함:
- "MCP" → v2.1.59 등 다수
- "Claude" → 거의 모든 릴리즈
- "Sonnet" → 모델 관련 릴리즈

**Part 3 완료 후 최종 `npx tsc --noEmit && npm run build` 실행하여 빌드 성공 확인**

---

## Claude Code 실행 명령어

```bash
cd ~/Desktop/claude-docs-tracker
claude --model sonnet
```

```
TASK.md 읽고 Part 1부터 Part 3까지 순서대로 전부 구현해줘.
기존 github-releases-crawler.ts 패턴 참고.
각 Part 끝날 때마다 /compact 해서 컨텍스트 정리하고 다음 Part 진행해줘.
최종 타입 체크 + 빌드 성공까지 확인해줘.
```
