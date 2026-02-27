# TASK: Anthropic News 크롤러 추가 (v3.0 Feature)

## 개요

`https://www.anthropic.com/news` 페이지의 뉴스/블로그 기사를 크롤링하여 Claude Patch Notes 서비스에 통합한다.
기존 GitHub Releases 크롤러와 동일한 아키텍처 패턴을 따르되, Anthropic 공식 뉴스를 새로운 데이터 소스로 추가한다.

---

## 조사 결과 (사전 분석 완료)

### 데이터 소스 구조

- **Newsroom URL**: `https://www.anthropic.com/news`
- **개별 기사 URL 패턴**: `https://www.anthropic.com/news/{slug}` (예: `/news/claude-sonnet-4-6`)
- **Sitemap**: `https://www.anthropic.com/sitemap.xml`에 141개 `/news/` URL 존재
- **RSS 피드**: ❌ 없음 (`/rss/news.xml` 404)
- **기사 카테고리**: `Product`, `Announcements`, `Policy`, `Research` 등
- **기사 구조**: `<article>` 태그 안에 카테고리, 날짜, 제목, 본문 텍스트

### 기사 예시 (Introducing Claude Sonnet 4.6)

```
URL: https://www.anthropic.com/news/claude-sonnet-4-6
카테고리: Product
날짜: 2026년 2월 17일
제목: Introducing Claude Sonnet 4.6
본문: 수천 자의 리치 텍스트 (벤치마크 데이터, 고객 인용, 기술 상세 포함)
```

### 기존 아키텍처 매핑

| 기존 컴포넌트 | 역할 | 뉴스 크롤러 대응 |
|--------------|------|----------------|
| `github-releases-crawler.ts` | GitHub API → CrawlResult | `anthropic-news-crawler.ts` 생성 |
| `sitemap-parser.ts` | sitemap.xml 파싱 | anthropic.com/sitemap.xml에서 /news/ URL 추출 |
| `page-crawler.ts` | HTML → 텍스트 추출 | 기사 본문 추출에 재사용 |
| `categories.ts` | 도메인/섹션 기반 분류 | `anthropic-news` 카테고리 추가 |
| `pipeline.ts` | 전체 파이프라인 오케스트레이션 | `processAnthropicNews()` 단계 추가 |

---

## 구현 계획

### Phase 1: 카테고리 시스템 확장

**파일: `src/lib/categories.ts`**

```typescript
// CategoryType에 'anthropic-news' 추가
export type CategoryType = 'platform-docs' | 'agents-mcp' | 'claude-code' | 'release-notes' | 'anthropic-news';

// 카테고리 정의 추가
'anthropic-news': {
  label: 'Anthropic News',
  color: '#EC4899',  // Pink - 기존 색상과 구분
  description: 'Anthropic 공식 뉴스 및 블로그',
  icon: '📰'
}

// getCategoryForPage() 함수에서 도메인 매핑 추가
if (domain === 'www.anthropic.com' && url.includes('/news/')) {
  return 'anthropic-news';
}
```

### Phase 2: Anthropic News 크롤러 생성

**새 파일: `src/crawler/anthropic-news-crawler.ts`**

핵심 함수 3개:

#### 2-1. `fetchAnthropicNewsUrls()` — Sitemap에서 뉴스 URL 추출

```typescript
export async function fetchAnthropicNewsUrls(): Promise<string[]> {
  // 1. https://www.anthropic.com/sitemap.xml 가져오기
  // 2. /news/ 패턴의 URL만 필터링 (/news 자체는 제외, /news/{slug}만)
  // 3. URL 배열 반환
  //
  // 참고: 현재 141개 뉴스 URL 존재
  // 주의: sitemap.xml에 lastmod가 있으면 활용하여 변경된 기사만 필터링
}
```

#### 2-2. `crawlNewsArticle(url)` — 개별 기사 크롤링

```typescript
export async function crawlNewsArticle(url: string): Promise<CrawlResult> {
  // 1. HTTP GET으로 HTML 가져오기
  // 2. <article> 태그 안에서 추출:
  //    - 카테고리: 첫 번째 텍스트 요소 (예: "Product", "Announcements")
  //    - 날짜: 날짜 형식 텍스트 (예: "2026년 2월 17일" 또는 "Feb 17, 2026")
  //    - 제목: <h1> 또는 주요 헤딩
  //    - 본문: 전체 텍스트 (HTML 태그 제거)
  // 3. CrawlResult 형식으로 반환:
  //    {
  //      url: url,
  //      title: `[Anthropic News] ${title}`,  // 또는 제목에 카테고리 태그
  //      contentText: `${category} | ${date}\n\n${bodyText}`,
  //      sidebarTree: null,
  //      crawledAt: new Date().toISOString(),
  //    }
  //
  // 주의: rate limiting 2초 간격 유지 (config.RATE_LIMIT_MS)
  // 주의: User-Agent 헤더 설정 (config.USER_AGENT)
  // 주의: timeout 30초, retry 3회
}
```

