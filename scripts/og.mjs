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
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

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
function fitTitle(title, colW = 1000) {
  for (const size of [70, 62, 55, 48, 43, 38]) {
    const lines = wrap(title, colW, size, 0.47);
    if (lines.length <= 2) return { size, lines };
    if (size === 38) return { size, lines: lines.slice(0, 3) };
  }
}


/* ---- the illustration on the share card ----------------------------------
 * A card that is only type reads as a link dump in a WhatsApp group, and the
 * whole distribution problem is that nothing stops the scroll. We have 54
 * illustrations doing nothing for reach.
 *
 * They cannot simply BE the card: heroes are portrait (1122x1402) and an OG
 * card is 1200x630, so a full-bleed crop decapitates the figure. Instead the
 * art takes a portrait column on the left and the type keeps the rest — which
 * also protects the thing the type is carrying, the named source and passage.
 * That citation is the product's whole claim and it does not get dropped for
 * a prettier picture.
 *
 * resvg has no webp decoder, so the hero is transcoded to PNG first.
 */
const HERO_W = 468;
function heroDataUri(id) {
  const webp = join(ROOT, `public/media/stories/${id}/hero.webp`);
  if (!existsSync(webp)) return null;
  const tmp = join(tmpdir(), `sk-hero-${id}.png`);
  try {
    execFileSync('convert', [webp, '-resize', `${HERO_W * 2}x`, tmp], { stdio: 'ignore' });
    const b64 = readFileSync(tmp).toString('base64');
    rmSync(tmp, { force: true });
    return `data:image/png;base64,${b64}`;
  } catch { return null; }   // no ImageMagick: fall back to the type-only card
}

function card(s) {
  const heroPeek = existsSync(join(ROOT, `public/media/stories/${s.id}/hero.webp`));
  const colW = heroPeek ? 1122 - (HERO_W + 56) : 1044;
  const { size, lines } = fitTitle(s.title, colW);
  const tease = wrap(s.tease ?? '', colW, 27, 0.49).slice(0, heroPeek ? 3 : 2);
  // The card advertises what /s/ actually serves, and prerender publishes the
  // Match what /s/ actually serves, which is the FULL telling (prerender.mjs
  // takes s.lengths.full). This read short for a while, from back when the
  // share page published the short rendition — so the card was advertising
  // three minutes over a six-minute page and halving the thing the whole
  // brand promises.
  const r = s.lengths.full ?? s.lengths.short;
  const hero = heroDataUri(s.id);
  // The right-hand block (minutes, age) starts around x=900, so with the art
  // column the locus has ~350px, not the full width it used to have. Clip it
  // rather than let it run underneath.
  const locusRoom = Math.floor((900 - (hero ? HERO_W + 56 : 78)) / (21 * 0.46));
  const locus = (s.source.locus ?? '').length > locusRoom
    ? (s.source.locus ?? '').slice(0, locusRoom - 1).replace(/[\s,—-]+$/, '') + '…'
    : (s.source.locus ?? '');
  const X = hero ? HERO_W + 56 : 78;          // left edge of the type
  const RIGHT = 1122;                          // right edge, unchanged
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
${hero ? `<clipPath id="art"><rect x="0" y="0" width="${HERO_W}" height="630"/></clipPath>
<image href="${hero}" x="0" y="0" width="${HERO_W}" height="630"
       preserveAspectRatio="xMidYMin slice" clip-path="url(#art)"/>
<linearGradient id="fade" x1="0" x2="1"><stop offset="0%" stop-color="#14101c" stop-opacity="0"/><stop offset="100%" stop-color="#14101c"/></linearGradient>
<rect x="${HERO_W - 90}" y="0" width="90" height="630" fill="url(#fade)"/>` : ''}

<!-- diya -->
<g transform="translate(${X},64)">
  <path d="M7 0 C13 11 15 19 7 28 C-1 19 1 11 7 0 Z" fill="url(#flame)"/>
  <ellipse cx="7" cy="21" rx="2.4" ry="5" fill="#fff6dd" opacity="0.9"/>
  <path d="M-13 32 Q7 47 27 32 Q7 38 -13 32 Z" fill="#a97c3a"/>
</g>
<text x="${X + 40}" y="80" font-family="Karla" font-size="23" font-weight="700"
      letter-spacing="1.6" fill="#f3e7d3">SANDHYA KATHA</text>
<text x="${X + 40}" y="105" font-family="Tiro Devanagari Sanskrit" font-size="17" fill="#a97c3a">संध्या कथा</text>

${lines.map((l, i) => `<text x="${X}" y="${titleTop + i * size * 1.14}" font-family="Gentium Book Plus"
      font-size="${size}" fill="#f3e7d3">${esc(l)}</text>`).join('\n')}

${tease.map((l, i) => `<text x="${X}" y="${teaseTop + i * 38}" font-family="Gentium Book Plus"
      font-size="27" font-style="italic" fill="#c9baa4">${esc(l)}</text>`).join('\n')}

<line x1="${X}" y1="516" x2="1122" y2="516" stroke="#302941" stroke-width="1.5"/>
<text x="${X}" y="558" font-family="Karla" font-size="22" font-weight="600" fill="#f0b458">${esc(s.source.work)}</text>
<text x="${X}" y="589" font-family="Gentium Book Plus" font-size="21" font-style="italic"
      fill="#948aa6">${esc(locus)}</text>
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
  // JPEG, not PNG. Once the card carries an illustration it is a photograph,
  // and PNG makes it ~950KB. WhatsApp — the channel that matters most here —
  // commonly drops a link preview whose image is much over 300KB, so a
  // prettier card that nobody sees is worse than the plain one it replaced.
  // The same card as JPEG q82 is ~150KB and visually identical at this size.
  const out = join(OUT, `${s.id}.jpg`);
  if (existsSync(out) && !all) { kept++; continue; }
  const r = new Resvg(card(s), {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Gentium Book Plus' }
  });
  const tmp = join(tmpdir(), `sk-card-${s.id}.png`);
  writeFileSync(tmp, r.render().asPng());
  execFileSync('convert', [tmp, '-strip', '-interlace', 'Plane', '-quality', '82', out], { stdio: 'ignore' });
  rmSync(tmp, { force: true });
  console.log(`  drew ${s.id}.jpg`);
  drew++;
}
console.log(`${drew} card(s) drawn, ${kept} already had one`);
