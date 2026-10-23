import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Gated stories belong in the shared reader corpus, never the public archive. */
export function runtimeLocaleEditions(root, publicConfig) {
  const editions = [...(publicConfig.editions ?? [])];
  const seen = new Set(editions.map(row => `${row.locale}/${row.storyId}`));
  for (const file of readdirSync(join(root, 'content/stories')).filter(f => f.endsWith('.json')).sort()) {
    const story = JSON.parse(readFileSync(join(root, 'content/stories', file), 'utf8'));
    if (story.status !== 'published' || !story.audience?.gated) continue;
    for (const locale of ['hi-IN', 'ta-IN']) {
      const key = `${locale}/${story.id}`;
      if (!seen.has(key)) { editions.push({ storyId: story.id, locale }); seen.add(key); }
    }
  }
  return editions;
}
