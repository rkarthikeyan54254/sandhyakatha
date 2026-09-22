#!/usr/bin/env node
/**
 * Enforce Sandhya Katha's forward three-language publication contract.
 *
 * Every canonical story whose status is "published" must have reviewed,
 * approved and locked Hindi + Tamil siblings against the exact canonical
 * bytes. Non-gated stories must also be on both public locale shelves.
 *
 * This intentionally does NOT auto-approve locale work. Human language,
 * native-read-aloud and source-fidelity review remain mandatory.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gitBlobSha1, localeContentHash } from './lib/locale-content.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const storyRoot = join(ROOT, 'content/stories');
const lock = read('content/locale.lock.json');
const publicCfg = read('content/locale-public.json');
const errors = [];
const fail = m => errors.push(m);
const required = [
  { locale: 'hi-IN', lang: 'hi' },
  { locale: 'ta-IN', lang: 'ta' }
];
const publicKeys = new Set(
  (publicCfg.editions ?? []).map(e => `${e.locale}/${e.storyId}`)
);

function approvedHumanGate(gate) {
  return gate?.status === 'approved' &&
    typeof gate.reviewer === 'string' &&
    gate.reviewer.trim().length > 0 &&
    Boolean(gate.reviewedOn);
}

let published = 0;
let checked = 0;

for (const file of readdirSync(storyRoot).filter(x => x.endsWith('.json')).sort()) {
  const storyPath = `content/stories/${file}`;
  const sourceText = readFileSync(join(ROOT, storyPath), 'utf8');
  const story = JSON.parse(sourceText);
  if (story.status !== 'published') continue;

  published += 1;
  const sourceHash = gitBlobSha1(sourceText);

  for (const { locale, lang } of required) {
    const key = `${locale}/${story.id}`;
    const rel = `content/locales/${lang}/${story.id}.json`;
    if (!existsSync(join(ROOT, rel))) {
      fail(`${story.id}: published story is missing ${locale} sibling`);
      continue;
    }

    const doc = read(rel);
    const locked = lock.locales?.[key];

    if (doc.status !== 'approved')
      fail(`${key}: published-story sibling is not approved`);
    if (doc.sourceVersion !== story.version)
      fail(`${key}: sourceVersion ${doc.sourceVersion} != canonical v${story.version}`);
    if (doc.sourceBlobSha1 !== sourceHash)
      fail(`${key}: locale is not reviewed against current canonical bytes`);

    const readGate = doc.review?.nativeReadAloud?.short;
    if (!approvedHumanGate(readGate))
      fail(`${key}: native short read-aloud lacks human approval`);
    if (!approvedHumanGate(doc.review?.languageEditor))
      fail(`${key}: language-editor gate lacks human approval`);
    if (!approvedHumanGate(doc.review?.sourceFidelity))
      fail(`${key}: source-fidelity gate lacks human approval`);
    if (!Number.isInteger(doc.lengths?.short?.measuredSeconds) ||
        doc.lengths.short.measuredSeconds < 1)
      fail(`${key}: approved sibling lacks measured native read-aloud timing`);

    const currentHash = localeContentHash(doc);
    if (!locked)
      fail(`${key}: approved sibling is not locale-locked`);
    else {
      if (locked.hash !== currentHash)
        fail(`${key}: locale lock does not match current reviewed bytes`);
      if (locked.sourceVersion !== story.version)
        fail(`${key}: locale lock sourceVersion is stale`);
    }

    if (!story.audience?.gated && !publicKeys.has(key))
      fail(`${key}: non-gated published story is missing from public locale shelf`);

    checked += 1;
  }
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR locale parity gate: ${e}`);
  console.error(`FAILED — ${errors.length} locale parity error(s)`);
  process.exit(1);
}

console.log(
  `locale parity gate: PASS — ${published} published canonical stories · ` +
  `${checked} required Hindi/Tamil siblings approved, current and locked`
);
