#!/bin/bash
# ============================================
# Claude Docs Tracker — UX Improvement Runner
# ============================================
# 사용법: 각 Phase별로 터미널에서 실행
#
# Phase 1: Team A를 먼저 실행 (색상 체계가 다른 팀의 기반)
# Phase 2: Team B~E를 병렬 실행

# ---- Phase 1: Design System (먼저 실행, 완료 대기) ----
echo "🎨 Phase 1: Team A — Design System"
claude -p "$(cat prompts/team-a-design-system.md)"

# ---- Phase 2: 나머지 4팀 병렬 실행 ----
echo "🚀 Phase 2: Teams B~E 병렬 시작"
claude -p "$(cat prompts/team-b-navigation.md)" &
claude -p "$(cat prompts/team-c-homepage.md)" &
claude -p "$(cat prompts/team-d-calendar.md)" &
claude -p "$(cat prompts/team-e-search-global.md)" &
wait
echo "✅ 모든 팀 완료"
