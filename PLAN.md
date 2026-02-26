# claude-docs-tracker — 시장조사 & 구현 계획서

## 1. 프로젝트 개요

**프로젝트명**: claude-docs-tracker
**GitHub**: github.com/{username}/claude-docs-tracker (오픈소스 공개 예정)
**목표**: Claude 공식 문서(platform.claude.com/docs)의 변경 사항을 매일 자동으로 감지하고, 누구나 한눈에 볼 수 있게 보여주는 웹 서비스
**배포**: Vercel → 추후 오픈소스 전환
**핵심 차별점**: "릴리즈 노트"가 아닌 "문서 자체의 실제 변경"을 추적

---

## 2. 시장조사 — 경쟁사 분석

### 2-1. Releasebot.io

| 항목 | 내용 |
|------|------|
| URL | releasebot.io/updates/anthropic |
| 추적 대상 | Claude, Claude Developer Platform, Claude Apps, Claude Code (4개 제품) |
| 데이터 소스 | 공식 릴리즈 노트 페이지만 스크래핑 |
| 업데이트 빈도 | 릴리즈 노트 발행 시 |
| 제공 정보 | 제품명, 버전(Code만), 릴리즈 요약 1-2줄, 원본 링크 |
| UI | 타임라인 형태의 단순 리스트 |

**Releasebot의 한계점:**

1. **릴리즈 노트만 추적** — 문서 내용 변경(새 페이지 추가, 기존 내용 수정)은 감지 못함
2. **변경 diff 없음** — "뭐가 추가됐다" 정도만 알려주고, 실제로 어떤 내용이 바뀌었는지 보여주지 않음
3. **문서 구조 변경 미추적** — 사이드바에 새 메뉴가 생겨도 감지 못함 (예: Slack 연동, GitLab CI/CD 가이드 추가)
4. **검색/필터 부재** — 카테고리별 필터링만 가능, 키워드 검색 없음
5. **알림 기능 제한적** — 이메일 구독만 가능
6. **한국어 미지원** — 영어 요약만 제공

### 2-2. 기타 유사 서비스

| 서비스 | 특징 | 한계 |
|--------|------|------|
| ClaudeLog (claudelog.com) | Claude Code 체인지로그 정리 | Code만 다룸, 문서 변경 미추적 |
| ClaudeFast (claudefa.st) | Claude Code 버전 히스토리 | Code만 다룸 |
| Anthropic 공식 릴리즈 노트 | 가장 정확 | 문서 내용 변경은 별도 안내 없음 |

### 2-3. 결론

**"Claude 공식 문서의 실제 변경사항을 diff 수준으로 보여주는 서비스는 현재 존재하지 않는다."**

---

## 3. 시장조사 — Claude 공식 문서 구조 분석

### 3-1. 문서 호스팅 현황

| 도메인 | 용도 | 비고 |
|--------|------|------|
| platform.claude.com/docs | API/개발자 문서 (메인) | docs.anthropic.com에서 리다이렉트 |
| code.claude.com/docs | Claude Code 전용 문서 | 별도 도메인 |
| support.claude.com | Claude Apps 도움말/릴리즈 노트 | Help Center |
| docs.claude.com | → platform.claude.com으로 리다이렉트 | 2025.11 이전 메인 |

### 3-2. 릴리즈 노트 구조 (platform.claude.com/docs/en/release-notes/overview)

