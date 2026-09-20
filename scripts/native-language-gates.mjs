#!/usr/bin/env node
/**
 * Native-language moat gate.
 *
 * Machines can catch regressions and enforce review provenance; they cannot
 * certify beautiful native prose. Approval therefore still requires a human
 * language editor. EDITORIAL.md defines the semantic standard this gate backs.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.SANDHYAKATHA_ROOT
  ? process.env.SANDHYAKATHA_ROOT
  : new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const source = rel => readFileSync(join(ROOT, rel), 'utf8');
const errors = [];
const fail = message => errors.push(message);

const policyPath = 'content/native-language-moat.json';
if (!existsSync(join(ROOT, policyPath))) {
  fail(`${policyPath} is missing`);
} else {
  const policy = read(policyPath);
  if (policy.schemaVersion !== '1.0') fail(`${policyPath}: schemaVersion must be 1.0`);
  if (policy.humanLanguageEditorRequired !== true)
    fail(`${policyPath}: humanLanguageEditorRequired must remain true`);
  if (!String(policy.principle ?? '').includes('never the syntactic'))
    fail(`${policyPath}: native-first principle has been weakened or removed`);

  const machineReviewer = reviewer => {
    const r = String(reviewer ?? '').toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, ' ').trim();
    if (!r) return false;
    const words = new Set(r.split(/\s+/));
    return ['chatgpt','openai','codex','astra','claude','gemini','copilot','gpt','llm','bot'].some(x => words.has(x));
  };
  const stripCanonicalMarkers = text => String(text ?? '')
    .replace(/«[^»]+»/g, '')
    .replace(/https?:\/\/\S+/g, '');
  const readerFields = doc => {
    const out = [doc.register, doc.title, doc.tease, doc.parentNote, doc.traditionNote,
      doc.close?.question, doc.close?.seed,
      ...(doc.close?.ifTheyAsk ?? []).flatMap(x => [x.q, x.a])];
    for (const rendition of Object.values(doc.lengths ?? {}))
      for (const block of rendition.blocks ?? []) if (block.t !== 'beat') out.push(block.text);
    return out.filter(Boolean);
  };
  const regressionHits = (doc, languagePolicy) => {
    const haystack = readerFields(doc).join('\n');
    return (languagePolicy?.regressionPhrases ?? []).filter(p => haystack.includes(p));
  };

  // The detector itself is regression-tested: known rejected Tamil must fail,
  // while the accepted native-title examples must not trip the rejected list.
  const ta = policy.languages?.ta;
  if (!ta) fail(`${policyPath}: Tamil policy is required`);
  else {
    for (const phrase of ta.regressionPhrases ?? []) {
      const fake = { title: phrase, close: { ifTheyAsk: [] }, lengths: {} };
      if (!regressionHits(fake, ta).includes(phrase))
        fail(`native-language detector self-test failed for rejected Tamil phrase: ${phrase}`);
    }
    for (const title of ta.nativeTitleExamples ?? []) {
      const fake = { title, close: { ifTheyAsk: [] }, lengths: {} };
      if (regressionHits(fake, ta).length)
        fail(`native-language detector rejects an accepted Tamil title example: ${title}`);
    }
  }

  const localeRoot = join(ROOT, 'content/locales');
  if (existsSync(localeRoot)) {
    for (const lang of readdirSync(localeRoot, { withFileTypes: true })) {
      if (!lang.isDirectory()) continue;
      const langPolicy = policy.languages?.[lang.name];
      if (!langPolicy) {
        fail(`content/locales/${lang.name}: no native-language policy exists for this language`);
        continue;
      }
      for (const file of readdirSync(join(localeRoot, lang.name)).filter(x => x.endsWith('.json')).sort()) {
        const rel = `content/locales/${lang.name}/${file}`;
        const doc = read(rel);
        const hits = regressionHits(doc, langPolicy);
        for (const phrase of hits)
          fail(`${rel}: rejected translation-shaped regression phrase found: “${phrase}”`);

        const allowedLatin = new Set((langPolicy.allowedLatinTokens ?? []).map(x => x.toLowerCase()));
        for (const text of readerFields(doc)) {
          const clean = stripCanonicalMarkers(text);
          for (const match of clean.matchAll(/\b[A-Za-z]{2,}\b/g)) {
            const token = match[0];
            if (!allowedLatin.has(token.toLowerCase()))
              fail(`${rel}: Latin-script leakage outside canonical entity markers: “${token}”`);
          }
        }

        if (doc.status === 'approved') {
          const gate = doc.review?.languageEditor;
          if (gate?.status !== 'approved' || !gate.reviewer?.trim() || !gate.reviewedOn)
            fail(`${rel}: approved locale requires an approved human languageEditor gate`);
          else if (machineReviewer(gate.reviewer))
            fail(`${rel}: languageEditor reviewer “${gate.reviewer}” is machine/agent identity; human approval is required`);
        }
      }
    }
  }
}

for (const rel of ['EDITORIAL.md', 'AGENTS.md']) {
  if (!existsSync(join(ROOT, rel))) fail(`${rel} is missing`);
}
if (existsSync(join(ROOT, 'EDITORIAL.md'))) {
  const editorial = source('EDITORIAL.md');
  for (const token of ['## Native-language moat', 'A localized title is not a translation field', 'AI self-review can never satisfy'])
    if (!editorial.includes(token)) fail(`EDITORIAL.md missing native-language invariant: ${token}`);
}
if (existsSync(join(ROOT, 'AGENTS.md'))) {
  const agents = source('AGENTS.md');
  for (const token of ['native-language moat', 'Do not translate the English title first', 'languageEditor'])
    if (!agents.includes(token)) fail(`AGENTS.md missing locale-generation guardrail: ${token}`);
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL native-language moat: ${e}`);
  console.error(`FAILED — ${errors.length} native-language moat error(s)`);
  process.exit(1);
}
console.log('native-language moat: PASS — native-first policy present · translation regressions absent · approved locale language editors are human');
