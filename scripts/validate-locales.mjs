#!/usr/bin/env node
/**
 * Validates independently-reviewed locale editions.
 *
 * This does NOT certify native quality or source fidelity. It enforces the
 * contract around those human reviews: exact canonical source linkage,
 * canonical entity markers, claim traceability, review state and locale locks.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { gitBlobSha1, localeContentHash } from './lib/locale-content.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const STRICT = process.argv.includes('--strict');
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const errors = [], warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const schema = read('schema/story-locale.schema.json');
const lexicon = read('content/lexicon.json');
const lock = existsSync(join(ROOT, 'content/locale.lock.json'))
  ? read('content/locale.lock.json')
  : { locales: {} };
const ajv = addFormats(new Ajv({ allErrors: true, strict: false }));
const validate = ajv.compile(schema);
const lexKeys = new Set(Object.keys(lexicon).filter(k => k !== '_readme'));
const scriptFor = {
  hi: /\p{Script=Devanagari}/u,
  ta: /\p{Script=Tamil}/u
};

const root = join(ROOT, 'content/locales');
const docs = new Map();
let awaiting = 0;

function localeFiles() {
  if (!existsSync(root)) return [];
  const out = [];
  for (const lang of readdirSync(root, { withFileTypes: true })) {
    if (!lang.isDirectory()) continue;
    for (const f of readdirSync(join(root, lang.name)).filter(x => x.endsWith('.json')).sort())
      out.push([lang.name, f]);
  }
  return out;
}

function textFields(doc) {
  const out = [doc.register, doc.title, doc.tease, doc.parentNote, doc.traditionNote,
    doc.close.question, doc.close.seed,
    ...doc.close.ifTheyAsk.flatMap(x => [x.q, x.a])];
  for (const r of Object.values(doc.lengths))
    for (const b of r.blocks) if (b.t !== 'beat') out.push(b.text);
  return out;
}

function checkMarkup(where, text, doc) {
  const opens = (text.match(/«/g) ?? []).length;
  const closes = (text.match(/»/g) ?? []).length;
  if (opens !== closes) err(where, 'unbalanced guillemets');
  if (((text.match(/_/g) ?? []).length) % 2) err(where, 'unbalanced _speech/emphasis_ markers');
  if (/<[a-z/!]/i.test(text)) err(where, 'HTML is not allowed');
  if (/\bhttps?:\/\//.test(text)) err(where, 'links are not allowed');
  for (const m of text.matchAll(/«([^»]+)»/g)) {
    const term = m[1];
    if (!lexKeys.has(term)) err(where, `«${term}» is not a canonical lexicon key`);
    if (!doc.displayNames[term]) err(where, `«${term}» has no ${doc.locale} displayNames entry`);
  }
}

function checkClaimRefs(where, refs, count) {
  for (const n of refs)
    if (!Number.isInteger(n) || n < 0 || n >= count)
      err(where, `source claim ${n} is outside canonical source.sourcing[0..${count - 1}]`);
}

function gateApproved(where, gate) {
  if (gate.status !== 'approved') err(where, `must be approved before locale status can be approved`);
  if (!gate.reviewer?.trim()) err(where, 'approved review is missing reviewer');
  if (!gate.reviewedOn) err(where, 'approved review is missing reviewedOn');
}

for (const [langDir, file] of localeFiles()) {
  const rel = `content/locales/${langDir}/${file}`;
  let doc;
  try { doc = read(rel); }
  catch (e) { err(rel, `invalid JSON — ${e.message}`); continue; }

  if (!validate(doc)) {
    for (const e of validate.errors) err(rel, `${e.instancePath || '/'} ${e.message}`);
    continue;
  }

  const key = `${doc.locale}/${doc.storyId}`;
  if (docs.has(key)) err(rel, `duplicate locale edition ${key}`);
  docs.set(key, doc);
  if (langDir !== doc.language) err(rel, `directory ${langDir} does not match language ${doc.language}`);
  if (!doc.locale.startsWith(`${doc.language}-`)) err(rel, `locale ${doc.locale} does not match language ${doc.language}`);
  if (basename(file, '.json') !== doc.storyId) err(rel, `filename does not match storyId ${doc.storyId}`);

  const storyRel = `content/stories/${doc.storyId}.json`;
  if (!existsSync(join(ROOT, storyRel))) { err(rel, `canonical story ${storyRel} is missing`); continue; }
  const sourceText = readFileSync(join(ROOT, storyRel), 'utf8');
  const source = JSON.parse(sourceText);
  if (source.status !== 'published') err(rel, `locale edition points to canonical story status ${source.status}, not published`);
  if (source.version !== doc.sourceVersion) err(rel, `sourceVersion ${doc.sourceVersion} does not match canonical v${source.version}`);
  const blob = gitBlobSha1(sourceText);
  if (blob !== doc.sourceBlobSha1)
    err(rel, `canonical story bytes changed (${doc.sourceBlobSha1.slice(0, 8)} → ${blob.slice(0, 8)}); locale requires source review`);

  const script = scriptFor[doc.language];
  if (!script) err(rel, `no script-validation policy exists yet for language ${doc.language}`);
  else {
    for (const field of [doc.register, doc.title, doc.tease])
      if (!script.test(field)) err(rel, `register/title/tease must contain ${doc.language} script`);
    for (const [term, display] of Object.entries(doc.displayNames)) {
      if (!lexKeys.has(term)) err(rel, `displayNames key "${term}" is not canonical lexicon`);
      if (!script.test(display)) err(rel, `displayNames.${term} is not written in ${doc.language} script`);
    }
  }

  for (const text of textFields(doc)) checkMarkup(rel, text, doc);

  const claimCount = source.source?.sourcing?.length ?? 0;
  if (!claimCount) err(rel, 'canonical story has no source.sourcing ledger');
  checkClaimRefs(`${rel} sourceMap.tease`, doc.sourceMap.tease, claimCount);
  checkClaimRefs(`${rel} sourceMap.parentNote`, doc.sourceMap.parentNote, claimCount);
  checkClaimRefs(`${rel} sourceMap.traditionNote`, doc.sourceMap.traditionNote, claimCount);
  for (const [scene, refs] of Object.entries(doc.sourceMap.scenes))
    checkClaimRefs(`${rel} sourceMap.scenes.${scene}`, refs, claimCount);
  for (const [i, refs] of doc.sourceMap.ifTheyAsk.entries())
    checkClaimRefs(`${rel} sourceMap.ifTheyAsk[${i}]`, refs, claimCount);
  if (doc.sourceMap.ifTheyAsk.length !== doc.close.ifTheyAsk.length)
    err(rel, `sourceMap.ifTheyAsk has ${doc.sourceMap.ifTheyAsk.length} entries but close.ifTheyAsk has ${doc.close.ifTheyAsk.length}`);

  const usedScenes = new Set();
  for (const [len, r] of Object.entries(doc.lengths)) {
    const where = `${rel} [${len}]`;
    const slow = r.blocks.filter(b => b.t === 'slow');
    if (slow.length !== 1) err(where, `${slow.length} slow blocks — exactly one is required`);
    if (r.blocks.at(-1)?.t !== 'slow') err(where, 'last block must be slow');
    if (r.blocks[0]?.t === 'beat') err(where, 'rendition cannot open on a beat');
    r.blocks.forEach((b, i) => {
      usedScenes.add(b.scene);
      if (!doc.sourceMap.scenes[b.scene]) err(where, `block ${i} scene "${b.scene}" has no sourceMap claim refs`);
      if (b.t === 'beat' && r.blocks[i + 1]?.t === 'beat') err(where, `block ${i}: consecutive beats`);
      if (b.t !== 'beat' && script && !script.test(b.text.replace(/«[^»]+»/g, '')))
        err(where, `block ${i} has no ${doc.language} script outside canonical entity markers`);
    });
    const readGate = doc.review.nativeReadAloud[len];
    if (!readGate) err(where, `review.nativeReadAloud.${len} is required`);
    if (doc.status === 'approved') {
      gateApproved(`${where} native read-aloud`, readGate);
      if (!Number.isInteger(r.measuredSeconds) || r.measuredSeconds < 1)
        err(where, 'approved rendition requires measuredSeconds from the native read-aloud');
    }
  }
  for (const scene of Object.keys(doc.sourceMap.scenes))
    if (!usedScenes.has(scene)) warn(rel, `sourceMap scene "${scene}" is not used by any localized block`);

  const renditionKeys = Object.keys(doc.lengths).sort();
  const reviewKeys = Object.keys(doc.review.nativeReadAloud).sort();
  if (JSON.stringify(renditionKeys) !== JSON.stringify(reviewKeys))
    err(rel, `nativeReadAloud review keys ${reviewKeys.join(',')} must exactly match rendition keys ${renditionKeys.join(',')}`);

  const hash = localeContentHash(doc);
  const locked = lock.locales?.[key];
  if (doc.status === 'approved') {
    gateApproved(`${rel} languageEditor`, doc.review.languageEditor);
    gateApproved(`${rel} sourceFidelity`, doc.review.sourceFidelity);
    if (!locked) err(rel, `approved locale is not in content/locale.lock.json — run npm run lock:locales after approval`);
    else {
      if (locked.hash !== hash) err(rel, `approved locale text changed since lock (${locked.hash} → ${hash})`);
      if (locked.sourceVersion !== doc.sourceVersion) err(rel, 'locale lock sourceVersion is stale');
    }
  } else {
    awaiting += 1;
    if (locked) err(rel, `non-approved locale still has an approval lock — run npm run lock:locales`);
  }
}

for (const key of Object.keys(lock.locales ?? {}))
  if (!docs.has(key)) err('content/locale.lock.json', `orphan locale lock ${key}`);

if (warnings.length) {
  for (const w of warnings) console.warn(`WARN locale: ${w}`);
  if (STRICT) errors.push(...warnings.map(w => `strict warning: ${w}`));
}
if (errors.length) {
  for (const e of errors) console.error(`ERROR locale: ${e}`);
  console.error(`FAILED — ${errors.length} locale error(s)`);
  process.exit(1);
}
console.log(`locale editions: ${docs.size} · approved ${docs.size - awaiting} · awaiting human review ${awaiting}`);
console.log(`OK — ${warnings.length} warning(s)`);
