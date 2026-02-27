# CLAUDE.md — claude-docs-tracker 프로젝트 규칙

이 파일은 Claude Code 에이전트가 이 프로젝트에서 작업할 때 반드시 따라야 할 규칙입니다.

## 커밋 컨벤션

**Conventional Commits** 형식을 사용합니다. Co-Authored-By는 사용하지 않습니다.

```
<type>: <subject>
```

### 타입 목록

| 타입 | 용도 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 (README, PLAN 등) |
| `style` | 코드 포맷팅 (동작 변경 없음) |
| `refactor` | 리팩토링 (기능 변경 없음) |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 의존성 등 기타 |
| `ci` | CI/CD 설정 변경 |
| `perf` | 성능 개선 |

### 커밋 메시지 규칙

- 영어로 작성 (한국어 금지)
- 소문자로 시작, 마침표 없음
- 현재형 사용 (add, not added)
- 50자 이내 제목
- 필요 시 본문에 상세 설명 (한 줄 비우고 작성)

### 예시

```
feat: add daily diff crawler pipeline
fix: handle empty sitemap response gracefully
docs: update README with local dev guide
chore: configure vercel cron job schedule
test: add unit tests for diff-generator
```

## 보안 규칙 (CRITICAL)

이 프로젝트는 **처음부터 public 오픈소스**입니다. 모든 커밋은 전세계에 공개됩니다.

### 절대 커밋하면 안 되는 것

- API 키, 시크릿, 토큰 (Supabase, Claude API, Vercel, CRON_SECRET 등)
- `.env`, `.env.local`, `.env.production` 파일
- 개인 정보 (이메일, 이름, IP 등)
- 데이터베이스 연결 문자열
- 쿠키, 세션 정보
- 크롤링으로 수집한 원본 데이터 (snapshots, raw HTML)

### 환경변수 관리

- 모든 시크릿은 환경변수로 관리
- `.env.example`에는 키 이름만 기재 (값은 비워두기)
- 코드에 하드코딩 절대 금지

```
# .env.example (이렇게만)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLAUDE_API_KEY=
CRON_SECRET=
WEBHOOK_DISCORD_URL=
WEBHOOK_SLACK_URL=
```

### 커밋 전 체크리스트

1. `git diff --staged`로 시크릿 포함 여부 확인
2. `.env*` 파일이 staged에 없는지 확인
3. 하드코딩된 URL에 토큰/키가 없는지 확인

## 코드 스타일

- TypeScript strict mode
- 함수형 컴포넌트 + React Hooks
- named export 선호 (default export는 page.tsx만)
- 파일명: kebab-case (예: `diff-generator.ts`)
- 컴포넌트명: PascalCase (예: `DiffView.tsx`)
- 유틸/라이브러리: camelCase (예: `formatDate`)

## 브랜치 전략

- `main`: 프로덕션 (직접 push 금지, PR만)
- `dev`: 개발 브랜치
- `feat/*`: 기능 개발 (예: `feat/crawler-engine`)
- `fix/*`: 버그 수정
- `docs/*`: 문서 작업

## 디렉토리 구조

```
claude-docs-tracker/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   │   ├── api/          # API 라우트 (calendar, changes, crawl, cron, feed)
│   │   ├── calendar/     # 캘린더 페이지
│   │   ├── changes/      # 일별 변경 페이지 ([date] 동적)
│   │   ├── search/       # 검색 페이지
│   │   └── page.tsx      # 홈 (스탯 + Dot Strip + Recent Changes)
│   ├── components/       # 공유 컴포넌트
│   ├── crawler/          # 크롤링 엔진
│   ├── db/               # DB 클라이언트 & 쿼리
│   └── lib/              # 유틸리티 (categories, category-icons, decode-entities, format-change-summary)
├── scripts/              # 크롤링/마이그레이션 스크립트
├── supabase/
│   └── migrations/       # DB 마이그레이션 (001~003)
├── tests/                # 테스트 (79개, Jest)
├── public/               # 정적 파일
├── .env.example          # 환경변수 템플릿
├── CLAUDE.md             # 이 파일
├── MEMORY.md             # 프로젝트 메모리
├── PLAN.md               # 기획서
└── README.md             # 프로젝트 소개
```

## 현재 상태 요약 (2026-02-27)

- 네비: Home / Calendar / Search (3개)
- 카테고리: platform-docs / claude-code / agents-mcp / release-notes (4개, SVG 아이콘)
- 홈페이지: 인라인 스탯 + Activity Dot Strip + Recent Changes
- DB: 147 pages, 16 changes (초기 크롤링 데이터 삭제 후 실제 변경만)
- 삭제된 페이지: /sidebar-diff, /changes (redirect)
- 모든 스탯은 daily_reports 미사용, changes 테이블 직접 집계
- 크롤러: diff_summary에 AI 요약 자동 생성 (CLAUDE_API_KEY 없으면 graceful null fallback)

## 작업 시작 전 필수 확인

1. `.gitignore`가 제대로 설정되어 있는지 확인
2. `.env*` 파일이 ignore 되어 있는지 확인
3. `MEMORY.md`를 읽어 프로젝트 현재 상태 파악
4. 작업 완료 후 `MEMORY.md` 업데이트