**형식:**
- 날짜별 (### February 19, 2026) 그룹핑
- 각 항목은 bullet point로 기능 설명
- 관련 문서 링크 포함
- 태그/카테고리 구분 없음 (단순 시간순)

**릴리즈 노트가 다루는 것:**
- 새 모델 출시 (Opus 4.6, Sonnet 4.6 등)
- API 기능 GA/Beta 전환
- SDK 릴리즈
- 모델 deprecation/retirement
- 콘솔 기능 업데이트

**릴리즈 노트가 다루지 않는 것:**
- 문서 페이지 추가/삭제 (예: Slack 연동 가이드 추가)
- 기존 문서 내용 수정 (예: 코드 예제 변경)
- 사이드바 구조 변경
- 오타 수정, 문구 개선

### 3-3. 문서 사이드바 (크롤링 대상)

현재 확인된 주요 섹션:

```
platform.claude.com/docs
├── Getting Started
├── About Claude
│   ├── Models (Overview, Pricing, Deprecations, What's New)
│   └── ...
├── Build with Claude
│   ├── Extended Thinking / Adaptive Thinking
│   ├── Prompt Caching
│   ├── Structured Outputs
│   ├── Context Editing / Compaction
│   ├── Data Residency ← 최근 추가
│   ├── Fast Mode ← 최근 추가
│   └── ...
├── Agents and Tools
│   ├── Tool Use (Web Search, Web Fetch, Code Execution, Memory, Tool Search...)
│   ├── Agent Skills
│   ├── MCP Connector
│   └── ...
├── API Reference
├── SDKs (Python, TypeScript, Java, Go, Ruby, C#, PHP)
├── Release Notes
└── Resources

code.claude.com/docs
├── Overview
├── Getting Started
├── VS Code / JetBrains
├── GitHub Actions ← 비교적 최근
├── GitLab CI/CD ← 최근 추가 (유저가 발견)
├── Slack ← 최근 추가 (유저가 발견)
├── Amazon Bedrock / Google Vertex AI
├── Hooks / Memory / MCP
├── Analytics
└── ...
```

### 3-4. 크롤링 가능성

| 방법 | 가능 여부 | 비고 |
|------|----------|------|
| Sitemap (docs.claude.com/sitemap.xml) | ⚠️ 401 에러 | 인증 필요할 수 있음 |
| code.claude.com/docs 사이트맵 | ✅ 존재 확인 | code.claude.com/docs/sitemap.xml |
| claude_code_docs_map.md | ✅ 공개 | 전체 문서 목록 + 요약 제공 |
| HTML 직접 크롤링 | ✅ 가능 | JS 렌더링 필요할 수 있음 (Puppeteer/Playwright) |
| GitHub 소스 | ❌ 비공개 | 문서 소스코드 오픈소스 아님 |

**추천 크롤링 전략:**
1. **1순위**: sitemap.xml 파싱 → 전체 URL 목록 확보
2. **2순위**: 각 페이지 HTML 크롤링 (Playwright로 JS 렌더링 포함)
3. **보조**: claude_code_docs_map.md 활용 (Claude Code 문서)

---

## 4. 차별화 전략 — Releasebot에 없는 것

### 핵심 차별화 기능

| # | 기능 | 설명 | Releasebot |
|---|------|------|------------|
| 1 | **문서 페이지 Diff** | 각 페이지의 텍스트 변경을 git diff 스타일로 표시 | ❌ 없음 |
| 2 | **사이드바 구조 변경 감지** | 새 메뉴 추가/삭제/이동 감지 | ❌ 없음 |
| 3 | **새 페이지 알림** | "GitLab CI/CD 가이드가 추가되었습니다" | ❌ 없음 |
| 4 | **AI 요약** | 변경사항을 Claude로 자연어 요약 | ❌ 없음 |
| 5 | **카테고리별 필터** | API, Claude Code, SDK, Models 등 | 제한적 |
| 6 | **RSS/Webhook** | 개발자 친화적 알림 | ❌ 없음 |
| 7 | **한국어 지원** | 변경 요약 한국어 제공 | ❌ 없음 |
| 8 | **전체 히스토리** | 특정 페이지의 변경 이력 타임라인 | ❌ 없음 |

### 킬러 피처 (MVP에 반드시 포함)

1. **Daily Diff Dashboard** — 오늘 바뀐 것들을 한 페이지에서 확인
2. **New Pages Alert** — 새로 추가된 문서 페이지 하이라이트
3. **Sidebar Tree Diff** — 문서 목차 구조 변경 시각화

---

## 5. 기술 스택 (권장)

| 영역 | 기술 | 이유 |
|------|------|------|
| **Framework** | Next.js 14+ (App Router) | Vercel 네이티브, SSG/ISR 지원 |
| **Language** | TypeScript | 타입 안전성 |
| **Styling** | Tailwind CSS | 빠른 개발, 반응형 |
| **DB** | Supabase (PostgreSQL) 또는 Turso (SQLite) | 무료 티어, 스냅샷 저장 |
| **크롤러** | Playwright | JS 렌더링 지원 |
| **Diff 엔진** | diff-match-patch 또는 jsdiff | 텍스트 diff 생성 |
| **스케줄러** | GitHub Actions (cron) 또는 Vercel Cron | 매일 1회 크롤링 |
| **AI 요약** | Claude API (Haiku 4.5) | 비용 효율적 요약 |
| **배포** | Vercel | 사용자 요구사항 |
| **모니터링** | Vercel Analytics | 기본 제공 |

---

## 6. 데이터 모델 (핵심)

```
pages
├── id (PK)
├── url (unique)
├── domain (platform.claude.com | code.claude.com | support.claude.com)
├── section (예: "Build with Claude", "Claude Code")
├── title
├── last_crawled_at
└── created_at

snapshots
├── id (PK)
├── page_id (FK → pages)
├── content_hash (SHA256)
├── content_text (전체 텍스트)
├── sidebar_tree (JSON - 사이드바 구조)
├── crawled_at
└── created_at

changes
├── id (PK)
├── page_id (FK → pages)
├── snapshot_before_id (FK → snapshots)
├── snapshot_after_id (FK → snapshots)
├── change_type (added | modified | removed | sidebar_changed)
├── diff_html (렌더링용 diff)
├── diff_summary (AI 생성 한줄 요약)
├── detected_at (DATE)
└── created_at

daily_reports
├── id (PK)
├── report_date (DATE, unique)
├── total_changes (int)
├── new_pages (int)
├── modified_pages (int)
├── removed_pages (int)
├── ai_summary (전체 요약)
└── created_at
```

---

## 7. 페이지 구조

```
/ (홈)
├── 오늘의 변경사항 요약 카드
├── 최근 7일 타임라인
└── 주요 변경 하이라이트

/changes/:date (일별 상세)
├── 새 페이지 목록
├── 수정된 페이지 목록 (diff 포함)
├── 삭제된 페이지 목록
└── 사이드바 구조 변경

/page/:pageId/history (페이지별 히스토리)
├── 변경 타임라인
└── 각 변경의 diff 뷰

/sidebar-diff (사이드바 구조 비교)
├── 트리 뷰 diff
└── 날짜별 비교

/feed (RSS/JSON Feed)

/api/changes (Public API)
├── GET /api/changes?date=2026-02-26
├── GET /api/changes?page=xxx
└── GET /api/changes/latest
```

---

## 8. 크롤링 파이프라인

```
[매일 UTC 00:00 (KST 09:00)]
    │
    ▼
① sitemap.xml 파싱 → URL 목록 확보
    │
    ▼
② 각 페이지 크롤링 (Playwright)
   - 텍스트 추출 (본문만, 네비게이션 제외)
   - 사이드바 구조 추출 (JSON 트리)
    │
    ▼
③ content_hash 비교
   - 변경 없음 → skip
   - 변경 있음 → snapshot 저장
    │
    ▼
④ diff 생성 (jsdiff)
   - 텍스트 diff
   - 사이드바 트리 diff
    │
    ▼
⑤ AI 요약 생성 (Claude Haiku)
   - 각 변경에 대한 1줄 요약
   - 일별 전체 요약
    │
    ▼
⑥ DB 저장 + ISR 재생성 트리거
    │
    ▼
⑦ 알림 발송 (RSS 업데이트, Webhook)
```

---

## 9. 보안 & 컨벤션

### 9-1. 보안 원칙 (오픈소스 Day 1)

이 프로젝트는 처음부터 public 오픈소스입니다. **모든 커밋이 전세계에 공개**됩니다.

**절대 커밋 금지 항목:**
- API 키, 시크릿, 토큰 (Supabase, Claude API, Vercel, CRON_SECRET 등)
- `.env*` 파일 전체
- 데이터베이스 연결 문자열
- 크롤링 원본 데이터 (snapshots, raw HTML)
- 개인 정보 (이메일, IP 등)

**환경변수 관리:**
- 모든 시크릿은 `.env` → `.gitignore`로 관리
- `.env.example`에는 키 이름만 기재 (값 비워두기)
- 코드에 하드코딩 절대 금지

**Agent 작업 전 필수:**
1. `.gitignore`가 올바르게 설정되어 있는지 확인
2. `git diff --staged`로 시크릿 포함 여부 검증
3. CLAUDE.md의 보안 규칙 준수

### 9-2. 커밋 컨벤션

| 항목 | 규칙 |
|------|------|
| 형식 | Conventional Commits (`feat:`, `fix:`, `docs:` 등) |
| Co-Authored-By | 사용하지 않음 |
| 언어 | 영어 |
| 제목 | 소문자, 현재형, 50자 이내, 마침표 없음 |

### 9-3. 프로젝트 규칙 파일

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | Claude Code 에이전트 규칙 (컨벤션, 보안, 코드 스타일) |
| `MEMORY.md` | 프로젝트 상태 메모리 (작업 후 업데이트) |
| `.gitignore` | 보안 중심 ignore 설정 |
| `.env.example` | 환경변수 템플릿 (값 없이 키만) |

---

## 10. 구현 계획 — Claude Code 에이전트 팀 구성

### 팀 구성: 총 5개 에이전트

실행 명령어: 각 에이전트를 별도 터미널에서 `claude` CLI로 실행

---

### 🔧 Agent 1: Project Scaffolding (프로젝트 초기 설정)

**실행 순서**: 1번째 (다른 에이전트보다 먼저)

```
cd claude-docs-tracker
claude "
CLAUDE.md와 MEMORY.md를 먼저 읽고 규칙을 따라줘.
.gitignore는 이미 설정되어 있으니 건드리지 마.

프로젝트를 초기화해줘:
- Next.js 14 App Router + TypeScript + Tailwind CSS
- 폴더 구조: src/app, src/lib, src/components, src/crawler, src/db
- Supabase 클라이언트 설정 (환경변수 — .env.example만 생성, 실제 .env 금지)
- ESLint + Prettier 설정
- package.json에 필요한 의존성 추가:
  playwright, jsdiff, @supabase/supabase-js, date-fns
- Vercel 배포 설정 (vercel.json)
- DB 마이그레이션 파일 생성 (PLAN.md 데이터 모델 기반)
- README.md 작성
- git init (CLAUDE.md, MEMORY.md, .gitignore는 이미 있음)
- 커밋 컨벤션: Conventional Commits (CLAUDE.md 참고)
- 보안: 절대 시크릿/API키 하드코딩 금지 (CLAUDE.md 참고)
- 완료 후 MEMORY.md 업데이트
"
```

**예상 시간**: 15-20분
**산출물**: 프로젝트 전체 뼈대

**완료 후 GitHub 레포 생성:**
```bash
gh repo create claude-docs-tracker --public --source=. --remote=origin --push
```

---

### 🕷️ Agent 2: Crawler Engine (크롤러 엔진)

**실행 순서**: Agent 1 완료 후

```
claude "
CLAUDE.md와 MEMORY.md를 먼저 읽고 규칙을 따라줘.
src/crawler/ 디렉토리에 크롤러를 구현해줘.

1. sitemap-parser.ts
   - platform.claude.com/docs 와 code.claude.com/docs의 sitemap.xml 파싱
   - 모든 문서 URL 목록 추출
   - sitemap 접근 불가 시 fallback: 사이드바 네비게이션에서 URL 추출

2. page-crawler.ts
   - Playwright로 각 페이지 크롤링
   - 본문 텍스트만 추출 (네비게이션, 푸터 제외)
   - 사이드바 구조를 JSON 트리로 추출
   - rate limiting (페이지당 2초 간격)
   - 에러 핸들링 + 재시도 로직 (최대 3회)

3. diff-generator.ts
   - jsdiff를 사용한 텍스트 diff 생성
   - diff를 HTML로 렌더링 (추가: 초록, 삭제: 빨강)
   - 사이드바 트리 diff (새 항목, 삭제된 항목, 이동된 항목)

4. snapshot-manager.ts
   - SHA256 해시로 변경 감지
   - Supabase에 스냅샷 저장/조회
   - 변경 감지 시 changes 테이블에 기록

5. pipeline.ts
   - 위 모듈들을 조합한 전체 파이프라인
   - CLI로 실행 가능: npx tsx src/crawler/pipeline.ts
   - 드라이런 모드 지원: --dry-run

각 모듈에 단위 테스트도 작성해줘.
"
```

**예상 시간**: 30-40분
**산출물**: 완전한 크롤링 + diff 엔진

---

### 🎨 Agent 3: Frontend — 메인 UI (홈 + 일별 변경)

**실행 순서**: Agent 1 완료 후 (Agent 2와 병렬 가능)

```
claude "
CLAUDE.md와 MEMORY.md를 먼저 읽고 규칙을 따라줘.
src/app/ 에 프론트엔드 페이지를 구현해줘. Tailwind CSS 사용.
디자인 컨셉: 깔끔한 다크 모드 기본, GitHub의 commit history 느낌.

1. 레이아웃 (src/app/layout.tsx)
   - 상단 네비게이션: 로고, Today, History, Sidebar Diff, RSS
   - 다크/라이트 모드 토글
   - 반응형 (모바일 대응)

2. 홈 페이지 (src/app/page.tsx)
   - 히어로: '오늘 N개의 변경이 감지되었습니다'
   - 변경 요약 카드: 새 페이지 N개, 수정 N개, 삭제 N개
   - AI 요약 섹션 (하루 전체를 자연어로 요약)
   - 최근 7일 타임라인 (각 날짜별 변경 수 표시)
   - 주요 변경사항 리스트 (diff 미리보기 포함)

3. 일별 상세 페이지 (src/app/changes/[date]/page.tsx)
   - 날짜 선택 캘린더
   - 새 페이지 섹션: 추가된 페이지 카드 (제목, URL, AI 요약)
   - 수정된 페이지 섹션: diff 뷰 (GitHub diff 스타일)
   - 삭제된 페이지 섹션
   - 사이드바 변경 섹션

4. 컴포넌트
   - DiffView: 텍스트 diff 렌더링 (줄 단위, 추가/삭제 하이라이팅)
   - ChangeCard: 변경사항 카드 (타입 아이콘, 제목, 요약, diff 토글)
   - TimelineBar: 최근 N일 변경 수 바 차트
   - SidebarTreeDiff: 트리 구조 diff (추가: 초록, 삭제: 빨강)
   - DatePicker: 날짜 선택

기본 글꼴: Pretendard (한국어), Inter (영어).
색상 팔레트: Claude 브랜드 컬러(#D97757 주황) 기반.
"
```

**예상 시간**: 40-50분
**산출물**: 전체 UI

---

### 📡 Agent 4: API Routes + Scheduling (API + 스케줄링)

**실행 순서**: Agent 2 완료 후

```
claude "
CLAUDE.md와 MEMORY.md를 먼저 읽고 규칙을 따라줘.
API 라우트와 스케줄링을 구현해줘.

1. API Routes (src/app/api/)
   - GET /api/changes?date=YYYY-MM-DD — 일별 변경 목록
   - GET /api/changes/latest — 최신 변경
   - GET /api/changes/page/:pageId — 페이지별 히스토리
   - GET /api/sidebar-diff?from=YYYY-MM-DD&to=YYYY-MM-DD — 사이드바 diff
   - GET /api/feed/rss — RSS 2.0 피드
   - GET /api/feed/json — JSON Feed 1.1
   - POST /api/crawl (인증 필요) — 수동 크롤링 트리거

2. Vercel Cron Job (vercel.json)
   - 매일 KST 09:00 (UTC 00:00)에 크롤링 실행
   - /api/cron/crawl 엔드포인트

3. AI 요약 모듈 (src/lib/ai-summary.ts)
   - Claude Haiku 4.5 API로 변경사항 요약 생성
   - 각 변경에 대한 1줄 요약 (한국어 + 영어)
   - 일별 전체 요약
   - 토큰 비용 최적화 (배치 처리)

4. Webhook 알림 (src/lib/notifications.ts)
   - Discord webhook 지원
   - Slack webhook 지원
   - 커스텀 webhook URL 지원

모든 API에 에러 핸들링, 응답 캐싱(ISR) 적용.
"
```

**예상 시간**: 25-35분
**산출물**: API + 스케줄링 + AI 요약

---

### 🧪 Agent 5: 통합 테스트 + 배포 준비

**실행 순서**: Agent 2, 3, 4 모두 완료 후 (마지막)

```
claude "
CLAUDE.md와 MEMORY.md를 먼저 읽고 규칙을 따라줘.
프로젝트를 통합하고 배포 준비를 해줘.

1. 통합 테스트
   - 크롤러 → DB 저장 → API 조회 → 프론트 렌더링 전체 흐름
   - 실제 platform.claude.com/docs 1개 페이지로 E2E 테스트
   - mock 데이터로 diff 뷰 렌더링 테스트

2. 시드 데이터
   - 데모용 초기 데이터 생성 스크립트
   - 실제 크롤링 1회 실행하여 초기 스냅샷 확보

3. 배포 체크리스트
   - 환경변수 목록 정리 (.env.example)
   - Supabase 프로젝트 설정 가이드
   - Vercel 배포 가이드
   - CRON_SECRET 설정

4. 성능 최적화
   - 이미지 최적화 (next/image)
   - ISR 설정 (홈: 1시간, 일별: 24시간)
   - 번들 사이즈 확인

5. README.md 최종 업데이트
   - 프로젝트 소개
   - 스크린샷
   - 로컬 개발 가이드
   - 기여 가이드 (오픈소스 준비)
   - 라이선스 (MIT)
   - GitHub repo description: "Daily diff tracker for Claude official documentation (platform.claude.com/docs & code.claude.com/docs)"
   - GitHub topics: claude, anthropic, documentation, changelog, diff-tracker

6. 빌드 확인
   - npm run build 성공 확인
   - lint 에러 0개 확인
"
```

**예상 시간**: 20-30분
**산출물**: 배포 가능한 최종 프로젝트

---

### 실행 순서 요약

```
시간 ──────────────────────────────────────────────►

Agent 1 [████████]
(Scaffolding)  │
               ├── Agent 2 [████████████████]
               │   (Crawler)         │
               │                     ├── Agent 4 [██████████]
               │                     │   (API+Cron)    │
               ├── Agent 3 [██████████████████]        │
               │   (Frontend)                          │
               │                                       │
               └───────────────────────── Agent 5 [████████]
                                          (통합+배포)
```

**총 예상 시간**: 약 1.5~2.5시간 (순차 실행 시)
**병렬 실행 시**: 약 1~1.5시간

---

## 11. MVP 이후 로드맵

| 단계 | 기능 | 우선순위 |
|------|------|---------|
| v1.1 | 이메일 구독 (일별/주별 리포트) | 높음 |
| v1.2 | 다국어 AI 요약 (한/영/일) | 높음 |
| v1.3 | GitHub 연동 (변경사항 → Issue 자동 생성) | 중간 |
| v2.0 | OpenAI, Google AI 문서도 추적 | 중간 |
| v2.1 | 브라우저 확장 프로그램 (문서 열면 변경 하이라이트) | 낮음 |
| v2.2 | API 사용량 대시보드 (오픈소스 기여자용) | 낮음 |

---

## 12. 비용 추정 (월간)

| 항목 | 예상 비용 | 비고 |
|------|----------|------|
| Vercel (Hobby) | $0 | 크론잡 포함 |
| Supabase (Free) | $0 | 500MB DB, 월 5만 API 콜 |
| Claude Haiku API | ~$5-10 | 일 1회 요약 생성 |
| 도메인 | ~$10-15/년 | 사용자 부담 |
| **합계** | **~$5-10/월** | |

---

## 13. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| Anthropic이 크롤링 차단 | robots.txt 준수, 적절한 rate limiting, User-Agent 명시 |
| 문서 구조 변경 (DOM 변경) | 셀렉터 기반이 아닌 텍스트 기반 diff로 유연하게 |
| sitemap.xml 접근 불가 | 사이드바 네비게이션에서 URL 직접 추출 (fallback) |
| Vercel Cron 제한 | GitHub Actions cron으로 대체 가능 |
| 대량 변경 시 API 비용 | Haiku 모델 사용 + 변경된 페이지만 요약 |
