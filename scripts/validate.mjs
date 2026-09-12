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

// SANDHYAKATHA_HARD_EDITORIAL_GATES
// These are product invariants, not advisory targets.
// Once a story enters human review, the actual spoken text must satisfy them.
const LENGTH_GATES = Object.freeze({
  short: { minutes: 3, minWords: 300, maxWords: 360 },
  full:  { minutes: 6, minWords: 650, maxWords: 680 },
});
const REVIEW_READY = new Set(['in-review', 'published']);

// SANDHYAKATHA_LEGACY_LENGTH_RATCHET
// Exact pre-gate published bytes may remain live while deliberately remediated.
// This sealed set is generated once from content.lock. The baseline may SHRINK,
// but no new id/version/hash may ever be added without changing validator policy.
const SEALED_LEGACY_LENGTH_EXCEPTIONS = new Map([
  ['annapurna-bhiksha', { version: 1, hash: '7fe3c2185b4ca32d' }],
  ['durga-mahishasura', { version: 2, hash: '8f4ec0e495222777' }],
  ['ekalavya-thumb', { version: 1, hash: '176e56c5f5a693b8' }],
  ['ganesha-circles', { version: 3, hash: 'f2bcbb0b40f7100b' }],
  ['govardhana', { version: 2, hash: 'f7255d433f914a35' }],
  ['guha-boatman', { version: 1, hash: 'f02e078b6f1f668e' }],
  ['kali-stops', { version: 1, hash: '046b472407b255bf' }],
  ['pusalar-temple', { version: 2, hash: '5eddd52967c917b8' }],
  ['rama-returns', { version: 1, hash: '426730455bbc0e1f' }],
  ['satyakama-truth', { version: 2, hash: '38d9ece4cf1fc37c' }],
  ['shabari-berries', { version: 1, hash: 'ae6f2aa89fbbf94d' }],
  ['shakambhari', { version: 1, hash: 'b96915cf09ca676f' }],
  ['shravana-baskets', { version: 1, hash: '867d0086be89788e' }],
  ['squirrel-setu', { version: 1, hash: 'ed837cd445d6b263' }],
  ['yaksha-lake', { version: 1, hash: '07765163752fa510' }]
]);

const lengthBaseline = existsSync(join(ROOT, 'content/editorial-length-baseline.json'))
  ? read('content/editorial-length-baseline.json')
  : { exceptions: [] };
