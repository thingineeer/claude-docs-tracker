/**
 * One-time migration script to fix HTML entities in existing page titles.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | grep -v '^$' | xargs) && node scripts/fix-html-entities.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10)),
  );
  return decoded;
}

async function fixEntities() {
  console.log('=== Fix HTML Entities in Page Titles ===\n');

  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, title')
    .or('title.like.%&#%,title.like.%&amp;%,title.like.%&lt;%,title.like.%&gt;%,title.like.%&quot;%');

  if (error) {
    console.error('Failed to fetch pages:', error.message);
    process.exit(1);
  }

  if (!pages || pages.length === 0) {
    console.log('No pages with HTML entities found.');
    return;
  }

  console.log(`Found ${pages.length} pages with potential HTML entities:\n`);

  let updated = 0;
  for (const page of pages) {
    const decoded = decodeHtmlEntities(page.title);
    if (decoded !== page.title) {
      console.log(`  "${page.title}" -> "${decoded}"`);
      const { error: updateErr } = await supabase
        .from('pages')
        .update({ title: decoded })
        .eq('id', page.id);

      if (updateErr) {
        console.error(`  Failed: ${updateErr.message}`);
      } else {
        updated++;
      }
    }
  }

  console.log(`\nUpdated ${updated} page titles.`);
}

fixEntities().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
