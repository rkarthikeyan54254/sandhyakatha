#!/usr/bin/env node
/** Approve a story after reading it aloud:  npm run approve -- <id>
 *  Sets status on the story and the canon together, so the two cannot drift. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const id = process.argv.slice(2).filter(a => !a.startsWith('-'))[0];
if (!id) { console.error('usage: npm run approve -- <story-id>'); process.exit(1); }
const today = new Date().toISOString().slice(0, 10);

const sp = join(ROOT, `content/stories/${id}.json`);
const s = JSON.parse(readFileSync(sp, 'utf8'));
if (!s.source.checkedAgainst?.length) { console.error(`${id}: no checkedAgainst — name the edition first`); process.exit(1); }
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
