#!/usr/bin/env node
/**
 * Instagram carousels, drawn from the story JSON.
 *
 * The account has to have something to post before the site has a shelf worth
 * pointing at, and the only content we own that nobody else has is the tellings
 * themselves. So a carousel is not a summary of a story — it is six slides of
 * the actual short rendition, in the site's own voice, ending on the closing
 * question rather than on a call to action. The link is one line on slide seven.
 *
 * Nothing here is posted automatically. It writes files and a caption; a person
 * reads both and decides.
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

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const plain = s => s.replace(/[«»]/g, '').replace(/_([^_]+)_/g, '$1');

function wrap(text, maxPx, sizePx, em = 0.50) {
  const per = sizePx * em, out = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const t = line ? `${line} ${word}` : word;
    if (t.length * per > maxPx && line) { out.push(line); line = word; } else line = t;
  }
  if (line) out.push(line);
  return out;
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

function titleSlide(s, total) {
  const t = wrap(s.title, 900, 68, 0.47);
  const tease = wrap(plain(s.tease), 900, 34, 0.49);
  const top = 430 - (t.length - 1) * 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs}${chrome(0, total)}
${t.map((l, i) => `<text x="90" y="${top + i * 82}" font-family="Gentium Book Plus" font-size="68"
   fill="#f3e7d3">${esc(l)}</text>`).join('\n')}
${tease.map((l, i) => `<text x="90" y="${top + t.length * 82 + 30 + i * 50}" font-family="Gentium Book Plus"
   font-size="34" font-style="italic" fill="#c9baa4">${esc(l)}</text>`).join('\n')}
<text x="90" y="940" font-family="Karla" font-size="22" font-weight="600" fill="#f0b458">${esc(s.source.work)}</text>
</svg>`;
}

function endSlide(s, total) {
  const note = wrap(s.source.traditionNote ?? `Told from ${s.source.work}, ${s.source.locus}.`, 900, 30, 0.49).slice(0, 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
${defs}${chrome(total - 1, total)}
<text x="90" y="300" font-family="Karla" font-size="19" font-weight="700" letter-spacing="2.4"
      fill="#a97c3a">WHERE IT COMES FROM</text>
<text x="90" y="360" font-family="Karla" font-size="30" font-weight="700" fill="#f0b458">${esc(s.source.work)}</text>
<text x="90" y="402" font-family="Gentium Book Plus" font-size="27" font-style="italic" fill="#948aa6">${esc(s.source.locus)}</text>
${note.map((l, i) => `<text x="90" y="${470 + i * 44}" font-family="Gentium Book Plus" font-size="30"
   fill="#c9baa4">${esc(l)}</text>`).join('\n')}
<line x1="90" y1="800" x2="990" y2="800" stroke="#302941" stroke-width="1.5"/>
<text x="90" y="862" font-family="Gentium Book Plus" font-size="38" fill="#f3e7d3">The whole telling, free, no app to install:</text>
<text x="90" y="922" font-family="Karla" font-size="38" font-weight="700" fill="#f0b458">sandhyakatha.com</text>
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

mkdirSync(OUT, { recursive: true });
let made = 0;
for (const f of readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(join(ROOT, 'content/stories', f), 'utf8'));
  if (s.status !== 'published') continue;
  if (only.length && !only.includes(s.id)) continue;

  const body = pick(s);
  const total = 2 + body.length + 1;               // title + body + question + source
  const dir = join(OUT, s.id);
  mkdirSync(dir, { recursive: true });

  png(titleSlide(s, total), join(dir, '01.png'));
  body.forEach((blk, i) =>
    png(slide(blk.text, i + 1, total, { size: i === body.length - 1 ? 50 : 44,
                                        color: i === body.length - 1 ? '#ffe9c4' : '#f3e7d3' }),
        join(dir, String(i + 2).padStart(2, '0') + '.png')));
  png(slide(s.close.question, total - 2, total,
            { size: 46, italic: true, color: '#ffe9c4', kicker: 'NOW TURN TO YOUR CHILD' }),
      join(dir, String(body.length + 2).padStart(2, '0') + '.png'));
  png(endSlide(s, total), join(dir, String(total).padStart(2, '0') + '.png'));

  const tags = ['#sandhyakatha', '#bedtimestories', '#indianmythology', '#storiesforkids',
    '#puranas', '#ramayana', '#mahabharata', '#parentingindia', '#raisingreaders',
    '#indianparents', '#mythologyforkids', '#bedtimereading', '#desiparenting', '#tamilculture'];
  writeFileSync(join(dir, 'caption.txt'),
`${s.tease}

${plain(s.close.question)}

${s.source.work} — ${s.source.locus}. ${s.audience.minAge}+, ${s.lengths.full.minutes} minutes read aloud.
The whole telling is free at sandhyakatha.com/s/${s.id}

${tags.join(' ')}
`);
  console.log(`  ${s.id}: ${total} slides + caption`);
  made++;
}
console.log(`${made} carousel(s) → social/`);