const lengthExceptionById = new Map();
for (const e of lengthBaseline.exceptions ?? []) {
  if (lengthExceptionById.has(e.id))
    err('editorial-length-baseline.json', `duplicate exception "${e.id}"`);
  const sealed = SEALED_LEGACY_LENGTH_EXCEPTIONS.get(e.id);
  if (!sealed || sealed.version !== e.version || sealed.hash !== e.hash)
    err('editorial-length-baseline.json', `unsealed exception "${e.id}" — legacy exceptions may only shrink, never grow or change`);
  lengthExceptionById.set(e.id, e);
}

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

  // Where the tellings differ, say which one this is. It is what lets someone
  // who is not a Sanskritist review the story at all: the question stops being
  // "is this right?" and becomes "is this the one we said we were telling?"
  if (s.source.stability !== 'stable' && !s.source.variants?.length)
    warn(at, `stability is "${s.source.stability}" but no variants are listed — say what the tellings disagree about`);
  if (REVIEW_READY.has(s.status)) {
    if (!s.source.sourcing?.length)
      err(at, `${s.status} without a sourcing block — it is not ready for human review`);
    if (!s.source.checkedAgainst?.length)
      err(at, `${s.status} without checkedAgainst — name the edition/witness before review`);
  }

  const flagged = (s.audience.sensitivity ?? []).length > 0 || s.audience.gated;
  if (flagged && !s.audience.careNote)
    err(at, 'sensitivity or gated is set, so careNote is required — a parent must never be ambushed at bedtime');

  if (s.status === 'published') {
    if (!s.source.checkedAgainst?.length) err(at, 'published without checkedAgainst — name the edition it was verified against');
    if (!s.source.reviewedBy)  err(at, 'published without reviewedBy');
    if (!s.source.reviewedOn)  err(at, 'published without reviewedOn');
  }

  // -- the read-aloud score ---------------------------------------------
  const currentContentHash = createHash('sha256')
    .update(JSON.stringify(s.lengths) + JSON.stringify(s.close))
    .digest('hex').slice(0, 16);
  const lengthException = lengthExceptionById.get(s.id);
  const grandfatheredLength = s.status === 'published'
    && lengthException
    && lengthException.version === s.version
    && lengthException.hash === currentContentHash;

  for (const [len, r] of Object.entries(s.lengths)) {
    const where = `${at} [${len}]`;
    const slow = r.blocks.filter(b => b.t === 'slow');
    if (slow.length !== 1) err(where, `${slow.length} slow blocks — there must be exactly one`);
    if (r.blocks.at(-1)?.t !== 'slow') err(where, 'the last block must be the slow block (it is the landing)');
    if (r.blocks[0]?.t === 'beat') err(where, 'a rendition cannot open on a pause');

    let words = 0;
    if (r.blocks[0]?.t === 'aside') err(where, 'a rendition cannot open on an aside — the first thing on the page is read aloud');
    if (r.blocks.at(-1)?.t === 'aside') err(where, 'an aside cannot be the last block');
    r.blocks.forEach((b, i) => {
      if (b.t === 'beat') {
        if (r.blocks[i + 1]?.t === 'beat') err(where, `block ${i}: two pauses in a row`);
        return;
      }
      const text = b.text ?? '';
      // An aside is addressed to the parent and is never spoken, so it buys no
      // minutes. Every other check applies to it exactly as to a breath line.
      if (b.t !== 'aside') words += text.replace(/[«»_]/g, '').split(/\s+/).filter(Boolean).length;

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

      // Never belittle a divine figure. The stories are free to show a god
      // being wrong, outwitted or hungry — that is most of the Purāṇas — but
      // the narration does not call one stupid, silly or foolish. A word list
      // cannot tell who a sentence is about, so this warns and a person looks.
      for (const m of text.matchAll(/\b(stupid|silly|idiot\w*|dumb|foolish|fool|daft|ridiculous|absurd)\b/gi))
        warn(where, `block ${i}: "${m[0]}" — check who this refers to; it must never be a god`);

      // A breath line is one thought. Five short sentences can be one thought;
      // sixty words never are. Measure length, not punctuation.
      const w = text.replace(/[«»_]/g, '').split(/\s+/).filter(Boolean).length;
      // Sentence count is a poor proxy — a run of short call-and-response
      // questions is one breath. Length is the honest signal.
      if (b.t === 'p' && w > 60) warn(where, `block ${i}: ${w} words — too much for one breath line, split it`);
      if (b.t === 'aside' && w > 70) warn(where, `block ${i}: ${w} words — an aside that long will get read out by mistake`);
    });

    // 130 wpm is a bedtime pace with pauses, not a newsreader's 150+
    // 110 wpm is a parent reading slowly to a child, and each printed beat is a real silence.
    const spoken = Math.round(words / 110 + r.blocks.filter(b => b.t === 'beat').length * 0.05);

    const gate = LENGTH_GATES[len];
    if (gate && REVIEW_READY.has(s.status) && !grandfatheredLength) {
      if (r.minutes !== gate.minutes)
        err(where, `${s.status} ${len} must declare ${gate.minutes} minutes, not ${r.minutes}`);
      if (words < gate.minWords || words > gate.maxWords)
        err(where, `${s.status} ${len} must be ${gate.minWords}–${gate.maxWords} spoken words; found ${words}`);
      if (spoken !== gate.minutes)
        err(where, `${s.status} ${len} reads as ${spoken} minutes at bedtime pace; target is ${gate.minutes}`);
    }

    if (Math.abs(spoken - r.minutes) > Math.max(1, r.minutes * 0.25))
      warn(where, `minutes says ${r.minutes} but ${words} words reads as about ${spoken} at a bedtime pace`);
    if (r.words && Math.abs(r.words - words) > 15)
      warn(where, `words says ${r.words}, actual count is ${words}`);
  }

  if (s.status === 'published' && !s.lengths.short)
    err(at, 'published without a short rendition — publication requires both 3-minute and 6-minute tellings');

  if (s.lengths.short && s.lengths.full) {
    const t = l => JSON.stringify(s.lengths[l].blocks.map(b => b.text ?? ''));
    if (t('short') === t('full')) err(at, 'short and full are identical — each length is written, not truncated');
    // The landing is the one line the child takes to bed. A short that reuses
    // the long one's last line is the long one with paragraphs deleted, which
    // is the thing EDITORIAL forbids — and it is invisible to the check above.
    const slowOf = l => s.lengths[l].blocks.find(b => b.t === 'slow')?.text ?? '';
    if (slowOf('short') && slowOf('short') === slowOf('full'))
      warn(at, 'the short and the full land on the same last line — each rendition needs its own');
    const wc = l => s.lengths[l].blocks.filter(b => b.t !== 'aside')
      .reduce((n, b) => n + (b.text ?? '').split(/\s+/).length, 0);
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
  const hash = currentContentHash;
  const prev = lock.stories?.[s.id];
  if (prev && prev.hash !== hash && prev.version === s.version)
    err(at, `text changed but version is still ${s.version} — bump it, or any rendered audio silently goes stale`);
  if (s.audio) for (const [len, a] of Object.entries(s.audio)) {
    if (a.fromVersion !== s.version) warn(at, `audio [${len}] was rendered from v${a.fromVersion}, story is v${s.version} — stale, app will fall back to text`);
    if (!a.approved) warn(at, `audio [${len}] is not approved — a human must listen before it ships`);
  }
}

