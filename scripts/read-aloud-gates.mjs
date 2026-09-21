#!/usr/bin/env node
/**
 * Read-aloud clarity report.
 *
 * Report-only while the existing corpus is being remediated. It surfaces
 * phrases that usually belong in a parent/source lane and unusually long
 * sentences. Existing publication/source/locale gates remain authoritative.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const INTERNAL = [
  /source label must be exact/i,
  /chosen witness/i,
  /witness chosen/i,
  /we are following/i,
  /our version/i,
  /our illustration/i,
  /bedtime narrator/i,
  /selected source/i,
  /for a bedtime story/i,
  /source summary/i,
  /we can report that/i,
  /precise wording is enough/i,
  /this telling avoids/i,
  /does not give us permission/i,
];

function sentences(text) {
  return String(text ?? '')
    .replace(/_[^_]+_/g, m => m.slice(1, -1))
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}
function words(s) {
  return s.replace(/[«»_]/g, '').trim().split(/\s+/).filter(Boolean).length;
}

const files = readdirSync(join(ROOT, 'content/stories'))
  .filter(x => x.endsWith('.json'))
  .sort();

let editorialLane = 0;
let longSentences = 0;

for (const file of files) {
  const s = read(`content/stories/${file}`);
  if (s.status !== 'published') continue;
  for (const [len, rendition] of Object.entries(s.lengths ?? {})) {
    for (const [i, block] of (rendition.blocks ?? []).entries()) {
      if (!block.text || block.t === 'aside') continue;
      if (INTERNAL.some(p => p.test(block.text))) {
        editorialLane += 1;
        console.log(`EDITORIAL-LANE ${s.id} [${len}] block ${i}`);
      }
      for (const sentence of sentences(block.text)) {
        const n = words(sentence);
        if (n > 38) {
          longSentences += 1;
          console.log(`LONG-SENTENCE ${s.id} [${len}] block ${i}: ${n} words`);
        }
      }
    }
  }
}

console.log(`read-aloud report: ${editorialLane} editorial-lane candidate(s) · ${longSentences} sentence(s) over 38 words`);
console.log('REPORT ONLY — no publication gate is changed by this script yet.');
