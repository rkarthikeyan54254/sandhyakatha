#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renditionParityErrors } from './lib/rendition-parity.mjs';

const root = new URL('..', import.meta.url).pathname;
const read = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const rows = [];
for (const file of readdirSync(join(root, 'content/stories')).filter(f => f.endsWith('.json')).sort()) {
  const story = read(`content/stories/${file}`);
  if (story.status !== 'published') continue;
  for (const language of ['hi', 'ta']) {
    const path = `content/locales/${language}/${story.id}.json`;
    const doc = existsSync(join(root, path)) ? read(path) : null;
    rows.push({ storyId: story.id, corpus: story.source.corpus, language,
      gated: Boolean(story.audience?.gated),
      canonicalLengths: Object.keys(story.lengths),
      localeLengths: Object.keys(doc?.lengths ?? {}),
      missingLengths: Object.keys(story.lengths).filter(key => !doc?.lengths?.[key]),
      errors: doc ? renditionParityErrors(story, doc) : ['missing locale edition'] });
  }
}
const report = { generatedAt: new Date().toISOString(),
  scope: 'Every published canonical story, including gated stories; Hindi and Tamil rendition/timing/review/follow-up parity. Not a semantic quality certificate.',
  publishedStories: rows.length / 2, localeEditions: rows.length,
  editionsWithErrors: rows.filter(r => r.errors.length).length,
  missingFull: rows.filter(r => r.missingLengths.includes('full')).length,
  rows };
const out = join(root, 'studio/locale-parity');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, rows: undefined }, null, 2));
