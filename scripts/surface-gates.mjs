#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { audienceText, displayTerm, lexiconTerms } from './lib/lexicon-display.mjs';
import { approvedHeroUrl } from './lib/media.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const lex = read('content/lexicon.json');
const media = read('content/media.json').stories ?? {};
const dist = join(ROOT, 'dist');
const errors = [];

const fail = (id, msg) => errors.push(`${id}: ${msg}`);
const norm = s => String(s)
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:?!])/g, '$1')
  .replace(/([(\[])\s+/g, '$1')
  .replace(/\s+([)\]])/g, '$1')
  .replace(/(\p{L})\s+(['’])(\p{L})/gu, '$1$2$3')
  .trim();
const decode = s => String(s)
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function htmlText(html) {
  const withoutCode = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');

  const withBlockBreaks = withoutCode.replace(
    /<\/?(?:p|div|aside|h[1-6]|li|ul|ol|summary|details|figure|figcaption|main|header|footer|section|article|br)\b[^>]*>/gi,
    ' '
  );

  return norm(decode(withBlockBreaks.replace(/<[^>]+>/g, '')));
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function approvedHero(s) {
  return approvedHeroUrl({ root: ROOT, story: s, media });
}

function expectText(id, pageText, raw, label) {
  if (!raw) return;
  const expected = norm(audienceText(raw, lex));
  if (expected && !pageText.includes(expected))
    fail(id, `/s missing ${label}: ${JSON.stringify(expected.slice(0, 110))}`);
}

const storyFiles = readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json')).sort();
let checked = 0;

for (const file of storyFiles) {
  const s = read(`content/stories/${file}`);
  if (s.status !== 'published' || s.audience.gated) continue;
  checked += 1;

  const htmlPath = join(dist, 's', s.id, 'index.html');
  const jsonPath = join(dist, 'data', 's', `${s.id}.json`);
  if (!existsSync(htmlPath)) { fail(s.id, 'missing dist /s page'); continue; }
  if (!existsSync(jsonPath)) { fail(s.id, 'missing dist app story JSON'); continue; }

  const html = readFileSync(htmlPath, 'utf8');
  const text = htmlText(html);
  const app = JSON.parse(readFileSync(jsonPath, 'utf8'));

  if (app.id !== s.id || app.version !== s.version)
    fail(s.id, `app JSON is not canonical v${s.version}`);

  expectText(s.id, text, s.title, 'title');
  expectText(s.id, text, s.source.work, 'source work');
  expectText(s.id, text, s.source.locus, 'source locus');
  expectText(s.id, text, s.source.traditionNote, 'tradition note');
  expectText(s.id, text, s.audience.careNote, 'care note');

  const blocks = s.lengths.full.blocks;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t !== 'beat') expectText(s.id, text, b.text, `full block ${i}`);
  }

  expectText(s.id, text, s.close.question, 'child question');
  expectText(s.id, text, s.close.seed, 'question seed');
  for (const [i, f] of (s.close.ifTheyAsk ?? []).entries()) {
    expectText(s.id, text, f.q, `ifTheyAsk ${i} question`);
    expectText(s.id, text, f.a, `ifTheyAsk ${i} answer`);
  }

  const expectedBeats = blocks.filter(b => b.t === 'beat').length;
  const actualBeats = (html.match(/class="beat"/g) ?? []).length;
  if (actualBeats !== expectedBeats)
    fail(s.id, `/s has ${actualBeats} pause markers; canonical full has ${expectedBeats}`);

  const expectedSlow = blocks.filter(b => b.t === 'slow').length;
  const actualSlowTags = (html.match(/class="slowtag"/g) ?? []).length;
  if (actualSlowTags !== expectedSlow)
    fail(s.id, `/s has ${actualSlowTags} slow-down labels; canonical full has ${expectedSlow}`);

  const expectedAsides = blocks.filter(b => b.t === 'aside').length;
  const actualAsides = (html.match(/<aside class="note"/g) ?? []).length;
  if (actualAsides !== expectedAsides)
    fail(s.id, `/s has ${actualAsides} parent asides; canonical full has ${expectedAsides}`);

  const termText = [
    ...blocks.filter(b => b.t !== 'beat').map(b => b.text),
    s.close.question,
    s.close.seed,
    ...(s.close.ifTheyAsk ?? []).flatMap(f => [f.q, f.a])
  ].join('\n');
  const terms = [...new Set(lexiconTerms(termText))];
  if (terms.length && !html.includes('id="lexpop"'))
    fail(s.id, '/s has lexicon terms but no pronunciation popover');
  for (const term of terms) {
    const display = displayTerm(lex, term);
    if (!html.includes(`data-term="${escAttr(term)}"`))
      fail(s.id, `/s does not make «${term}» tappable`);
    if (!text.includes(display))
      fail(s.id, `/s does not show audience spelling "${display}" for «${term}»`);
  }
  if (text.includes('«') || text.includes('»'))
    fail(s.id, '/s leaked canonical guillemet markup to reader-visible text');

  const hero = approvedHero(s);
  if (hero) {
    if (app.hero !== hero) fail(s.id, `Tonight/app JSON missing approved hero ${hero}`);
    if (!html.includes(`src="${hero}"`)) fail(s.id, `/s missing approved hero ${hero}`);
  } else if (app.hero) {
    fail(s.id, `app JSON exposes hero ${app.hero} that is not approved for this story version`);
  }
}

for (const rel of [
  'scripts/lib/social-edition.mjs',
  'scripts/reel.mjs',
  'scripts/prerender.mjs'
]) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  if (!src.includes('lexicon-display.mjs'))
    errors.push(`${rel}: does not use shared lexicon display resolver`);
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR surface gate: ${e}`);
  console.error(`FAILED — ${errors.length} cross-surface error(s)`);
  process.exit(1);
}
console.log(`surface gates: PASS — ${checked} published public /s stories match canonical reader content`);
