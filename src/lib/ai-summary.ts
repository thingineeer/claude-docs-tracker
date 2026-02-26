import { upsertDailyReport } from '@/db/queries';
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
    ? `Summarize this documentation change in 1 sentence (bilingual: English then Korean).
Page: "${pageTitle}"
Change type: ${changeType}
Diff:
${diffText.slice(0, 2000)}

Format: "English summary | 한국어 요약"`
    : `A documentation page "${pageTitle}" was ${changeType}. Write a 1-sentence summary (English | 한국어).`;

  return callClaude([{ role: 'user', content: prompt }], 200);
}

export async function generateDailySummary(results: ProcessResult[]): Promise<string> {
  const newPages = results.filter((r) => r.status === 'new');
  const modified = results.filter((r) => r.status === 'modified');
  const today = new Date().toISOString().split('T')[0];

  const prompt = `Summarize today's Claude documentation changes in 2-3 sentences (bilingual: English then Korean).

New pages (${newPages.length}): ${newPages.map((r) => r.url).join(', ') || 'None'}
Modified pages (${modified.length}): ${modified.map((r) => r.url).join(', ') || 'None'}

Format:
English summary here.
한국어 요약.`;

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
