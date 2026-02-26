# MEMORY.md — 프로젝트 메모리

> 이 파일은 Claude Code 에이전트가 프로젝트 컨텍스트를 빠르게 파악하기 위한 메모리 파일입니다.
> 작업 후 반드시 업데이트하세요.

## 프로젝트 정보

- **이름**: claude-docs-tracker
- **설명**: Claude 공식 문서의 일일 변경사항을 추적하는 웹 서비스
- **소유자**: thingineeer
- **GitHub**: https://github.com/thingineeer/claude-docs-tracker
- **상태**: MVP 개발 완료, GitHub 레포 생성 완료
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
- [ ] Supabase 프로젝트 생성 & 마이그레이션 (가이드 제공됨)
- [ ] 환경변수 설정 (.env.local)
- [ ] Vercel 배포 (가이드 제공됨)

## 빌드 상태

- Lint: 0 에러
- Build: 성공 (13 라우트)
- Tests: 33/33 통과
- 마지막 확인: 2026-02-26

## 주요 결정 사항

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-02-26 | Co-Authored-By 미사용 | 도구는 도구, 커밋은 사람 이름으로만 |
| 2026-02-26 | Conventional Commits 채택 | 오픈소스 표준, 자동 CHANGELOG 가능 |
| 2026-02-26 | 폴더명 claude-docs-tracker | 직관적, 검색 친화적 |
| 2026-02-26 | Vercel 1차 배포 | 무료 티어, Next.js 네이티브 |

## 보안 주의사항

- 이 프로젝트는 public repo — 모든 커밋이 공개됨
- API 키, 시크릿은 절대 커밋 금지 (.env → .gitignore)
- 크롤링 원본 데이터도 커밋 금지
- 상세 보안 규칙은 CLAUDE.md 참고

## 배포 체크리스트

1. [ ] Supabase 프로젝트 생성 (Seoul 리전 권장)
2. [ ] SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
3. [ ] `.env.local` 생성 후 환경변수 입력
4. [ ] Vercel에서 프로젝트 임포트 & 환경변수 설정
5. [ ] 배포 후 `https://your-app.vercel.app/` 접속 확인
6. [ ] 수동 크롤링 트리거로 첫 데이터 수집
7. [ ] CRON_SECRET이 Vercel 환경변수에 설정되었는지 확인

## 참고 링크

- 기획서: ./PLAN.md
- 컨벤션: ./CLAUDE.md
- GitHub: https://github.com/thingineeer/claude-docs-tracker
- 경쟁사: https://releasebot.io/updates/anthropic
- 공식 릴리즈 노트: https://platform.claude.com/docs/en/release-notes/overview
- Claude Code 문서맵: https://code.claude.com/docs/en/claude_code_docs_map
