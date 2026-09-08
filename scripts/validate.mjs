#!/usr/bin/env node
/**
 * Sandhya Katha content validator.
 *
 * Nothing here is style policing. Every rule exists because breaking it
 * would let us mislead a parent or mistell a story, and those are the two
 * failures this project cannot recover from.
 *
 *   node scripts/validate.mjs            check everything
 *   node scripts/validate.mjs --strict   warnings become errors (used in CI)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = new URL('..', import.meta.url).pathname;
const STRICT = process.argv.includes('--strict');
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const errors = [], warnings = [], pending = [], unused = [];
const err  = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const schema  = read('schema/story.schema.json');
const lexicon = read('content/lexicon.json');
const canon   = read('content/canon.json').canon;
const values  = read('content/values.json').values;
const lock    = existsSync(join(ROOT, 'content/content.lock.json')) ? read('content/content.lock.json') : { stories: {} };

const ajv = addFormats(new Ajv({ allErrors: true, strict: false }));
const validate = ajv.compile(schema);

const lexKeys = new Set(Object.keys(lexicon).filter(k => k !== '_readme'));
const canonById = new Map(canon.map(c => [c.id, c]));
const files = readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json')).sort();
const stories = new Map();
const usedTerms = new Set();

/* ---------- per story ---------- */
for (const file of files) {
  const at = `stories/${file}`;
  let s;
  try { s = read(`content/stories/${file}`); }
  catch (e) { err(at, `not valid JSON — ${e.message}`); continue; }

  if (!validate(s)) {
    for (const e of validate.errors) err(at, `${e.instancePath || '/'} ${e.message}`);
    continue;
  }
  if (s.id !== basename(file, '.json')) err(at, `id "${s.id}" does not match the filename`);
  if (stories.has(s.id)) err(at, `duplicate id "${s.id}"`);
  stories.set(s.id, s);

  // -- the trust rules --------------------------------------------------
  if (s.source.stability !== 'stable' && !s.source.traditionNote)
    err(at, `stability is "${s.source.stability}" so traditionNote is required — this is the rule the whole product rests on`);

  const flagged = (s.audience.sensitivity ?? []).length > 0 || s.audience.gated;
  if (flagged && !s.audience.careNote)
    err(at, 'sensitivity or gated is set, so careNote is required — a parent must never be ambushed at bedtime');

  if (s.status === 'published') {
    if (!s.source.checkedAgainst?.length) err(at, 'published without checkedAgainst — name the edition it was verified against');
    if (!s.source.reviewedBy)  err(at, 'published without reviewedBy');
    if (!s.source.reviewedOn)  err(at, 'published without reviewedOn');
  }

  // -- the read-aloud score ---------------------------------------------
  for (const [len, r] of Object.entries(s.lengths)) {
    const where = `${at} [${len}]`;
    const slow = r.blocks.filter(b => b.t === 'slow');
    if (slow.length !== 1) err(where, `${slow.length} slow blocks — there must be exactly one`);
    if (r.blocks.at(-1)?.t !== 'slow') err(where, 'the last block must be the slow block (it is the landing)');
    if (r.blocks[0]?.t === 'beat') err(where, 'a rendition cannot open on a pause');

    let words = 0;
    r.blocks.forEach((b, i) => {
      if (b.t === 'beat') {
        if (r.blocks[i + 1]?.t === 'beat') err(where, `block ${i}: two pauses in a row`);
        return;
      }
      const text = b.text ?? '';
      words += text.replace(/[«»_]/g, '').split(/\s+/).filter(Boolean).length;

      for (const m of text.matchAll(/«([^»]*)»/g)) {
        const term = m[1];
        if (!lexKeys.has(term)) err(where, `block ${i}: «${term}» is not a lexicon key`);
        else usedTerms.add(term);
      }
      const open = (text.match(/«/g) ?? []).length, close = (text.match(/»/g) ?? []).length;
      if (open !== close) err(where, `block ${i}: unbalanced guillemets`);
      if (((text.match(/_/g) ?? []).length) % 2) err(where, `block ${i}: unbalanced _emphasis_ markers`);
      if (/<[a-z/!]/i.test(text)) err(where, `block ${i}: HTML is not allowed in story text`);
      if (/\bhttps?:\/\//.test(text)) err(where, `block ${i}: links are not allowed in story text`);
      if (/[“”‘]/.test(text)) warn(where, `block ${i}: curly quotes — speech is marked with _underscores_, not quotation marks`);

      // A breath line is one thought. Five short sentences can be one thought;
      // sixty words never are. Measure length, not punctuation.
      const w = text.replace(/[«»_]/g, '').split(/\s+/).filter(Boolean).length;
      // Sentence count is a poor proxy — a run of short call-and-response
      // questions is one breath. Length is the honest signal.
      if (b.t === 'p' && w > 60) warn(where, `block ${i}: ${w} words — too much for one breath line, split it`);
    });

    // 130 wpm is a bedtime pace with pauses, not a newsreader's 150+
    // 110 wpm is a parent reading slowly to a child, and each printed beat is a real silence.
    const spoken = Math.round(words / 110 + r.blocks.filter(b => b.t === 'beat').length * 0.05);
    if (Math.abs(spoken - r.minutes) > Math.max(1, r.minutes * 0.25))
      warn(where, `minutes says ${r.minutes} but ${words} words reads as about ${spoken} at a bedtime pace`);
    if (r.words && Math.abs(r.words - words) > 15)
      warn(where, `words says ${r.words}, actual count is ${words}`);
  }

  if (s.lengths.short && s.lengths.full) {
    const t = l => JSON.stringify(s.lengths[l].blocks.map(b => b.text ?? ''));
    if (t('short') === t('full')) err(at, 'short and full are identical — each length is written, not truncated');
    const wc = l => s.lengths[l].blocks.reduce((n, b) => n + (b.text ?? '').split(/\s+/).length, 0);
    if (wc('short') >= wc('full')) err(at, 'the short rendition is not shorter than the full one');
  }

  // -- graph integrity ---------------------------------------------------
  for (const c of s.characters) {
    if (!lexKeys.has(c.ref)) err(at, `character ref "${c.ref}" is not a lexicon key`);
    else usedTerms.add(c.ref);
  }
  if (s.linked) {
    if (!canonById.has(s.linked.next)) err(at, `linked.next "${s.linked.next}" is not in the canon at all`);
    else if (!existsSync(join(ROOT, `content/stories/${s.linked.next}.json`))) pending.push(`${s.id} → ${s.linked.next}`);
  }

  for (const v of s.values) if (!values.includes(v)) warn(at, `value "${v}" is not in the controlled vocabulary`);

  // -- canon agreement ---------------------------------------------------
  const c = canonById.get(s.id);
  if (!c) err(at, 'not listed in content/canon.json');
  else {
    if (c.status !== s.status)   err(at, `status "${s.status}" but the canon says "${c.status}"`);
    if (c.minAge !== s.audience.minAge) err(at, `minAge ${s.audience.minAge} but the canon says ${c.minAge}`);
    if (c.gated !== !!s.audience.gated) err(at, `gated ${!!s.audience.gated} but the canon says ${c.gated}`);
    if (c.corpus !== s.source.corpus)     err(at, `corpus mismatch with the canon`);
    if (c.tradition !== s.source.tradition) err(at, `tradition mismatch with the canon`);
  }

  // -- published text is frozen unless the version moves ------------------
  const hash = createHash('sha256').update(JSON.stringify(s.lengths) + JSON.stringify(s.close)).digest('hex').slice(0, 16);
  const prev = lock.stories?.[s.id];
  if (prev && prev.hash !== hash && prev.version === s.version)
    err(at, `text changed but version is still ${s.version} — bump it, or any rendered audio silently goes stale`);
  if (s.audio) for (const [len, a] of Object.entries(s.audio)) {
    if (a.fromVersion !== s.version) warn(at, `audio [${len}] was rendered from v${a.fromVersion}, story is v${s.version} — stale, app will fall back to text`);
    if (!a.approved) warn(at, `audio [${len}] is not approved — a human must listen before it ships`);
  }
}

/* ---------- collection-wide ---------- */
const seenCanon = new Set();
for (const c of canon) {
  if (seenCanon.has(c.id)) err('canon.json', `duplicate id "${c.id}"`);
  seenCanon.add(c.id);
  if (c.gated && !c.careNote && !stories.has(c.id)) warn('canon.json', `"${c.id}" is gated but has no careNote yet`);
}
for (const k of lexKeys) if (!usedTerms.has(k)) unused.push(k);
for (const [k, v] of Object.entries(lexicon)) {
  if (k === '_readme') continue;
  if (!v.native || !(v.native.deva || v.native.taml))
    err('lexicon.json', `"${k}" has no native script — TTS will read the Latin and mispronounce it`);
  if (!v.say)   err('lexicon.json', `"${k}" has no say (respelling) — the parent needs it before they read aloud`);
  if (!v.gloss) err('lexicon.json', `"${k}" has no gloss`);
}

/* ---------- the constellation ---------- */
const rel = read('content/relations.json');
const placed = new Set(Object.values(rel.clusters).flat());
for (const [cluster, terms] of Object.entries(rel.clusters))
  for (const t of terms) if (!lexKeys.has(t)) err('relations.json', `cluster "${cluster}" places "${t}", which is not a lexicon key`);
for (const [a, b] of rel.edges) {
  if (!placed.has(a)) err('relations.json', `edge references "${a}", which is in no cluster`);
  if (!placed.has(b)) err('relations.json', `edge references "${b}", which is in no cluster`);
}

/* ---------- report ---------- */
const c = { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', x: '\x1b[0m' };
for (const w of warnings) console.log(`${c.y}warn${c.x}  ${w}`);
for (const e of errors)   console.log(`${c.r}ERROR${c.x} ${e}`);
console.log(`${c.d}—${c.x}`);
if (pending.length) console.log(`${c.d}${pending.length} linked story/stories not written yet: ${pending.join(', ')}${c.x}`);
if (unused.length) console.log(`${c.d}${unused.length} lexicon entries not yet used by a written story (expected while the corpus is young)${c.x}`);
console.log(`${files.length} written · ${canon.length} in the canon · ${lexKeys.size} lexicon entries`);
const fail = errors.length || (STRICT && warnings.length);
console.log(fail
  ? `${c.r}FAILED${c.x} — ${errors.length} error(s), ${warnings.length} warning(s)`
  : `${c.g}OK${c.x} — ${warnings.length} warning(s)`);
process.exit(fail ? 1 : 0);
