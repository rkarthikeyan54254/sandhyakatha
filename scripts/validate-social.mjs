#!/usr/bin/env node
/**
 * Validate content/social.json against the published corpus.
 *
 * Checks:
 *   - every published story has a curated reel sequence
 *   - social entries refer only to canon stories
 *   - indexes count only narrative short blocks (p + slow)
 *   - indexes exist and are not repeated
 *   - modes and optional presentation overrides are valid
 *
 *   node scripts/validate-social.mjs
 *   node scripts/validate-social.mjs --verbose
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const verbose = process.argv.includes('--verbose');

const canon = read('content/canon.json').canon;
const social = read('content/social.json');
const entries = social.stories ?? {};
const canonById = new Map(canon.map(c => [c.id, c]));
const published = canon.filter(c => c.status === 'published');

const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const narrativeBlocks = s => s.lengths.short.blocks.filter(b => b.t === 'p' || b.t === 'slow');

for (const c of published) {
  const cfg = entries[c.id]?.reel;
  if (!cfg?.blocks?.length) {
    err(c.id, 'published story has no curated reel.blocks entry');
    continue;
  }

  let story;
  try {
    story = read(`content/stories/${c.id}.json`);
  } catch (e) {
    err(c.id, `story file cannot be read — ${e.message}`);
    continue;
  }

  const blocks = narrativeBlocks(story);
  const seen = new Set();

  if (cfg.blocks.length < 3 || cfg.blocks.length > 6)
    err(c.id, `reel should select 3–6 narrative beats; found ${cfg.blocks.length}`);

  cfg.blocks.forEach((spec, i) => {
    const at = `reel.blocks[${i}]`;
    if (!Number.isInteger(spec.index)) {
      err(c.id, `${at}.index must be an integer`);
      return;
    }
    if (spec.index < 0 || spec.index >= blocks.length) {
      err(c.id, `${at}.index ${spec.index} is outside 0..${blocks.length - 1}`);
      return;
    }
    if (seen.has(spec.index))
      err(c.id, `${at}.index ${spec.index} is selected more than once`);
    seen.add(spec.index);

    const mode = spec.mode ?? 'full';
    if (!['full', 'firstSentence'].includes(mode))
      err(c.id, `${at}.mode "${mode}" is not supported`);

    if (spec.size != null &&
        (!Number.isFinite(spec.size) || spec.size < 42 || spec.size > 68))
      err(c.id, `${at}.size must be between 42 and 68`);

    if (spec.color != null &&
        !/^#[0-9a-f]{6}$/i.test(spec.color))
      err(c.id, `${at}.color must be a six-digit hex colour`);

    if (verbose) {
      const text = blocks[spec.index].text
        .replace(/[«»]/g, '')
        .replace(/_([^_]+)_/g, '$1');
      console.log(`${c.id} [${i + 1}] #${spec.index} ${mode}: ${text}`);
    }
  });
}

for (const id of Object.keys(entries)) {
  const c = canonById.get(id);
  if (!c) err(id, 'social entry is not present in canon.json');
  else if (c.status !== 'published')
    err(id, `social entry exists but canon status is "${c.status}", not "published"`);
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\nFAILED — ${errors.length} social configuration error(s)`);
  process.exit(1);
}

console.log(
  `social.json OK — ${published.length} published stories, ` +
  `${Object.keys(entries).length} curated reel sequences`
);
