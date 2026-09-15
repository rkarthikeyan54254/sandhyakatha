#!/usr/bin/env node
/** Freeze approved locale bytes after all human review gates pass. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gitBlobSha1, localeContentHash } from './lib/locale-content.mjs';

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
      const gates = [
        ['languageEditor', doc.review?.languageEditor],
        ['sourceFidelity', doc.review?.sourceFidelity],
        ...Object.entries(doc.review?.nativeReadAloud ?? {}).map(([len, gate]) => [`nativeReadAloud.${len}`, gate])
      ];
      for (const [name, gate] of gates) {
        if (gate?.status !== 'approved' || !gate.reviewer?.trim() || !gate.reviewedOn)
          throw new Error(`${doc.locale}/${doc.storyId}: cannot lock — ${name} review is not fully approved`);
      }
      for (const [len, rendition] of Object.entries(doc.lengths ?? {})) {
        if (!Number.isInteger(rendition.measuredSeconds) || rendition.measuredSeconds < 1)
          throw new Error(`${doc.locale}/${doc.storyId}: cannot lock — ${len} has no measured native read-aloud duration`);
      }
      const sourcePath = join(ROOT, 'content/stories', `${doc.storyId}.json`);
      if (!existsSync(sourcePath)) throw new Error(`${doc.locale}/${doc.storyId}: cannot lock — canonical story is missing`);
      const sourceText = readFileSync(sourcePath, 'utf8');
      const source = JSON.parse(sourceText);
      if (source.version !== doc.sourceVersion) throw new Error(`${doc.locale}/${doc.storyId}: cannot lock — source version changed`);
      if (gitBlobSha1(sourceText) !== doc.sourceBlobSha1) throw new Error(`${doc.locale}/${doc.storyId}: cannot lock — canonical story bytes changed`);
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
