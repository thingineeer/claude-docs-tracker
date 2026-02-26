/**
 * Seed script with real Claude documentation & Claude Code changelog data.
 * Usage: npx tsx scripts/seed-demo-data.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Real changes data (Feb 2026) ────────────────────────────────────

interface ChangeEntry {
  date: string;
  page: {
    url: string;
    domain: string;
    section: string;
    title: string;
  };
  changeType: 'added' | 'modified';
  diffHtml: string;
  summary: string;
}

const CHANGES: ChangeEntry[] = [
  // ── Feb 26 ──
  {
    date: '2026-02-26',
    page: {
      url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.59',
      domain: 'code.claude.com',
      section: 'changelog',
      title: 'Claude Code v2.1.59',
    },
    changeType: 'added',
    diffHtml: `<div class="diff-added">+ Auto-memory: Claude automatically saves useful context (manage with /memory)</div>
<div class="diff-added">+ Added /copy command — interactive code block picker for copying output</div>
<div class="diff-added">+ Improved "always allow" prefix suggestions for compound bash commands</div>
<div class="diff-added">+ Improved ordering of short task lists</div>
<div class="diff-added">+ Improved memory usage in multi-agent sessions</div>
<div class="diff-added">+ Fixed MCP OAuth token refresh race condition</div>
<div class="diff-added">+ Fixed shell commands error messaging when working directory is deleted</div>`,
    summary:
      'Claude Code v2.1.59: auto-memory for persistent context, /copy command, compound bash improvements | 자동 메모리 기능 추가, /copy 명령어, 복합 bash 개선',
  },
  // ── Feb 25 ──
  {
    date: '2026-02-25',
    page: {
      url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.58',
      domain: 'code.claude.com',
      section: 'changelog',
      title: 'Claude Code v2.1.58',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-added">+ Expanded Remote Control access to more users</div>`,
    summary:
      'Claude Code v2.1.58: Remote Control expanded to more users | 리모트 컨트롤 기능 더 많은 사용자에게 확대',
  },
  {
    date: '2026-02-25',
    page: {
      url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.53',
      domain: 'code.claude.com',
      section: 'changelog',
      title: 'Claude Code v2.1.53',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-added">+ Fixed UI flicker where user input would briefly disappear</div>
<div class="diff-added">+ Fixed bulk agent kill (Ctrl+F) to send aggregate notification</div>
<div class="diff-added">+ Fixed graceful shutdown with Remote Control</div>
<div class="diff-added">+ Fixed --worktree sometimes being ignored on first launch</div>
<div class="diff-added">+ Fixed multiple Windows crashes (panic, process spawning, WebAssembly, ARM64)</div>`,
    summary:
      'Claude Code v2.1.53: UI flicker fix, worktree fixes, Windows stability | UI 깜박임 수정, worktree 수정, Windows 안정성 개선',
  },
  // ── Feb 24 ──
  {
    date: '2026-02-24',
    page: {
      url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.51',
      domain: 'code.claude.com',
      section: 'changelog',
      title: 'Claude Code v2.1.51',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-added">+ Added claude remote-control subcommand for external builds</div>
<div class="diff-added">+ Extended plugin marketplace git timeout from 30s to 120s</div>
<div class="diff-added">+ Added custom npm registry and version pinning support</div>
<div class="diff-added">+ BashTool now skips login shell by default when snapshot available</div>
<div class="diff-added">+ Fixed security: statusLine and fileSuggestion hooks require workspace trust</div>
<div class="diff-added">+ Tool results &gt;50K characters now persisted to disk</div>
<div class="diff-added">+ Added CLAUDE_CODE_ACCOUNT_UUID, CLAUDE_CODE_USER_EMAIL env vars</div>
<div class="diff-added">+ /model picker now shows human-readable labels with upgrade hints</div>`,
    summary:
      'Claude Code v2.1.51: remote-control subcommand, plugin improvements, security fixes | remote-control 하위 명령어, 플러그인 개선, 보안 수정',
  },
  // ── Feb 21 ──
  {
    date: '2026-02-21',
    page: {
      url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.50',
      domain: 'code.claude.com',
      section: 'changelog',
      title: 'Claude Code v2.1.50',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-added">+ Git worktree isolation: --worktree (-w) flag for isolated agent work</div>
<div class="diff-added">+ Subagents support isolation: "worktree" in agent definitions</div>
<div class="diff-added">+ Ctrl+F to kill background agents (two-press confirmation)</div>
<div class="diff-added">+ Agent definitions support background: true for background tasks</div>
<div class="diff-added">+ CLAUDE_CODE_SIMPLE now includes file edit tool</div>
<div class="diff-added">+ Opus 4.6 (fast mode) now includes full 1M context window</div>
<div class="diff-added">+ Added claude agents CLI command</div>
<div class="diff-added">+ Added startupTimeout configuration for LSP servers</div>
<div class="diff-added">+ Added WorktreeCreate and WorktreeRemove hook events</div>
<div class="diff-added">+ Multiple memory leak fixes for long sessions</div>`,
    summary:
      'Claude Code v2.1.50: git worktree isolation for agents, Opus 4.6 fast mode 1M context, agent CLI | 에이전트용 worktree 격리, Opus 4.6 빠른 모드 1M 컨텍스트',
  },
  // ── Feb 19 ── Platform release notes
  {
    date: '2026-02-19',
    page: {
      url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching',
      domain: 'platform.claude.com',
      section: 'build-with-claude',
      title: 'Automatic Caching for Messages API',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-removed">- Manual cache_control breakpoints required on each content block</div>
<div class="diff-added">+ Automatic caching: single cache_control field on request body</div>
<div class="diff-added">+ No manual breakpoint management needed</div>
<div class="diff-added">+ Now generally available (GA)</div>`,
    summary:
      'Automatic caching for Messages API — no manual breakpoints needed (GA) | 메시지 API 자동 캐싱 — 수동 브레이크포인트 불필요 (GA)',
  },
  {
    date: '2026-02-19',
    page: {
      url: 'https://platform.claude.com/docs/en/about-claude/models/all-models',
      domain: 'platform.claude.com',
      section: 'about-claude',
      title: 'Model Retirements — Sonnet 3.7 & Haiku 3.5',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-removed">- claude-3-7-sonnet-20250219: Active</div>
<div class="diff-added">+ claude-3-7-sonnet-20250219: Retired (Feb 19, 2026)</div>
<div class="diff-removed">- claude-3-5-haiku-20241022: Active</div>
<div class="diff-added">+ claude-3-5-haiku-20241022: Retired (Feb 19, 2026)</div>
<div class="diff-added">+ Recommendation: Upgrade to Claude Sonnet 4.6 and Claude Haiku 4.5</div>
<div class="diff-added">+ claude-3-haiku-20240307: Deprecated — retirement April 19, 2026</div>`,
    summary:
      'Claude Sonnet 3.7 & Haiku 3.5 retired; Haiku 3 deprecated (retiring Apr 19) | Sonnet 3.7 & Haiku 3.5 종료, Haiku 3 지원 중단 예정',
  },
  {
    date: '2026-02-19',
    page: {
      url: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.49',
      domain: 'code.claude.com',
      section: 'changelog',
      title: 'Claude Code v2.1.49',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-added">+ Simple mode now includes file edit tool alongside Bash</div>
<div class="diff-added">+ Sonnet 4.5 with 1M context removed from Max; switched to Sonnet 4.6 with 1M</div>
<div class="diff-added">+ Added ConfigChange hook event for security auditing</div>
<div class="diff-added">+ Improved MCP server connection with auth failure caching</div>
<div class="diff-added">+ Fixed Ctrl+C and ESC being silently ignored with background agents</div>
<div class="diff-added">+ Fixed unbounded WASM memory growth</div>`,
    summary:
      'Claude Code v2.1.49: simple mode file edit, Sonnet 4.6 1M default, ConfigChange hooks | 심플 모드 파일 편집, Sonnet 4.6 1M 기본값',
  },
  // ── Feb 17 ──
  {
    date: '2026-02-17',
    page: {
      url: 'https://platform.claude.com/docs/en/about-claude/models/claude-sonnet-4-6',
      domain: 'platform.claude.com',
      section: 'about-claude',
      title: 'Claude Sonnet 4.6',
    },
    changeType: 'added',
    diffHtml: `<div class="diff-added">+ Claude Sonnet 4.6 — latest balanced model</div>
<div class="diff-added">+ Improved agentic search with fewer tokens</div>
<div class="diff-added">+ Extended thinking support</div>
<div class="diff-added">+ 1M token context window (beta)</div>
<div class="diff-added">+ Model ID: claude-sonnet-4-6-20260217</div>`,
    summary:
      'Claude Sonnet 4.6 launched — faster, fewer tokens, 1M context beta | Claude Sonnet 4.6 출시 — 빠르고 토큰 절약, 1M 컨텍스트 베타',
  },
  {
    date: '2026-02-17',
    page: {
      url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search',
      domain: 'platform.claude.com',
      section: 'agents-and-tools',
      title: 'Web Search & Tool Use — GA',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-removed">- Web search tool (beta)</div>
<div class="diff-added">+ Web search tool (generally available)</div>
<div class="diff-removed">- Programmatic tool calling (beta)</div>
<div class="diff-added">+ Programmatic tool calling (generally available)</div>
<div class="diff-removed">- Code execution tool (beta)</div>
<div class="diff-added">+ Code execution tool (generally available)</div>
<div class="diff-removed">- Web fetch tool (beta)</div>
<div class="diff-added">+ Web fetch tool (generally available)</div>
<div class="diff-added">+ API code execution now free when used with web search or web fetch</div>`,
    summary:
      'Web search, code execution, web fetch tools now GA; free code execution with search | 웹 검색, 코드 실행, 웹 가져오기 GA 전환; 검색과 함께 코드 실행 무료',
  },
  // ── Feb 7 ──
  {
    date: '2026-02-07',
    page: {
      url: 'https://platform.claude.com/docs/en/build-with-claude/fast-mode',
      domain: 'platform.claude.com',
      section: 'build-with-claude',
      title: 'Fast Mode (Research Preview)',
    },
    changeType: 'added',
    diffHtml: `<div class="diff-added">+ Fast mode for Opus 4.6: up to 2.5x faster output token generation</div>
<div class="diff-added">+ Enabled via speed parameter in API request</div>
<div class="diff-added">+ Premium pricing for fast mode</div>
<div class="diff-added">+ Status: Research preview</div>`,
    summary:
      'Fast mode for Opus 4.6 — up to 2.5x faster output (research preview) | Opus 4.6 빠른 모드 — 최대 2.5배 빠른 출력 (연구 프리뷰)',
  },
  // ── Feb 5 ──
  {
    date: '2026-02-05',
    page: {
      url: 'https://platform.claude.com/docs/en/about-claude/models/claude-opus-4-6',
      domain: 'platform.claude.com',
      section: 'about-claude',
      title: 'Claude Opus 4.6',
    },
    changeType: 'added',
    diffHtml: `<div class="diff-added">+ Claude Opus 4.6 — most intelligent model for complex agentic tasks</div>
<div class="diff-added">+ Recommends adaptive thinking (manual thinking deprecated)</div>
<div class="diff-added">+ Does not support prefilling assistant messages</div>
<div class="diff-added">+ 1M token context window (beta)</div>
<div class="diff-added">+ Model ID: claude-opus-4-6-20260205</div>`,
    summary:
      'Claude Opus 4.6 launched — most intelligent model, adaptive thinking, 1M context | Claude Opus 4.6 출시 — 최고 지능 모델, 적응형 사고, 1M 컨텍스트',
  },
  {
    date: '2026-02-05',
    page: {
      url: 'https://platform.claude.com/docs/en/build-with-claude/context-editing',
      domain: 'platform.claude.com',
      section: 'build-with-claude',
      title: 'Compaction API (Beta)',
    },
    changeType: 'added',
    diffHtml: `<div class="diff-added">+ Compaction API — server-side context summarization</div>
<div class="diff-added">+ Enables effectively infinite conversations</div>
<div class="diff-added">+ Available on Opus 4.6</div>
<div class="diff-added">+ Status: Beta</div>`,
    summary:
      'Compaction API beta — server-side context summarization for infinite conversations | Compaction API 베타 — 무한 대화를 위한 서버 측 컨텍스트 요약',
  },
  {
    date: '2026-02-05',
    page: {
      url: 'https://platform.claude.com/docs/en/build-with-claude/data-residency',
      domain: 'platform.claude.com',
      section: 'build-with-claude',
      title: 'Data Residency Controls',
    },
    changeType: 'added',
    diffHtml: `<div class="diff-added">+ New inference_geo parameter for geographic inference control</div>
<div class="diff-added">+ US-only inference available at 1.1x pricing</div>
<div class="diff-added">+ Applies to models released after February 1, 2026</div>`,
    summary:
      'Data residency controls — choose where model inference runs | 데이터 레지던시 제어 — 모델 추론 실행 위치 선택 가능',
  },
  {
    date: '2026-02-05',
    page: {
      url: 'https://platform.claude.com/docs/en/build-with-claude/extended-thinking',
      domain: 'platform.claude.com',
      section: 'build-with-claude',
      title: 'Effort Parameter — GA',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-removed">- Effort parameter (beta) — requires anthropic-beta header</div>
<div class="diff-added">+ Effort parameter (generally available) — no beta header needed</div>
<div class="diff-added">+ Supports Claude Opus 4.6</div>
<div class="diff-added">+ Replaces budget_tokens for controlling thinking depth</div>`,
    summary:
      'Effort parameter now GA — controls thinking depth without beta header | Effort 파라미터 GA 전환 — 베타 헤더 없이 사고 깊이 제어',
  },
  // ── Jan 29 ──
  {
    date: '2026-01-29',
    page: {
      url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs',
      domain: 'platform.claude.com',
      section: 'build-with-claude',
      title: 'Structured Outputs — GA',
    },
    changeType: 'modified',
    diffHtml: `<div class="diff-removed">- Structured outputs (beta)</div>
<div class="diff-added">+ Structured outputs (generally available)</div>
<div class="diff-added">+ Available on Sonnet 4.5, Opus 4.5, Haiku 4.5</div>
<div class="diff-added">+ Expanded schema support</div>
<div class="diff-added">+ Improved grammar compilation latency</div>
<div class="diff-added">+ output_format moved to output_config.format</div>`,
    summary:
      'Structured outputs GA — expanded schema support, improved latency | 구조화된 출력 GA — 스키마 확장, 지연 시간 개선',
  },
];

// ─── Seed logic ──────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding real changelog data...\n');

  const dailyCounts: Record<string, { total: number; added: number; modified: number }> = {};

  for (const entry of CHANGES) {
    // Upsert page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .upsert(
        { ...entry.page, last_crawled_at: new Date().toISOString() },
        { onConflict: 'url' },
      )
      .select()
      .single();

    if (pageError) {
      console.error(`  Error [page] ${entry.page.title}:`, pageError.message);
      continue;
    }

    // Insert snapshot
    const { data: snapshot, error: snapError } = await supabase
      .from('snapshots')
      .insert({
        page_id: pageData.id,
        content_hash: `hash-${entry.date}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content_text: entry.diffHtml.replace(/<[^>]+>/g, ' ').trim(),
        sidebar_tree: null,
        crawled_at: `${entry.date}T09:00:00.000Z`,
      })
      .select()
      .single();

    if (snapError) {
      console.error(`  Error [snapshot] ${entry.page.title}:`, snapError.message);
      continue;
    }

    // Insert change
    const { error: changeError } = await supabase.from('changes').insert({
      page_id: pageData.id,
      snapshot_before_id: null,
      snapshot_after_id: snapshot.id,
      change_type: entry.changeType,
      diff_html: entry.diffHtml,
      diff_summary: entry.summary,
      detected_at: entry.date,
    });

    if (changeError) {
      console.error(`  Error [change] ${entry.page.title}:`, changeError.message);
      continue;
    }

    console.log(`  ${entry.date}  ${entry.changeType === 'added' ? '+' : '~'}  ${entry.page.title}`);

    // Accumulate daily counts
    if (!dailyCounts[entry.date]) {
      dailyCounts[entry.date] = { total: 0, added: 0, modified: 0 };
    }
    dailyCounts[entry.date].total++;
    if (entry.changeType === 'added') dailyCounts[entry.date].added++;
    else dailyCounts[entry.date].modified++;
  }

  // Upsert daily reports
  console.log('\nGenerating daily reports...');
  for (const [date, counts] of Object.entries(dailyCounts)) {
    const summaryParts: string[] = [];
    if (counts.added > 0) summaryParts.push(`${counts.added} new pages`);
    if (counts.modified > 0) summaryParts.push(`${counts.modified} modifications`);

    const { error } = await supabase.from('daily_reports').upsert(
      {
        report_date: date,
        total_changes: counts.total,
        new_pages: counts.added,
        modified_pages: counts.modified,
        removed_pages: 0,
        ai_summary: `${summaryParts.join(' and ')} detected in Claude documentation. | Claude 문서에서 ${summaryParts.join(', ')}이(가) 감지되었습니다.`,
      },
      { onConflict: 'report_date' },
    );

    if (error) {
      console.error(`  Error [report] ${date}:`, error.message);
    } else {
      console.log(`  ${date}: ${counts.total} changes`);
    }
  }

  console.log('\nSeed complete!');
}

seed().catch(console.error);
