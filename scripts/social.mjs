#!/usr/bin/env node
/**
 * Instagram carousels, drawn from approved story JSON and canon metadata.
 *
 * The carousel has two jobs:
 *   1. stop a parent long enough to begin the story;
 *   2. move an interested parent to the source-linked telling on Sandhya Katha.
 *
 * The story itself still does the persuasive work. We do not manufacture a
 * second body of "social mythology" here: the narrative slides come from the
 * published short rendition, the hook comes from canon.json (falling back to
 * the approved tease), and the trust slide comes from the story's source block.
 *
 * Eight slides:
 *   1. acquisition hook
 *   2-5. the approved short telling
 *   6. the open question
 *   7. where it comes from
 *   8. one clear website CTA
 *
 * Nothing here is posted automatically. It writes PNGs, a caption and the
 * tracked story URL; a person reads both and decides.
 *
 *   npm run social              # every published story
 *   npm run social -- <id>      # just one
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'social');
const FONTS = join(ROOT, 'assets/fonts');
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const S = 1080;
const SITE = 'https://sandhyakatha.com';

const canon = JSON.parse(readFileSync(join(ROOT, 'content/canon.json'), 'utf8')).canon;
const canonById = new Map(canon.map(row => [row.id, row]));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                          .replace(/\"/g, '&quot;').replace(/'/g, '&apos;');
const plain = s => String(s).replace(/[«»]/g, '').replace(/_([^_]+)_/g, '$1');

function wrap(text, maxPx, sizePx, em = 0.50) {
  const per = sizePx * em, out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const t = line ? `${line} ${word}` : word;
    if (t.length * per > maxPx && line) { out.push(line); line = word; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** Keep the opening hook large without allowing a long canon hook to overflow. */
function fit(text, { maxPx = 900, start = 58, min = 43, maxLines = 7, em = 0.47 } = {}) {
  for (let size = start; size >= min; size -= 2) {
    const lines = wrap(text, maxPx, size, em);
    if (lines.length <= maxLines) return { size, lines };
  }
  return { size: min, lines: wrap(text, maxPx, min, em).slice(0, maxLines) };
}

const chrome = (n, total) => `
<rect width="${S}" height="${S}" fill="#14101c"/>
<rect width="${S}" height="${S}" fill="url(#glow)"/>
<g transform="translate(74,66)">
  <path d="M7 0 C13 11 15 19 7 28 C-1 19 1 11 7 0 Z" fill="url(#flame)"/>
  <ellipse cx="7" cy="21" rx="2.4" ry="5" fill="#fff6dd" opacity="0.9"/>
  <path d="M-13 33 Q7 48 27 33 Q7 39 -13 33 Z" fill="#a97c3a"/>
</g>
<text x="114" y="82" font-family="Karla" font-size="21" font-weight="700"
      letter-spacing="1.7" fill="#c9baa4">SANDHYA KATHA</text>
${Array.from({ length: total }, (_, i) =>
  `<circle cx="${S / 2 - (total - 1) * 9 + i * 18}" cy="1010" r="4"
           fill="${i === n ? '#f0b458' : '#3b3350'}"/>`).join('')}`;

const defs = `<defs>
  <radialGradient id="glow" cx="50%" cy="0%" r="78%">
    <stop offset="0%" stop-color="#312752"/><stop offset="100%" stop-color="#14101c" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="flame" cx="50%" cy="62%" r="60%">
    <stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="#f0b458"/><stop offset="100%" stop-color="#e0873f"/>
  </radialGradient>
</defs>`;

/** Body slide: text block optically centred, serif, generous leading. */
function slide(text, n, total, { size = 46, italic = false, color = '#f3e7d3', kicker = null } = {}) {
  const lines = wrap(plain(text), 900, size, 0.47);
  const lh = size * 1.42;
  const top = S / 2 - ((lines.length - 1) * lh) / 2 + size * 0.34 + (kicker ? 26 : 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs}${chrome(n, total)}
${kicker ? `<text x="90" y="${top - lines.length * lh / 2 - 44}" font-family="Karla" font-size="19"
   font-weight="700" letter-spacing="2.4" fill="#a97c3a">${esc(kicker)}</text>` : ''}
${lines.map((l, i) => `<text x="90" y="${top + i * lh}" font-family="Gentium Book Plus" font-size="${size}"
   ${italic ? 'font-style="italic"' : ''} fill="${color}">${esc(l)}</text>`).join('\n')}
</svg>`;
}

function acquisitionHook(s) {
  return plain(canonById.get(s.id)?.hook || s.tease);
}

function hookSlide(s, total) {
  const hook = fit(acquisitionHook(s));
  const lh = hook.size * 1.38;
  const top = S / 2 - ((hook.lines.length - 1) * lh) / 2 + 5;
  const meta = `${s.title} · ${s.source.work}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs}${chrome(0, total)}
