#!/usr/bin/env node
/** Freeze approved locale bytes after all human review gates pass. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { localeContentHash } from './lib/locale-content.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const localeRoot = join(ROOT, 'content/locales');
const lockPath = join(ROOT, 'content/locale.lock.json');
const previous = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : null;
const out = { generated: new Date().toISOString().slice(0, 10), locales: {} };

if (existsSync(localeRoot)) {
  for (const lang of readdirSync(localeRoot, { withFileTypes: true })) {
    if (!lang.isDirectory()) continue;
    for (const f of readdirSync(join(localeRoot, lang.name)).filter(x => x.endsWith('.json')).sort()) {
      const doc = JSON.parse(readFileSync(join(localeRoot, lang.name, f), 'utf8'));
      if (doc.status !== 'approved') continue;
      const key = `${doc.locale}/${doc.storyId}`;
      out.locales[key] = {
        sourceVersion: doc.sourceVersion,
        status: doc.status,
        hash: localeContentHash(doc)
      };
    }
  }
}

if (previous && JSON.stringify(previous.locales ?? {}) === JSON.stringify(out.locales))
  out.generated = previous.generated ?? out.generated;
writeFileSync(lockPath, JSON.stringify(out, null, 2) + '\n');
console.log(`locked ${Object.keys(out.locales).length} approved locale edition(s)`);
