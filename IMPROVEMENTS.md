# 개선사항 목록 (v1.1)

> 이 파일은 Claude Code 에이전트가 개선 작업 시 참고하는 태스크 목록입니다.

## 병렬 작업 그룹 A: UI/UX 개선 (서로 독립적)

### A-1. 단수/복수 문법 수정
- `src/app/page.tsx` 38번 줄: "1 changes" → "1 change" (단수 처리)
- 모든 곳에서 count가 1일 때 단수형 사용
- "1 New Pages" → "1 New Page" 등 카드도 포함

### A-2. 다크/라이트 모드 토글 추가
- `src/components/navbar.tsx`에 토글 버튼 추가
- localStorage로 테마 상태 저장
- `globals.css`의 `prefers-color-scheme` 대신 class 기반(`dark` class)으로 전환
- 아이콘: 해/달 아이콘 (svg inline, 외부 라이브러리 금지)

### A-3. 타임라인 차트 개선
- `src/components/timeline-bar.tsx`
- 바 위에 변경 건수 숫자 직접 표시
- 0건인 날은 "--" 또는 "0" 표시
- 바 클릭 시 해당 날짜의 /changes/[date] 페이지로 이동

### A-4. URL 표시 정리
- `src/components/change-card.tsx`
- 전체 URL 대신 도메인 + 경로 요약으로 표시
  - 예: `platform.claude.com/.../prompt-caching`
  - 예: `github.com/.../v2.1.59`
- 전체 URL은 hover tooltip으로 표시
- 클릭 시 원본 URL로 이동은 유지

### A-5. Footer 추가
- 새 컴포넌트: `src/components/footer.tsx`
- `src/app/layout.tsx`에 추가
- 포함 내용:
  - GitHub 레포 링크 (아이콘 + "Star on GitHub")
  - RSS 피드 링크
  - "MIT License" 표시
  - "Powered by Next.js & Vercel" (작게)
- 디자인: border-top, 심플, accent 색상 활용

### A-6. SEO 메타데이터 보강
- `src/app/layout.tsx`에 Open Graph + Twitter Card 메타 추가
- title, description, og:image (기본 OG 이미지는 나중에)
- 각 페이지별 동적 메타데이터:
  - 홈: "Claude Docs Tracker - Daily documentation change tracker"
  - /changes/[date]: "Changes on {date} - Claude Docs Tracker"
  - /sidebar-diff: "Sidebar Structure Changes - Claude Docs Tracker"

## 병렬 작업 그룹 B: 콘텐츠/기능 개선

### B-1. AI Summary 프롬프트 개선
- `src/lib/ai-summary.ts`
- 현재 문제: "1 new pages이(가) 감지되었습니다" — 한영 혼합 어색
- 개선 방향:
  - 한국어와 영어를 별도 필드로 분리하지 말고, 한국어 요약만 생성
  - 또는 줄바꿈으로 깔끔하게 분리: 영어 한 줄 + 한국어 한 줄
  - 자연스러운 문장: "새 문서 1건이 추가되었습니다: Claude Code v2.1.59 릴리즈"
  - 숫자 + "pages" 같은 영어 단어 혼용 금지

### B-2. Sidebar Diff empty state 개선
- `src/app/sidebar-diff/page.tsx`
- 현재: "No sidebar changes detected." (너무 단순)
- 개선:
  - 일러스트 또는 아이콘 추가 (svg)
  - "크롤러가 문서 사이드바 구조를 수집하면 여기에 변경사항이 표시됩니다."
  - "첫 수집 예정: 매일 KST 09:00"
  - "수동 트리거: POST /api/crawl" (개발자용 힌트)

### B-3. History 날짜 네비게이션 개선
- `src/app/changes/[date]/page.tsx`
- 현재: ← 이전 날짜 / 다음 날짜 → 만 있음
- 추가:
  - 간단한 달력 피커 (라이브러리 없이 구현, 또는 input type="date")
  - "오늘로 이동" 버튼
  - 변경사항이 있는 날짜에 dot 표시 (가능하면)

### B-4. 검색 기능 추가
- 네비바에 검색 아이콘 추가
- 검색 페이지: `/search?q=keyword`
- API: `GET /api/changes?q=keyword` — diff_summary, title에서 검색
- 결과를 ChangeCard로 표시
- 최소 구현: 서버사이드 텍스트 검색 (Supabase ilike)

## 공통 규칙

- CLAUDE.md 컨벤션 준수 (Conventional Commits, 영어 커밋 메시지)
- 각 그룹 완료 시 MEMORY.md 업데이트
- 보안: 시크릿 하드코딩 금지
- 빌드 확인: `npm run build` 성공, lint 에러 0개