#### 2-3. `processAnthropicNews()` — 전체 뉴스 처리 파이프라인

```typescript
export async function processAnthropicNews(): Promise<ProcessResult[]> {
  // 1. fetchAnthropicNewsUrls()로 URL 목록 가져오기
  // 2. 각 URL에 대해 crawlNewsArticle() 호출 (rate limiting 적용)
  // 3. 각 CrawlResult를 processSnapshot()으로 처리
  //    - 첫 크롤링: change_type = 'added' (새 기사)
  //    - 내용 변경: change_type = 'modified' (기사 수정)
  //    - hash 동일: 'unchanged' (스킵)
  // 4. ProcessResult[] 반환
  //
  // 최적화:
  //   - 첫 실행 시 전체 141개 크롤링 (초기 시드)
  //   - 이후 실행 시 sitemap lastmod 비교로 변경된 것만 크롤링
  //   - 또는 DB의 last_crawled_at과 비교하여 최근 7일 기사만 재크롤링
}
```

### Phase 3: 파이프라인 통합

**파일: `src/pipeline.ts`**

```typescript
// runPipeline() 함수에 Anthropic News 단계 추가

export async function runPipeline(options: PipelineOptions) {
  // ... 기존 sitemap 크롤링 ...

  // ... 기존 GitHub releases 처리 ...

  // [NEW] Anthropic News 처리
  if (!options.skipAnthropicNews) {
    console.log('Processing Anthropic News...');
    const newsResults = await processAnthropicNews();
    results.push(...newsResults);
    summary.anthropicNews = newsResults.filter(r => r.changeType !== 'unchanged').length;
  }

  // ... 기존 daily report 생성 ...
}
```

**PipelineOptions에 추가:**
```typescript
interface PipelineOptions {
  // ... 기존 옵션 ...
  skipAnthropicNews?: boolean;  // Anthropic News 크롤링 스킵
}
```

### Phase 4: 검색 개선 (함께 수정)

**파일: `src/db/queries.ts`**

현재 검색이 완전히 깨져있으므로 이 기회에 함께 수정:

```typescript
export async function searchChanges(query: string) {
  // 기존: diff_summary + pages.title만 검색 (대부분 null이라 0건)
  //
  // 수정:
  // 1. pages.title ILIKE 검색 유지
  // 2. diff_html에서도 텍스트 검색 추가 (HTML 태그 제거 후)
  // 3. snapshots.content_text에서도 검색 추가
  // 4. OR 조건으로 결합
  //
  // PostgreSQL Full-Text Search 활용:
  // .or(`diff_summary.ilike.%${query}%,diff_html.ilike.%${query}%`)
  // + pages.title.ilike 조인
  //
  // 장기적: tsvector 인덱스 생성으로 성능 최적화
}
```

### Phase 5: UI 업데이트

**파일: `src/app/page.tsx` (홈페이지)**

```
- 카테고리 필터에 'Anthropic News' 추가 (핑크색 도트)
- 홈페이지 통계에 anthropic-news 카운트 포함
```

**파일: `src/app/search/page.tsx`**

```
- Suggestion chips에 뉴스 관련 키워드 추가: "Sonnet 4.6", "Series G", "Safety"
- 검색 결과에 anthropic-news 카테고리 뱃지 표시
```

**파일: `src/app/changes/[date]/page.tsx`**

```
- 일별 변경 페이지에 Anthropic News 섹션 추가
- 기존: New Pages / Modified Pages
- 추가: Anthropic News (별도 섹션 또는 카테고리 필터)
```

### Phase 6: 초기 데이터 시딩

```bash
# 첫 실행: 전체 141개 뉴스 기사 크롤링
# API 엔드포인트로 수동 트리거 또는 CLI 실행

curl -X POST https://claude-docs-tracker.vercel.app/api/cron/crawl \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"anthropicNewsOnly": true}'
```

또는 별도 시드 스크립트:

