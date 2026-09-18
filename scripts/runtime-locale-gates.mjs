#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { localeLanguage, publicLocaleHref } from './lib/locale-paths.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const errors = [];
const fail = message => errors.push(message);

const cfg = read('content/locale-public.json');
const catalogPath = join(ROOT, 'public/data/locale-catalog.json');
if (!existsSync(catalogPath)) fail('public/data/locale-catalog.json missing');
const catalog = existsSync(catalogPath) ? read('public/data/locale-catalog.json') : { locales:{} };

if (catalog.schemaVersion !== '1.0') fail('runtime locale catalog schemaVersion must be 1.0');

const expected = new Set((cfg.editions ?? []).map(row => `${row.locale}/${row.storyId}`));
const actual = new Set();

for (const [locale, entry] of Object.entries(catalog.locales ?? {})) {
  const lang = localeLanguage(locale);
  if (entry.language !== lang) fail(`${locale}: runtime language mismatch`);
  for (const story of entry.stories ?? []) {
    const key = `${locale}/${story.id}`;
    actual.add(key);
    const path = join(ROOT, 'public/data/l', lang, `${story.id}.json`);
    if (!existsSync(path)) {
      fail(`${key}: runtime locale story JSON missing`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const doc = JSON.parse(text);
    const revision = createHash('sha256').update(text).digest('hex').slice(0,12);
    if (story.storyRevision !== revision)
      fail(`${key}: storyRevision does not match runtime JSON`);
    if (doc.id !== story.id || doc.locale !== locale || doc.language !== lang)
      fail(`${key}: runtime story identity mismatch`);
    if (doc.publicPath !== publicLocaleHref(story.id,locale))
      fail(`${key}: runtime publicPath mismatch`);
    if (doc.title !== story.title || doc.tease !== story.tease)
      fail(`${key}: runtime card/story locale text mismatch`);
    if (!doc.lengths?.short || Object.keys(doc.lengths).some(k => k !== 'short'))
      fail(`${key}: runtime locale may expose reviewed short edition only`);
    if (!Number.isInteger(doc.lengths.short.measuredSeconds))
      fail(`${key}: measured read-aloud seconds missing`);
    if (!doc.displayNames || typeof doc.displayNames !== 'object')
      fail(`${key}: localized display-name map missing`);
  }
}

for (const key of expected) if (!actual.has(key)) fail(`${key}: missing from runtime locale catalog`);
for (const key of actual) if (!expected.has(key)) fail(`${key}: non-public locale leaked into runtime catalog`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR runtime locale gate: ${error}`);
  process.exit(1);
}
console.log(`runtime locale gates: PASS — ${actual.size} approved/locked public edition(s); reviewed short text only; canonical story ids preserved`);
