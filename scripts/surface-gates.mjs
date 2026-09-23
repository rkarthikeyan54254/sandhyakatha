#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { audienceText, displayTerm, lexiconTerms } from './lib/lexicon-display.mjs';
import { approvedHeroUrl } from './lib/media.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const lex = read('content/lexicon.json');
const media = read('content/media.json').stories ?? {};
const canon = read('content/canon.json').canon ?? [];
const localePublic = read('content/locale-public.json');
const publicIds = new Set(canon.filter(c=>c.status==='published'&&!c.gated).map(c=>c.id));
const dist = join(ROOT, 'dist');
const SITE = 'https://sandhyakatha.com';
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

function jsonLdOfType(html, type) {
  const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of scripts) {
    try {
      const doc=JSON.parse(m[1]);
      if (doc?.['@type']===type) return doc;
    } catch {}
  }
  return null;
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
  const url=`${SITE}/s/${s.id}/`;

  if (!/<title>[^<]+<\/title>/i.test(html)) fail(s.id, '/s has no non-empty title');
  if (!/<meta name="description" content="[^"]+"/i.test(html)) fail(s.id, '/s has no meta description');
  if (!html.includes(`rel="canonical" href="${url}"`)) fail(s.id, '/s canonical is missing or not self-referential');
  if (!/<h1 class="story-title">[^<]+<\/h1>/i.test(html)) fail(s.id, '/s has no story H1');
  if (!html.includes('class="tease"')) fail(s.id, '/s has no visible story introduction');
  if (!html.includes('class="story-publine"')) fail(s.id, '/s has no publisher/update provenance');
  if (/name="robots"[^>]*noindex/i.test(html)) fail(s.id, '/s accidentally contains noindex');
  const structured=jsonLdOfType(html,'ShortStory');
  if (!structured) fail(s.id, '/s has no valid ShortStory JSON-LD');
  else {
    if (structured.url!==url || structured.mainEntityOfPage?.['@id']!==url)
      fail(s.id, '/s ShortStory URL/mainEntityOfPage is not canonical');
    if (structured.publisher?.name!=='Sandhya Katha' || structured.author?.name!=='Sandhya Katha')
      fail(s.id, '/s ShortStory publisher/author is incomplete');
    if (s.updated && structured.dateModified!==s.updated)
      fail(s.id, '/s ShortStory dateModified does not match story.updated');
    if (approvedHero(s) && !structured.image?.length)
      fail(s.id, '/s ShortStory image is missing for approved hero');
  }
  if (s.linked?.next && publicIds.has(s.linked.next) && !html.includes(`href="/s/${s.linked.next}/"`))
    fail(s.id, `/s missing curated related-story link to ${s.linked.next}`);

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

const archivePath=join(dist,'stories','index.html');
if (!existsSync(archivePath)) errors.push('/stories/: public archive is missing');
else {
  const archive=readFileSync(archivePath,'utf8');
  for (const id of publicIds)
    if (!archive.includes(`href="/s/${id}/"`)) errors.push(`/stories/: missing public story link ${id}`);
}

const robotsPath=join(dist,'robots.txt');
const expectedRobots='User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /preview/\n\nSitemap: https://sandhyakatha.com/sitemap.xml\n';
if (!existsSync(robotsPath)) errors.push('robots.txt: missing from dist root');
else if (readFileSync(robotsPath,'utf8').replace(/\r\n/g,'\n')!==expectedRobots)
  errors.push('robots.txt: contents differ from crawler policy');

const sitemapPath=join(dist,'sitemap.xml');
if (!existsSync(sitemapPath)) errors.push('sitemap.xml: missing from dist root');
else {
  const xml=readFileSync(sitemapPath,'utf8');
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'))
    errors.push('sitemap.xml: sitemap namespace is missing');
  const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  for (const loc of locs) {
    if (!loc.startsWith(`${SITE}/`)) errors.push(`sitemap.xml: non-canonical domain URL ${loc}`);
    if (/\/api\/|\/preview\/|localhost|netlify\.app|staging|\/draft\//i.test(loc))
      errors.push(`sitemap.xml: forbidden URL ${loc}`);
  }
  if (!locs.includes(`${SITE}/`)) errors.push('sitemap.xml: homepage missing');
  if (!locs.includes(`${SITE}/stories/`)) errors.push('sitemap.xml: story archive missing');
  for (const id of publicIds)
    if (!locs.includes(`${SITE}/s/${id}/`)) errors.push(`sitemap.xml: public story missing ${id}`);
}

const buildInfo=join(dist,'build-info.json');
if (!existsSync(buildInfo)) errors.push('build-info.json: missing from dist root');
else {
  try {
    const info=JSON.parse(readFileSync(buildInfo,'utf8'));
    if (!info.commit) errors.push('build-info.json: commit marker missing');
  } catch { errors.push('build-info.json: invalid JSON'); }
}

const nf=join(dist,'404.html');
if (!existsSync(nf)) errors.push('404.html: missing');
else if (!/name="robots" content="noindex,nofollow"/i.test(readFileSync(nf,'utf8')))
  errors.push('404.html: must be noindex,nofollow');

const netlify=readFileSync(join(ROOT,'netlify.toml'),'utf8');
for (const token of [
  'from = "/s/*"','to = "/404.html"','status = 404',
  'for = "/build-info.json"','Cache-Control = "no-store"',
  'for = "/robots.txt"','Content-Type = "text/plain; charset=utf-8"',
  'for = "/sitemap.xml"','Content-Type = "application/xml; charset=utf-8"'
]) if (!netlify.includes(token)) errors.push(`netlify crawler contract missing: ${token}`);

for (const edition of localePublic.editions ?? []) {
  const lang=String(edition.locale).split('-')[0];
  const path=join(dist,'s',edition.storyId,lang,'index.html');
  if (!existsSync(path)) continue;
  const html=readFileSync(path,'utf8');
  const structured=jsonLdOfType(html,'ShortStory');
  if (!structured) errors.push(`${edition.locale}/${edition.storyId}: locale ShortStory JSON-LD missing`);
  if (!html.includes('class="story-publine"')) errors.push(`${edition.locale}/${edition.storyId}: locale provenance line missing`);
  if (/name="robots"[^>]*noindex/i.test(html)) errors.push(`${edition.locale}/${edition.storyId}: public locale accidentally noindex`);
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
