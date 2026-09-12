#!/usr/bin/env node
/** Approve a story after reading it aloud:  npm run approve -- <id>
 *  Sets status on the story and the canon together, so the two cannot drift. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const ROOT = new URL('..', import.meta.url).pathname;
const id = process.argv.slice(2).filter(a => !a.startsWith('-'))[0];
if (!id) { console.error('usage: npm run approve -- <story-id>'); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);

const sp = join(ROOT, `content/stories/${id}.json`);
const s = JSON.parse(readFileSync(sp, 'utf8'));

const fail = msg => { console.error(`${id}: ${msg}`); process.exit(1); };
const countWords = r => r.blocks
  .filter(b => b.t !== 'aside')
  .reduce((n, b) => n + (b.text ?? '').replace(/[«»_]/g, '').split(/\s+/).filter(Boolean).length, 0);
const readMinutes = r => Math.round(
  countWords(r) / 110 + r.blocks.filter(b => b.t === 'beat').length * 0.05
);
const gates = {
  short: { minutes: 3, minWords: 300, maxWords: 360 },
  full:  { minutes: 6, minWords: 650, maxWords: 680 },
};

if (s.status !== 'in-review')
  fail(`approve only accepts status "in-review"; found "${s.status}"`);
if (!s.source.sourcing?.length)
  fail('no sourcing block — claim whitelist must exist before publication');
if (!s.source.checkedAgainst?.length)
  fail('no checkedAgainst — name the edition/witness first');
if (!s.lengths.short)
  fail('no short rendition — publication requires the independently-written 3-minute telling');
if (!s.lengths.full)
  fail('no full rendition');

for (const [len, gate] of Object.entries(gates)) {
  const r = s.lengths[len];
  const words = countWords(r);
  const spoken = readMinutes(r);
  if (r.minutes !== gate.minutes)
    fail(`${len} declares ${r.minutes} minutes; publication requires ${gate.minutes}`);
  if (words < gate.minWords || words > gate.maxWords)
    fail(`${len} has ${words} spoken words; publication requires ${gate.minWords}–${gate.maxWords}`);
  if (spoken !== gate.minutes)
    fail(`${len} reads as ${spoken} minutes at bedtime pace; publication requires ${gate.minutes}`);
}

// Publication is forbidden unless the whole repository is already strict-clean.
const preflight = spawnSync(
  process.execPath,
  [join(ROOT, 'scripts/validate.mjs'), '--strict'],
  { stdio: 'inherit' }
);
if (preflight.status !== 0)
  fail('strict validation failed — publication aborted');

s.status = 'published';
s.source.reviewedBy = process.env.REVIEWER ?? 'rama';
s.source.reviewedOn = today;
writeFileSync(sp, JSON.stringify(s, null, 2) + '\n');

const cp = join(ROOT, 'content/canon.json');
const c = JSON.parse(readFileSync(cp, 'utf8'));
const row = c.canon.find(r => r.id === id);
if (!row) { console.error(`${id} is not in the canon`); process.exit(1); }
row.status = 'published';
writeFileSync(cp, JSON.stringify(c, null, 2) + '\n');
console.log(`${id} published — reviewed by ${s.source.reviewedBy} on ${today}`);
