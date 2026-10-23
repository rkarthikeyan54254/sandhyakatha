#!/usr/bin/env node
import { legacyParityEntry, runtimeRenditionKeys, releaseRenditionParityErrors } from './lib/release-rendition-parity.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { localeLanguage, publicLocaleHref } from './lib/locale-paths.mjs';
import { runtimeLocaleEditions } from './lib/runtime-locale-editions.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const errors = [];
const fail = message => errors.push(message);

const cfg = read('content/locale-public.json');
const catalogPath = join(ROOT, 'public/data/locale-catalog.json');
if (!existsSync(catalogPath)) fail('public/data/locale-catalog.json missing');
const catalog = existsSync(catalogPath) ? read('public/data/locale-catalog.json') : { locales:{} };

if (catalog.schemaVersion !== '1.0') fail('runtime locale catalog schemaVersion must be 1.0');

const expected = new Set(runtimeLocaleEditions(ROOT, cfg).map(row => `${row.locale}/${row.storyId}`));
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
    const source = read(`content/stories/${story.id}.json`);
    if (Boolean(doc.audience?.gated) !== Boolean(source.audience?.gated))
      fail(`${key}: runtime audience gate differs from canonical story`);
    const edition = read(`content/locales/${lang}/${story.id}.json`);
    for (const error of releaseRenditionParityErrors(ROOT, source, edition)) fail(`${key}: ${error}`);
    const legacy = legacyParityEntry(ROOT, source, edition);
    const expectedLengths = runtimeRenditionKeys(ROOT, source, edition);
    if (JSON.stringify(Object.keys(doc.lengths ?? {}).sort()) !== JSON.stringify(expectedLengths))
      fail(`${key}: runtime rendition keys must match canonical ${expectedLengths.join(',')}`);
    for (const length of expectedLengths) {
      const rendition = doc.lengths?.[length];
      if (!rendition) continue;
      if (JSON.stringify(rendition.blocks) !== JSON.stringify(edition.lengths?.[length]?.blocks))
        fail(`${key}/${length}: runtime text differs from reviewed locale text`);
      if (rendition.measuredSeconds !== edition.lengths?.[length]?.measuredSeconds ||
          !Number.isInteger(rendition.measuredSeconds) ||
          rendition.minutes !== Math.round(rendition.measuredSeconds / 60) ||
          (!legacy && rendition.minutes !== source.lengths[length].minutes))
        fail(`${key}/${length}: runtime timing does not match reviewed/canonical duration`);
      if (story.renditionMinutes?.[length] !== rendition.minutes)
        fail(`${key}/${length}: catalog rendition duration missing or mismatched`);
    }
    if (!doc.displayNames || typeof doc.displayNames !== 'object')
      fail(`${key}: localized display-name map missing`);
  }
}

for (const key of expected) if (!actual.has(key)) fail(`${key}: missing from runtime locale catalog`);
for (const key of actual) if (!expected.has(key)) fail(`${key}: non-eligible locale leaked into runtime catalog`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR runtime locale gate: ${error}`);
  process.exit(1);
}
console.log(`runtime locale gates: PASS — ${actual.size} approved/locked public edition(s); all reviewed renditions preserved; sealed legacy gaps tracked separately; canonical story ids preserved`);
