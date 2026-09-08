#!/usr/bin/env node
/** Freezes the text of every story so a later edit cannot pass unnoticed.
 *  Run after an approved change: node scripts/lock.mjs   */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const dir = join(ROOT, 'content/stories');
const out = { generated: new Date().toISOString().slice(0, 10), stories: {} };
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const s = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  out.stories[s.id] = {
    version: s.version,
    status: s.status,
    hash: createHash('sha256').update(JSON.stringify(s.lengths) + JSON.stringify(s.close)).digest('hex').slice(0, 16)
  };
}
writeFileSync(join(ROOT, 'content/content.lock.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`locked ${Object.keys(out.stories).length} stories`);
