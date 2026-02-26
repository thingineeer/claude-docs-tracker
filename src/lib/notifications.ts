import type { PipelineResult } from '@/crawler/pipeline';

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

async function sendDiscordNotification(result: PipelineResult): Promise<void> {
  const url = process.env.WEBHOOK_DISCORD_URL;
  if (!url) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claude-docs-tracker.vercel.app';
  const today = new Date().toISOString().split('T')[0];

  const embed = {
    title: 'Claude Docs Tracker - Daily Update',
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
  const today = new Date().toISOString().split('T')[0];

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Claude Docs Tracker - Daily Update' },
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