```typescript
// scripts/seed-anthropic-news.ts
import { processAnthropicNews } from '../src/crawler/anthropic-news-crawler';

async function main() {
  console.log('Seeding Anthropic News articles...');
  const results = await processAnthropicNews();
  console.log(`Processed ${results.length} articles`);
  console.log(`New: ${results.filter(r => r.changeType === 'added').length}`);
}
main();
```

---

## 주의사항

### 크롤링 윤리
- `robots.txt` 확인: `https://www.anthropic.com/robots.txt` 체크
- Rate limiting: 요청 간 최소 2초 대기 (기존 config 따름)
- User-Agent 명시: `claude-docs-tracker/1.0`

### 성능 고려
- 141개 기사 전체 크롤링 시 최소 282초 (4.7분) 소요
- Vercel serverless 함수 timeout (10초 free, 60초 pro) 고려
- **해결책**: 배치 처리 (1회 크롤에 최신 20개만, 나머지는 점진적)
- 또는 sitemap lastmod 활용하여 변경된 것만 크롤링

### Vercel Timeout 대응
```typescript
// 옵션 A: 최신 기사만 크롤링 (기본)
const RECENT_NEWS_LIMIT = 20;  // 최근 20개만

// 옵션 B: 배치 분할
// 1차 cron: 1-50번 기사
// 2차 cron: 51-100번 기사
// 3차 cron: 101-141번 기사

// 옵션 C: 별도 cron 스케줄
// vercel.json에 추가:
{
  "path": "/api/cron/crawl-news",
  "schedule": "0 */6 * * *"  // 6시간마다
}
```

### 기사 업데이트 감지
- Anthropic은 기사를 수정할 수 있음 (오타, 데이터 업데이트 등)
- content_hash 비교로 변경 감지 → change_type: 'modified'
- diff_html에 변경 전후 차이점 표시

---

## 실행 순서 (Claude Code CLI)

```
1단계: categories.ts에 'anthropic-news' 카테고리 추가
2단계: anthropic-news-crawler.ts 생성 (fetchUrls + crawlArticle + process)
3단계: pipeline.ts에 processAnthropicNews() 통합
4단계: queries.ts의 searchChanges() 검색 범위 확장 (diff_html 추가)
5단계: UI 컴포넌트 업데이트 (카테고리 필터, 검색 칩, 뱃지)
6단계: vercel.json에 뉴스 전용 cron 추가 (선택적)
7단계: 초기 데이터 시딩 스크립트 실행
8단계: 배포 후 검증 (검색에서 "Sonnet 4.6" 검색 가능한지 확인)
```

---

## Claude Code 실행 명령어

### 방법 1: 대화형 (컨텍스트 관리 가능, 권장)

```bash
cd ~/Desktop/claude-docs-tracker
claude --model sonnet
```

진입 후 아래를 입력:

```
TASK-anthropic-news-crawler.md 읽고 Phase 1부터 순서대로 구현해줘.
기존 github-releases-crawler.ts 패턴 참고해서 만들어줘.
Phase 하나 끝날 때마다 /compact 해서 컨텍스트 정리하고 다음 Phase 진행해줘.
타입 체크 + 빌드 성공까지 확인해줘.
```

> **컨텍스트 초과 방지**: Phase별로 `/compact` 명령으로 컨텍스트를 압축하면
> 긴 작업에서도 토큰 한도에 걸리지 않습니다.
> Claude Code가 자동으로 이전 작업을 요약하고 이어서 진행합니다.

### 방법 2: Phase별 분할 실행 (가장 안전)

컨텍스트가 부족할 것 같으면 Phase를 나눠서 실행:

```bash
# Phase 1-2: 카테고리 + 크롤러 생성
claude --model sonnet "TASK-anthropic-news-crawler.md 읽고 Phase 1, 2만 구현해줘. github-releases-crawler.ts 패턴 참고. 타입 체크 확인."

# Phase 3-4: 파이프라인 통합 + 검색 수정
claude --model sonnet "TASK-anthropic-news-crawler.md 읽고 Phase 3, 4만 구현해줘. 이전 Phase에서 만든 anthropic-news-crawler.ts 활용. 타입 체크 확인."

# Phase 5-6: UI + 시딩
claude --model sonnet "TASK-anthropic-news-crawler.md 읽고 Phase 5, 6만 구현해줘. 빌드 성공까지 확인."
```

### 방법 3: 원샷 (짧은 작업에만)

```bash
claude --model sonnet "TASK-anthropic-news-crawler.md 읽고 Phase 1부터 6까지 전부 구현해줘. 기존 github-releases-crawler.ts 패턴 참고. 타입 체크 + 빌드 성공 확인."
```