<text x="90" y="${top - 105}" font-family="Karla" font-size="19" font-weight="700"
      letter-spacing="2.4" fill="#a97c3a">A STORY TO READ TONIGHT</text>
${hook.lines.map((l, i) => `<text x="90" y="${top + i * lh}" font-family="Gentium Book Plus"
   font-size="${hook.size}" fill="#f3e7d3">${esc(l)}</text>`).join('\n')}
<text x="90" y="930" font-family="Karla" font-size="20" font-weight="600" fill="#948aa6">${esc(meta)}</text>
</svg>`;
}

function sourceSlide(s, n, total) {
  const note = wrap(s.source.traditionNote ?? `Told from ${s.source.work}, ${s.source.locus}.`, 900, 30, 0.49).slice(0, 7);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs}${chrome(n, total)}
<text x="90" y="300" font-family="Karla" font-size="19" font-weight="700" letter-spacing="2.4"
      fill="#a97c3a">WHERE IT COMES FROM</text>
<text x="90" y="360" font-family="Karla" font-size="30" font-weight="700" fill="#f0b458">${esc(s.source.work)}</text>
<text x="90" y="402" font-family="Gentium Book Plus" font-size="27" font-style="italic" fill="#948aa6">${esc(s.source.locus)}</text>
${note.map((l, i) => `<text x="90" y="${470 + i * 44}" font-family="Gentium Book Plus" font-size="30"
   fill="#c9baa4">${esc(l)}</text>`).join('\n')}
</svg>`;
}

function ctaSlide(s, n, total) {
  const headline = wrap('Read this one to your child tonight.', 900, 54, 0.47);
  const promise = wrap(`The complete ${s.lengths.full.minutes}-minute telling, pronunciation help, source notes and the question to ask afterwards.`, 900, 31, 0.49);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs}${chrome(n, total)}
<text x="90" y="310" font-family="Karla" font-size="19" font-weight="700" letter-spacing="2.4"
      fill="#a97c3a">TONIGHT, NOT SOMEDAY</text>
${headline.map((l, i) => `<text x="90" y="${390 + i * 68}" font-family="Gentium Book Plus"
   font-size="54" fill="#f3e7d3">${esc(l)}</text>`).join('\n')}
${promise.map((l, i) => `<text x="90" y="${590 + i * 45}" font-family="Gentium Book Plus"
   font-size="31" fill="#c9baa4">${esc(l)}</text>`).join('\n')}
<line x1="90" y1="800" x2="990" y2="800" stroke="#302941" stroke-width="1.5"/>
<text x="90" y="860" font-family="Karla" font-size="22" font-weight="700" letter-spacing="1.8"
      fill="#f0b458">LINK IN BIO</text>
