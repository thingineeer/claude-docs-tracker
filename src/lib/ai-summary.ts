import { upsertDailyReport } from '@/db/queries';
import { getTodayString } from './timezone';
import type { ProcessResult } from '@/crawler/snapshot-manager';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: { type: string; text: string }[];
}

async function callClaude(messages: ClaudeMessage[], maxTokens = 500): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY environment variable is required');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  return data.content[0]?.text ?? '';
}

export async function generateChangeSummary(
  pageTitle: string,
  changeType: string,
  diffText?: string,
): Promise<string> {
  const prompt = diffText
    ? `Summarize this documentation change concisely in Korean only.
Page: "${pageTitle}"
Change type: ${changeType}
Diff:
${diffText.slice(0, 2000)}

Rules:
- Write a natural Korean sentence (1-2 sentences max)
- Do not mix English words like "pages" or "changes" into Korean
- Use the page title as-is (English names are OK for proper nouns)
- Example: "Claude Code v2.1.59의 새로운 기능이 문서에 추가되었습니다."`
    : `문서 페이지 "${pageTitle}"가 ${changeType === 'added' ? '새로 추가' : changeType === 'removed' ? '삭제' : '수정'}되었습니다. 한국어로 자연스러운 1문장 요약을 작성하세요.`;

  return callClaude([{ role: 'user', content: prompt }], 200);
}

export async function generateDailySummary(results: ProcessResult[]): Promise<string> {
  const newPages = results.filter((r) => r.status === 'new');
  const modified = results.filter((r) => r.status === 'modified');
  const today = getTodayString();

  const prompt = `오늘의 Claude 문서 변경사항을 한국어로 2-3문장으로 요약하세요.

새 문서 ${newPages.length}건: ${newPages.map((r) => r.url).join(', ') || '없음'}
수정된 문서 ${modified.length}건: ${modified.map((r) => r.url).join(', ') || '없음'}

규칙:
- 한국어만 사용 (고유명사는 영어 OK)
- "pages", "changes" 같은 영어 단어를 한국어 문장에 섞지 마세요
- 숫자는 한국어 조사와 자연스럽게 연결
- 예시: "새 문서 2건이 추가되었습니다. Claude Code v2.1.59 릴리즈 노트와 프롬프트 캐싱 가이드가 포함됩니다."`;

  const summary = await callClaude([{ role: 'user', content: prompt }], 300);

  await upsertDailyReport({
    report_date: today,
    total_changes: newPages.length + modified.length,
    new_pages: newPages.length,
    modified_pages: modified.length,
    removed_pages: 0,
    ai_summary: summary,
  });

  return summary;
}
