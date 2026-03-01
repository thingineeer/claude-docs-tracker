import type { PipelineResult } from '@/crawler/pipeline';
import { getTodayString } from '@/lib/timezone';

export interface BreakingChangeInfo {
  pageTitle: string;
  pageUrl: string;
  changeType: string;
  matchedKeywords: string[];
  detectedAt: string;
}

export async function sendNotifications(result: PipelineResult): Promise<void> {
  const promises: Promise<void>[] = [];

  if (process.env.WEBHOOK_DISCORD_URL) {
    promises.push(sendDiscordNotification(result));
  }

  if (process.env.WEBHOOK_SLACK_URL) {
    promises.push(sendSlackNotification(result));
  }

  await Promise.allSettled(promises);
}

export async function sendBreakingChangeAlert(changes: BreakingChangeInfo[]): Promise<void> {
  if (changes.length === 0) return;

  const promises: Promise<void>[] = [];

  if (process.env.WEBHOOK_DISCORD_URL) {
    promises.push(sendDiscordBreakingAlert(changes));
  }
  if (process.env.WEBHOOK_SLACK_URL) {
    promises.push(sendSlackBreakingAlert(changes));
  }

  await Promise.allSettled(promises);
}

export async function sendCrawlFailureAlert(error: unknown): Promise<void> {
  const promises: Promise<void>[] = [];

  if (process.env.WEBHOOK_DISCORD_URL) {
    promises.push(sendDiscordCrawlFailure(error));
  }
  if (process.env.WEBHOOK_SLACK_URL) {
    promises.push(sendSlackCrawlFailure(error));
  }

  await Promise.allSettled(promises);
}

async function sendDiscordCrawlFailure(error: unknown): Promise<void> {
  const url = process.env.WEBHOOK_DISCORD_URL;
  if (!url) return;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const embed = {
    title: 'Crawl Pipeline Failed',
    color: 0xf59e0b,
    fields: [
      { name: 'Error', value: errorMessage.slice(0, 1024), inline: false },
      ...(errorStack
        ? [{ name: 'Stack', value: `\`\`\`\n${errorStack.slice(0, 900)}\n\`\`\``, inline: false }]
        : []),
    ],
    timestamp: new Date().toISOString(),
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function sendSlackCrawlFailure(error: unknown): Promise<void> {
  const url = process.env.WEBHOOK_SLACK_URL;
  if (!url) return;

  const errorMessage = error instanceof Error ? error.message : String(error);

  const payload = {
    attachments: [
      {
        color: '#F59E0B',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: 'Crawl Pipeline Failed' },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Error:*\n${errorMessage.slice(0, 1024)}` },
              { type: 'mrkdwn', text: `*Time:* ${new Date().toISOString()}` },
            ],
          },
        ],
      },
    ],
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function sendDiscordNotification(result: PipelineResult): Promise<void> {
  const url = process.env.WEBHOOK_DISCORD_URL;
  if (!url) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';
  const today = getTodayString();

  const embed = {
    title: 'Claude Patch Notes - Daily Update',
    url: `${siteUrl}/changes/${today}`,
    color: 0xd97757,
    fields: [
      { name: 'New Pages', value: String(result.newPages), inline: true },
      { name: 'Modified', value: String(result.modifiedPages), inline: true },
      { name: 'Errors', value: String(result.errors), inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function sendSlackNotification(result: PipelineResult): Promise<void> {
  const url = process.env.WEBHOOK_SLACK_URL;
  if (!url) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';
  const today = getTodayString();

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Claude Patch Notes - Daily Update' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*New Pages:* ${result.newPages}` },
          { type: 'mrkdwn', text: `*Modified:* ${result.modifiedPages}` },
          { type: 'mrkdwn', text: `*Errors:* ${result.errors}` },
          { type: 'mrkdwn', text: `*Total URLs:* ${result.totalUrls}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Changes' },
            url: `${siteUrl}/changes/${today}`,
          },
        ],
      },
    ],
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function sendDiscordBreakingAlert(changes: BreakingChangeInfo[]): Promise<void> {
  const url = process.env.WEBHOOK_DISCORD_URL;
  if (!url) return;

  const fields = changes.map((change) => ({
    name: change.pageTitle,
    value: [
      `**URL:** ${change.pageUrl}`,
      `**Type:** ${change.changeType}`,
      `**Keywords:** ${change.matchedKeywords.join(', ')}`,
      `**Detected:** ${change.detectedAt}`,
    ].join('\n'),
    inline: false,
  }));

  const embed = {
    title: '\u26a0\ufe0f Breaking Change Detected',
    color: 0xff0000,
    fields,
    timestamp: new Date().toISOString(),
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

async function sendSlackBreakingAlert(changes: BreakingChangeInfo[]): Promise<void> {
  const url = process.env.WEBHOOK_SLACK_URL;
  if (!url) return;

  const sections = changes.map((change) => ({
    type: 'section' as const,
    fields: [
      { type: 'mrkdwn' as const, text: `*Page:* <${change.pageUrl}|${change.pageTitle}>` },
      { type: 'mrkdwn' as const, text: `*Type:* ${change.changeType}` },
      { type: 'mrkdwn' as const, text: `*Keywords:* ${change.matchedKeywords.join(', ')}` },
      { type: 'mrkdwn' as const, text: `*Detected:* ${change.detectedAt}` },
    ],
  }));

  const payload = {
    attachments: [
      {
        color: '#FF0000',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: 'Breaking Change Detected' },
          },
          ...sections,
        ],
      },
    ],
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
