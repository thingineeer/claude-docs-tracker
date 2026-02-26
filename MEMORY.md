# MEMORY.md — 프로젝트 메모리

> 이 파일은 Claude Code 에이전트가 프로젝트 컨텍스트를 빠르게 파악하기 위한 메모리 파일입니다.
> 작업 후 반드시 업데이트하세요.

## 프로젝트 정보

- **이름**: claude-docs-tracker
- **설명**: Claude 공식 문서의 일일 변경사항을 추적하는 웹 서비스
- **소유자**: thingineeer
- **GitHub**: https://github.com/thingineeer/claude-docs-tracker
- **상태**: MVP 배포 완료
- **Production URL**: https://claude-docs-tracker.vercel.app
- **라이선스**: MIT
- **공개 여부**: public 오픈소스 (처음부터)

## 기술 스택

- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- DB: Supabase (PostgreSQL)
- Crawler: Playwright
- Diff: jsdiff
- AI: Claude Haiku 4.5 API
- Deploy: Vercel
- Scheduler: Vercel Cron / GitHub Actions

## 추적 대상 문서

| 도메인 | 대상 |
|--------|------|
| platform.claude.com/docs | API/개발자 문서 (메인) |
| code.claude.com/docs | Claude Code 문서 |
| support.claude.com | Claude Apps 릴리즈 노트 |

## 현재 진행 상태

- [x] 시장 조사 완료
- [x] 경쟁사 분석 완료 (Releasebot.io)
- [x] 기획서 작성 완료 (PLAN.md)
- [x] CLAUDE.md 컨벤션 설정
- [x] MEMORY.md 생성
- [x] .gitignore 설정
- [x] Agent 1: 프로젝트 스캐폴딩 ✅ (2026-02-26)
- [x] Agent 2: 크롤러 엔진 ✅ (2026-02-26)
- [x] Agent 3: 프론트엔드 UI ✅ (2026-02-26)
- [x] Agent 4: API + 스케줄링 ✅ (2026-02-26)
- [x] Agent 5: 통합 테스트 + 배포 ✅ (2026-02-26)
- [x] GitHub 레포 생성 & push ✅ (2026-02-26)
- [x] Supabase 프로젝트 생성 & 마이그레이션 ✅ (2026-02-26)
- [x] 환경변수 설정 (.env.local + Vercel) ✅ (2026-02-26)
- [x] 실제 변경사항 시드 데이터 투입 (16건, 2026-01-29~02-26) ✅
- [x] Vercel 배포 완료 ✅ (2026-02-26)
- [x] GitHub → Vercel 자동 배포 연결 ✅ (main push/merge 시 자동 프로덕션 배포)
- [x] 초기 문서 크롤링 완료 ✅ (2026-02-26)
  - code.claude.com: 57페이지 (fetch, SSR)
  - platform.claude.com: 80페이지 (Playwright, CSR)
  - 총 137개 문서 초기 스냅샷 Supabase 저장
- [x] v1.1 개선 작업 완료 ✅ (2026-02-26)
  - [x] A-1: 단수/복수 문법 수정
  - [x] A-2: 다크/라이트 모드 토글 (localStorage, class 기반)
  - [x] A-3: 타임라인 차트 개선 (카운트 라벨, 클릭 네비게이션)
  - [x] A-4: URL 표시 정리 (도메인/.../경로 요약 + 툴팁)
  - [x] A-5: Footer 추가 (GitHub, RSS, MIT)
  - [x] A-6: SEO 메타데이터 (Open Graph, Twitter Card)
  - [x] B-1: AI Summary 프롬프트 개선 (자연스러운 한국어)
  - [x] B-2: Sidebar Diff empty state 개선
  - [x] B-3: 날짜 네비게이션 개선 (date picker, 오늘 버튼)
  - [x] B-4: 검색 기능 추가 (/search, API ?q= 파라미터)

## 빌드 상태

- Lint: 0 에러
- Build: 성공 (14 라우트 — /search 추가)
- Tests: 33/33 통과
- 크롤링 데이터: 137개 문서 초기 스냅샷 (code: 57, platform: 80)
- 마지막 확인: 2026-02-26

## 주요 결정 사항

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-02-26 | Co-Authored-By 미사용 | 도구는 도구, 커밋은 사람 이름으로만 |
| 2026-02-26 | Conventional Commits 채택 | 오픈소스 표준, 자동 CHANGELOG 가능 |
| 2026-02-26 | 폴더명 claude-docs-tracker | 직관적, 검색 친화적 |
| 2026-02-26 | Vercel 1차 배포 | 무료 티어, Next.js 네이티브 |
| 2026-02-26 | class 기반 다크모드 | prefers-color-scheme → html.dark 클래스로 전환, localStorage 저장 |
| 2026-02-26 | AI 요약 한국어 전용 | 영한 혼합 어색 → 한국어만 생성, 고유명사만 영어 허용 |
| 2026-02-26 | platform.claude.com은 Playwright 필수 | CSR 앱이라 fetch로는 JS shell만 반환, Playwright로 해결 |
| 2026-02-26 | code.claude.com은 SSR | sitemap 있고 fetch로 콘텐츠 정상 반환 |

## 보안 주의사항

- 이 프로젝트는 public repo — 모든 커밋이 공개됨
- API 키, 시크릿은 절대 커밋 금지 (.env → .gitignore)
- 크롤링 원본 데이터도 커밋 금지
- 상세 보안 규칙은 CLAUDE.md 참고

## 배포 체크리스트

1. [x] Supabase 프로젝트 생성 (Seoul 리전, ref: ngleawriplmzzpfrojde)
2. [x] SQL Editor에서 마이그레이션 실행
3. [x] `.env.local` 생성 완료
4. [x] Vercel 프로젝트 연결 & 배포 완료
5. [x] GitHub 자동 배포 설정 완료
6. [x] Vercel 환경변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET)
7. [x] 시드 데이터 투입 (16건 실제 변경사항)

## 배포 워크플로우

```
feat/* 브랜치 작업 → PR 생성 → 프리뷰 배포 자동 생성
                   → main 머지 → 프로덕션 자동 배포
```

## 참고 링크

- 기획서: ./PLAN.md
- 컨벤션: ./CLAUDE.md
- GitHub: https://github.com/thingineeer/claude-docs-tracker
- 경쟁사: https://releasebot.io/updates/anthropic
- 공식 릴리즈 노트: https://platform.claude.com/docs/en/release-notes/overview
- Claude Code 문서맵: https://code.claude.com/docs/en/claude_code_docs_map