<text x="90" y="920" font-family="Karla" font-size="38" font-weight="700" fill="#f0b458">sandhyakatha.com</text>
</svg>`;
}

function png(svg, path) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: S },
    font: { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Gentium Book Plus' } });
  writeFileSync(path, r.render().asPng());
}

/** Four body slides: the opening, two turns, and the landing. */
function pick(story) {
  const b = story.lengths.short.blocks.filter(x => x.t !== 'beat');
  const slow = b[b.length - 1];
  const body = b.slice(0, -1);
  const at = f => body[Math.min(body.length - 1, Math.round((body.length - 1) * f))];
  return [body[0], at(0.42), at(0.78), slow];
}

function trackedStoryUrl(s) {
  const params = new URLSearchParams({
    utm_source: 'instagram',
    utm_medium: 'carousel',
    utm_campaign: 'story',
    utm_content: s.id
  });
  return `${SITE}/s/${s.id}/?${params.toString()}`;
}

const CORPUS_TAGS = {
  ramayana: ['#RamayanaForKids', '#RamayanaStories'],
  'other-ramayana': ['#RamayanaStories'],
  mahabharata: ['#MahabharataForKids', '#MahabharataStories'],
  bhagavata: ['#BhagavataPurana', '#KrishnaStories'],
  purana: ['#PuranaStories'],
  'shiva-purana': ['#ShivaStories', '#PuranaStories'],
  'vishnu-purana': ['#VishnuStories', '#PuranaStories'],
  'other-purana': ['#PuranaStories'],
  upanishad: ['#UpanishadStories'],
  nayanmar: ['#NayanmarStories', '#TamilBhakti'],
  alvar: ['#AlvarStories', '#TamilBhakti'],
  sant: ['#BhaktiStories', '#IndianSaints'],
  panchatantra: ['#PanchatantraStories']
};

const CHARACTER_TAGS = [
  ['ganesa', '#GaneshaStories'],
  ['ganesha', '#GaneshaStories'],
  ['hanuman', '#HanumanStories'],
  ['krishna', '#KrishnaStories'],
  ['rama', '#RamaStories'],
  ['siva', '#ShivaStories'],
  ['shiva', '#ShivaStories'],
  ['durga', '#DurgaStories']
];

function asciiLower(s) {
  return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function hashtagSet(s) {
  const tags = [
    '#SandhyaKatha',
    '#HinduStoriesForKids',
    '#IndianBedtimeStories',
    '#HinduParenting',
    '#StoriesForKids',
    ...(CORPUS_TAGS[s.source.corpus] ?? [])
  ];

  const searchable = asciiLower([
    s.title,
    ...(s.themes ?? []),
    ...(s.characters ?? []).map(c => c.ref)
  ].join(' '));

  for (const [needle, tag] of CHARACTER_TAGS) {
    if (searchable.includes(needle)) tags.push(tag);
  }

  for (const slug of (s.calendar?.festivals ?? [])) {
    const tag = '#' + slug.split('-').map(x => x ? x[0].toUpperCase() + x.slice(1) : '').join('');
    tags.push(tag);
  }

  return [...new Set(tags)].slice(0, 10);
}

function caption(s) {
  const hook = acquisitionHook(s);
  const tracked = trackedStoryUrl(s);
  const sourceLine = `${s.source.work} — ${s.source.locus}`;
  const differs = s.source.traditionNote
    ? '\nWhere tellings differ, Sandhya Katha says so.'
    : '';

  const tease = plain(s.tease);
  const opening = tease && tease !== hook ? `${hook}\n\n${tease}` : hook;

  return `${opening}

Read the complete telling aloud tonight, then ask:

${plain(s.close.question)}

📖 Ages ${s.audience.minAge}+ · about ${s.lengths.full.minutes} minutes
📜 ${sourceLine}${differs}

Read it tonight → link in bio
${tracked}

${hashtagSet(s).join(' ')}
`;
}

mkdirSync(OUT, { recursive: true });
let made = 0;
for (const f of readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(join(ROOT, 'content/stories', f), 'utf8'));
  if (s.status !== 'published') continue;
  if (canonById.get(s.id)?.gated) continue;
  if (only.length && !only.includes(s.id)) continue;

  const body = pick(s);
  const total = 1 + body.length + 1 + 1 + 1;       // hook + body + question + source + CTA
  const dir = join(OUT, s.id);
  mkdirSync(dir, { recursive: true });

  png(hookSlide(s, total), join(dir, '01.png'));
  body.forEach((blk, i) =>
    png(slide(blk.text, i + 1, total, { size: i === body.length - 1 ? 50 : 44,
                                        color: i === body.length - 1 ? '#ffe9c4' : '#f3e7d3' }),
        join(dir, String(i + 2).padStart(2, '0') + '.png')));

  const questionN = body.length + 1;
  png(slide(s.close.question, questionN, total,
            { size: 46, italic: true, color: '#ffe9c4', kicker: 'NOW TURN TO YOUR CHILD' }),
      join(dir, String(questionN + 1).padStart(2, '0') + '.png'));

  const sourceN = questionN + 1;
  png(sourceSlide(s, sourceN, total),
      join(dir, String(sourceN + 1).padStart(2, '0') + '.png'));

  const ctaN = sourceN + 1;
  png(ctaSlide(s, ctaN, total),
      join(dir, String(ctaN + 1).padStart(2, '0') + '.png'));

  writeFileSync(join(dir, 'caption.txt'), caption(s));
  writeFileSync(join(dir, 'link.txt'), trackedStoryUrl(s) + '\n');

  console.log(`  ${s.id}: ${total} slides + caption + tracked link`);
  made++;
}
console.log(`${made} carousel(s) → social/`);
