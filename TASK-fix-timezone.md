# TASK: 타임존 버그 수정 (KST 날짜 불일치)

## 문제

v2.1.61이 GitHub에서 `2026-02-26T22:34:00Z`에 릴리즈됨.
한국 시간(KST)으로는 **2026-02-27 07:34** — 즉 "오늘"인데,
사이트에서는 **2/26(어제)**로 표시됨.

## 근본 원인

`src/crawler/github-releases-crawler.ts` 99번째 줄:

```typescript
const detectedAt = release.published_at.split('T')[0];
// "2026-02-26T22:34:00Z".split('T')[0] → "2026-02-26" (UTC)
// KST(UTC+9)로는 이미 "2026-02-27"
```

UTC 타임스탬프를 `.split('T')[0]`으로 자르기 때문에 KST와 최대 9시간 차이 발생.
같은 문제가 `src/crawler/snapshot-manager.ts` 75번째 줄에도 있음:

```typescript
const today = options?.detectedAt ?? new Date().toISOString().split('T')[0];
// Vercel 서버(UTC)에서 실행되므로 항상 UTC 날짜
```

## 영향 범위

- `src/crawler/github-releases-crawler.ts` — release.published_at → detected_at 변환
- `src/crawler/snapshot-manager.ts` — 기본 날짜 계산
- `src/app/changes/[date]/page.tsx` — "Today" 비교
- `src/app/calendar/page.tsx` → `calendar-view.tsx` — 오늘 날짜 계산
- `src/lib/calendar-utils.ts` — 날짜 유틸리티

## 수정 방법

### Step 1: 타임존 유틸 함수 생성

**새 파일: `src/lib/timezone.ts`**

```typescript
/**
 * 타임존 설정
 * 환경변수로 오버라이드 가능, 기본값 Asia/Seoul
 */
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Seoul';

/**
 * UTC Date를 앱 타임존 기준 YYYY-MM-DD 문자열로 변환
 *
 * 예시:
 *   toLocalDateString("2026-02-26T22:34:00Z")
 *   → Asia/Seoul 기준 "2026-02-27"
 */
export function toLocalDateString(utcDateOrString: Date | string): string {
  const date = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
  // Intl.DateTimeFormat으로 타임존 변환 (Node.js, 브라우저 모두 지원)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale은 YYYY-MM-DD 형식을 반환함
  return formatter.format(date);
}

/**
 * 현재 시각을 앱 타임존 기준 YYYY-MM-DD로 반환
 */
export function getTodayString(): string {
  return toLocalDateString(new Date());
}
```

### Step 2: GitHub 릴리즈 크롤러 수정

**파일: `src/crawler/github-releases-crawler.ts`**

```typescript
// 변경 전 (99번째 줄 부근):
const detectedAt = release.published_at.split('T')[0];

// 변경 후:
import { toLocalDateString } from '@/lib/timezone';
const detectedAt = toLocalDateString(release.published_at);
```

### Step 3: 스냅샷 매니저 수정

**파일: `src/crawler/snapshot-manager.ts`**

```typescript
// 변경 전 (75번째 줄 부근):
const today = options?.detectedAt ?? new Date().toISOString().split('T')[0];

// 변경 후:
import { getTodayString } from '@/lib/timezone';
const today = options?.detectedAt ?? getTodayString();
```

### Step 4: 프론트엔드 "오늘" 비교 수정

**파일: `src/app/changes/[date]/page.tsx`**

```typescript
// 변경 전:
const isToday = date === format(new Date(), 'yyyy-MM-dd');

// 변경 후:
import { getTodayString } from '@/lib/timezone';
const isToday = date === getTodayString();
```

**파일: `src/app/calendar/calendar-view.tsx`**

```typescript
// 변경 전:
const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

// 변경 후:
import { getTodayString } from '@/lib/timezone';
const today = useMemo(() => getTodayString(), []);
```

### Step 5: 환경변수 추가

**파일: `.env.local` (또는 Vercel 환경변수)**

```env
NEXT_PUBLIC_APP_TIMEZONE=Asia/Seoul
```

> `NEXT_PUBLIC_` 접두사로 클라이언트/서버 양쪽에서 사용 가능.
> 기본값이 Asia/Seoul이므로 설정 안 해도 동작함.

### Step 6: 기존 데이터 마이그레이션 (선택)

페이지네이션 수정 후 새로 크롤링된 데이터 중 UTC/KST 날짜가 다른 항목 수정:

```sql
-- 예: v2.1.61의 detected_at을 2026-02-26 → 2026-02-27로 수정
-- 전체 재크롤링이 더 깔끔할 수 있음
```

또는 그냥 다음 크롤링 사이클부터 자동 적용되도록 두기.

---

## 검증 방법

수정 후 아래 케이스 확인:

| GitHub published_at (UTC) | 기대 결과 (KST) | 확인 |
|---------------------------|----------------|------|
| `2026-02-26T22:34:00Z` | 2026-02-27 | v2.1.61 |
| `2026-02-27T01:56:00Z` | 2026-02-27 | v2.1.62 |
| `2026-02-26T00:59:00Z` | 2026-02-26 | v2.1.59 |
| `2026-02-24T15:00:00Z` | 2026-02-25 | UTC 15시 = KST 다음날 0시 |

```typescript
// 단위 테스트
import { toLocalDateString } from '@/lib/timezone';

// KST = UTC+9
expect(toLocalDateString('2026-02-26T22:34:00Z')).toBe('2026-02-27');
expect(toLocalDateString('2026-02-27T01:56:00Z')).toBe('2026-02-27');
expect(toLocalDateString('2026-02-26T00:59:00Z')).toBe('2026-02-26');
expect(toLocalDateString('2026-02-24T15:00:00Z')).toBe('2026-02-25');
```

---

## Claude Code 실행 명령어

```bash
claude --model sonnet "TASK-fix-timezone.md 읽고 Step 1부터 순서대로 구현해줘. 특히 toLocalDateString 함수가 핵심이야. 기존 .split('T')[0] 패턴을 전부 찾아서 timezone 유틸로 교체해줘. 테스트도 작성하고, 타입 체크 + 빌드 성공 확인해줘."
```