/* ---------- sealed legacy length baseline ---------- */
for (const e of lengthBaseline.exceptions ?? []) {
  const st = stories.get(e.id);
  if (!st) {
    err('editorial-length-baseline.json', `exception "${e.id}" has no written story`);
    continue;
  }
  const h = createHash('sha256')
    .update(JSON.stringify(st.lengths) + JSON.stringify(st.close))
    .digest('hex').slice(0, 16);
  if (st.status !== 'published')
    err('editorial-length-baseline.json', `exception "${e.id}" is no longer published — remove the exception`);
  if (st.version !== e.version || h !== e.hash)
    err('editorial-length-baseline.json', `exception "${e.id}" no longer matches the sealed legacy bytes — remove the exception; the story must now meet the hard length gate`);
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

/* ---------- the pañcāṅga table ---------- */
try {
  const cal = read('content/panchanga.json');
  const today = new Date().toISOString().slice(0, 10);
  if (!cal.days?.[today]) err('panchanga.json', `does not cover today (${today}) — run \`npm run calendar\``);
  const horizon = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  if (!cal.days?.[horizon]) warn('panchanga.json', `runs out within a year (ends ${cal.meta?.to}) — regenerate before it does`);

  // Every festival the corpus schedules against must actually occur, every year
  // the table covers. A kṣaya tithi silently dropping Govardhan Pūjā is exactly
  // the bug this catches.
  const wanted = new Set(canon.flatMap(c => c.festivals ?? []));
  for (const st of Object.values(stories)) for (const f of st.calendar?.festivals ?? []) wanted.add(f);
  const seen = new Map();
  for (const [date, d] of Object.entries(cal.days))
    for (const f of d.festivals ?? []) {
      if (!seen.has(f)) seen.set(f, new Set());
      seen.get(f).add(date.slice(0, 4));
    }
  const years = new Set(Object.keys(cal.days).map(d => d.slice(0, 4)));
  for (const f of wanted) {
    const got = seen.get(f);
    if (!got) err('panchanga.json', `the corpus schedules against "${f}", which never occurs in the table`);
    else for (const y of years) if (!got.has(y)) err('panchanga.json', `"${f}" is missing from ${y}`);
  }
} catch (e) {
  err('panchanga.json', `unreadable — ${e.message}`);
}

/* ---------- the canon itself ---------- */
// The canon is not schema-validated (only stories are), so its enums used to
// drift unchecked — a bare "purana" corpus rendered fine in the UI and was
// never legal. Check it against the same enums the stories obey.
const OUT_OF_SCOPE = new Set(['jain', 'buddhist']);

{
  const cEnum = new Set(schema.properties.source.properties.corpus.enum);
  const tEnum = new Set(schema.properties.source.properties.tradition.enum);
  const sEnum = new Set(schema.properties.status.enum);
  for (const c of canon) {
    if (!cEnum.has(c.corpus))    err('canon.json', `"${c.id}" has corpus "${c.corpus}", which is not in the schema`);
    if (!tEnum.has(c.tradition)) err('canon.json', `"${c.id}" has tradition "${c.tradition}", which is not in the schema`);
    if (!sEnum.has(c.status))    err('canon.json', `"${c.id}" has status "${c.status}", which is not in the schema`);
    // Scope, set 2026-09-10: the collection draws on Hindu tradition. The enum
    // still carries jain and buddhist because retired rows use them and the
    // record is kept, but nothing in those traditions ships. See EDITORIAL.md,
    // "What this collection is". A rule written only in prose gets forgotten by
    // the third batch; this is the same rule with teeth.
    if (OUT_OF_SCOPE.has(c.tradition) && c.status !== 'retired')
      err('canon.json', `"${c.id}" is tradition "${c.tradition}", which is outside what this collection tells — retire the row or change the tradition (EDITORIAL.md, "What this collection is")`);
    // A canon row claiming publication with no story behind it is the worst
    // kind of drift: the shelf promises something that does not exist.
    if (c.status === 'published' && !stories.has(c.id))
      err('canon.json', `"${c.id}" is marked published but has no story file`);
  }
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
