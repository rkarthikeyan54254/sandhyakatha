#!/usr/bin/env node
/**
 * Share cards — one 1200×630 PNG per published story.
 *
 * This is the growth loop's front door. A parent forwards a story into a family
 * WhatsApp group and what the group sees first is not the page: it is this
 * image. Every published story that falls back to the generic card is a share
 * that looks like a link to a website instead of a link to a story.
 *
 * Deliberately static output committed to public/og/ rather than a build step:
 * the corpus is small, the cards change only when a title does, and a build
 * that can fail on a font is a build that can take the site down at 9pm.
 *
 *   npm run og            # every published story missing a card
 *   npm run og -- --all   # redraw all of them
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'public/og');
const FONTS = join(ROOT, 'assets/fonts');
const all = process.argv.includes('--all');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/* Rough advance widths, in ems, good enough to break a line on. Serif faces at
   these sizes run ~0.50em average; the Karla labels are short enough not to. */
function wrap(text, maxPx, sizePx, em = 0.50) {
  const per = sizePx * em, out = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (test.length * per > maxPx && line) { out.push(line); line = word; } else line = test;
  }
  if (line) out.push(line);
  return out;
}

/** Title shrinks rather than overflowing; three lines is the floor. */
function fitTitle(title) {
  for (const size of [70, 62, 55, 48, 43]) {
    const lines = wrap(title, 1000, size, 0.47);
    if (lines.length <= 2) return { size, lines };
    if (size === 43) return { size, lines: lines.slice(0, 3) };
  }
}

function card(s) {
  const { size, lines } = fitTitle(s.title);
  const tease = wrap(s.tease ?? '', 980, 27, 0.49).slice(0, 2);
  const r = s.lengths.full ?? s.lengths.short;
  const titleTop = 232 - (lines.length - 1) * (size * 0.55);
  const teaseTop = titleTop + lines.length * (size * 1.14) + 34;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <radialGradient id="glow" cx="50%" cy="0%" r="72%">
    <stop offset="0%" stop-color="#312752"/><stop offset="100%" stop-color="#14101c" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="flame" cx="50%" cy="62%" r="60%">
    <stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="#f0b458"/><stop offset="100%" stop-color="#e0873f"/>
  </radialGradient>
</defs>
<rect width="1200" height="630" fill="#14101c"/>
<rect width="1200" height="630" fill="url(#glow)"/>

<!-- diya -->
<g transform="translate(78,64)">
  <path d="M7 0 C13 11 15 19 7 28 C-1 19 1 11 7 0 Z" fill="url(#flame)"/>
  <ellipse cx="7" cy="21" rx="2.4" ry="5" fill="#fff6dd" opacity="0.9"/>
  <path d="M-13 32 Q7 47 27 32 Q7 38 -13 32 Z" fill="#a97c3a"/>
</g>
<text x="118" y="80" font-family="Karla" font-size="23" font-weight="700"
      letter-spacing="1.6" fill="#f3e7d3">SANDHYA KATHA</text>
<text x="118" y="105" font-family="Tiro Devanagari Sanskrit" font-size="17" fill="#a97c3a">संध्या कथा</text>

${lines.map((l, i) => `<text x="78" y="${titleTop + i * size * 1.14}" font-family="Gentium Book Plus"
      font-size="${size}" fill="#f3e7d3">${esc(l)}</text>`).join('\n')}

${tease.map((l, i) => `<text x="78" y="${teaseTop + i * 38}" font-family="Gentium Book Plus"
      font-size="27" font-style="italic" fill="#c9baa4">${esc(l)}</text>`).join('\n')}

<line x1="78" y1="516" x2="1122" y2="516" stroke="#302941" stroke-width="1.5"/>
<text x="78" y="558" font-family="Karla" font-size="22" font-weight="600" fill="#f0b458">${esc(s.source.work)}</text>
<text x="78" y="589" font-family="Gentium Book Plus" font-size="21" font-style="italic"
      fill="#948aa6">${esc(s.source.locus)}</text>
<text x="1122" y="558" text-anchor="end" font-family="Karla" font-size="21" font-weight="600"
      fill="#c9baa4">${r.minutes} minutes, read aloud</text>
<text x="1122" y="588" text-anchor="end" font-family="Karla" font-size="19"
      fill="#948aa6">Ages ${s.audience.minAge} and up</text>
</svg>`;
}

mkdirSync(OUT, { recursive: true });
const files = readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json'));
let drew = 0, kept = 0;

for (const f of files) {
  const s = JSON.parse(readFileSync(join(ROOT, 'content/stories', f), 'utf8'));
  if (s.status !== 'published') continue;
  const png = join(OUT, `${s.id}.png`);
  if (existsSync(png) && !all) { kept++; continue; }
  const r = new Resvg(card(s), {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Gentium Book Plus' }
  });
  writeFileSync(png, r.render().asPng());
  console.log(`  drew ${s.id}.png`);
  drew++;
}
console.log(`${drew} card(s) drawn, ${kept} already had one`);
