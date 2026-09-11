#!/usr/bin/env node
/** Freezes the text of every story so a later edit cannot pass unnoticed.
 *  Run after an approved change: node scripts/lock.mjs   */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const dir = join(ROOT, 'content/stories');
const lockPath = join(ROOT, 'content/content.lock.json');
const previous = existsSync(lockPath)
  ? JSON.parse(readFileSync(lockPath, 'utf8'))
  : null;
const out = { generated: new Date().toISOString().slice(0, 10), stories: {} };
for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const s = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  out.stories[s.id] = {
    version: s.version,
    status: s.status,
    hash: createHash('sha256').update(JSON.stringify(s.lengths) + JSON.stringify(s.close)).digest('hex').slice(0, 16)
  };
}

// The lock date describes the last content-lock change, not the day CI happened
// to run. Preserve it when every story's version/status/hash is unchanged so a
// non-content commit on a new calendar day does not make the lockfile stale.
if (previous && JSON.stringify(previous.stories) === JSON.stringify(out.stories))
  out.generated = previous.generated ?? out.generated;

writeFileSync(lockPath, JSON.stringify(out, null, 2) + '\n');
console.log(`locked ${Object.keys(out.stories).length} stories`);
