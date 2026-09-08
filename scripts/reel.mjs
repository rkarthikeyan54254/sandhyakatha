#!/usr/bin/env node
/**
 * A vertical reel per story: 1080×1920, silent, slow crossfades.
 *
 * Silent on purpose. This is a read-aloud product, so the audio that belongs
 * on it is a voice reading the story — yours, or a rendered narration once the
 * voice work lands — not a trending track. Instagram lets you add that on the
 * phone, and a reel whose audio is the actual telling is the only kind of reel
 * this project can post that nobody else could have made.
 *
 * Pace is deliberate: 3.6s a card, dipping through black between them —
 * text never crossfades over text, and the dip reads as the printed `beat`
 * the stories already use. Bedtime, not TikTok.
 *
 *   npm run reel -- <story-id>
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';

const ROOT = new URL('..', import.meta.url).pathname;
const FONTS = join(ROOT, 'assets/fonts');
const OUT = join(ROOT, 'social');
const W = 1080, H = 1920, HOLD = 3.6, XF = 0.7;

const id = process.argv[2];
if (!id) { console.error('usage: npm run reel -- <story-id>'); process.exit(1); }
const s = JSON.parse(readFileSync(join(ROOT, `content/stories/${id}.json`), 'utf8'));

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const plain = t => t.replace(/[«»]/g, '').replace(/_([^_]+)_/g, '$1');

function wrap(text, maxPx, sizePx, em = 0.47) {
  const per = sizePx * em, out = []; let line = '';
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (t.length * per > maxPx && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** First sentence of a block — a reel card holds one thought, not a paragraph. */
const firstSentence = t => {
  const p = plain(t).match(/^.*?[.?!](?=\s|$)/);
  return (p ? p[0] : plain(t)).trim();
};

function card(lines, { size, color = '#f3e7d3', kicker = null, url = false }) {
  const lh = size * 1.36;
  const top = H / 2 - ((lines.length - 1) * lh) / 2 + size * 0.32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <radialGradient id="g" cx="50%" cy="12%" r="70%">
    <stop offset="0%" stop-color="#342a58"/><stop offset="100%" stop-color="#14101c" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="f" cx="50%" cy="62%" r="60%">
    <stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="#f0b458"/><stop offset="100%" stop-color="#e0873f"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="#14101c"/>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<g transform="translate(96,150)">
  <path d="M9 0 C17 14 19 24 9 36 C-1 24 1 14 9 0 Z" fill="url(#f)"/>
  <ellipse cx="9" cy="27" rx="3" ry="6.4" fill="#fff6dd" opacity="0.9"/>
  <path d="M-17 42 Q9 61 35 42 Q9 50 -17 42 Z" fill="#a97c3a"/>
</g>
<text x="148" y="171" font-family="Karla" font-size="26" font-weight="700"
      letter-spacing="2.2" fill="#c9baa4">SANDHYA KATHA</text>
${kicker ? `<text x="96" y="${top - lines.length * lh / 2 - 66}" font-family="Karla" font-size="24"
   font-weight="700" letter-spacing="3" fill="#a97c3a">${esc(kicker)}</text>` : ''}
${lines.map((l, i) => `<text x="96" y="${top + i * lh}" font-family="Gentium Book Plus"
   font-size="${size}" fill="${color}">${esc(l)}</text>`).join('\n')}
${url ? `<text x="96" y="1742" font-family="Karla" font-size="42" font-weight="700"
   fill="#f0b458">sandhyakatha.com</text>` : `<text x="96" y="1742" font-family="Karla" font-size="26"
   fill="#5d5474">sandhyakatha.com</text>`}
</svg>`;
}

/* ---- the cards ---- */
const body = s.lengths.short.blocks.filter(b => b.t !== 'beat');
const slow = body[body.length - 1];
const mid = body.slice(0, -1);
const at = f => mid[Math.min(mid.length - 1, Math.round((mid.length - 1) * f))];

const cards = [
  { lines: wrap(s.title, 890, 92, 0.46), size: 92 },
  { lines: wrap(plain(s.tease), 890, 46), size: 46, color: '#c9baa4' },
  ...[0, 0.38, 0.72].map(f => ({ lines: wrap(firstSentence(at(f).text), 890, 56), size: 56 })),
  { lines: wrap(firstSentence(slow.text), 890, 60), size: 60, color: '#ffe9c4' },
  { lines: wrap(plain(s.close.question), 890, 50), size: 50, color: '#ffe9c4', kicker: 'NOW TURN TO YOUR CHILD' },
  { lines: wrap('The whole telling, free.', 890, 54), size: 54, url: true },
];

const tmp = join(OUT, `.reel-${id}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(OUT, { recursive: true });

cards.forEach((c, i) => {
  const r = new Resvg(card(c.lines, c), { fitTo: { mode: 'width', value: W },
    font: { fontDirs: [FONTS], loadSystemFonts: false, defaultFontFamily: 'Gentium Book Plus' } });
  writeFileSync(join(tmp, `${String(i).padStart(2, '0')}.png`), r.render().asPng());
});

/* ---- xfade chain: offset of the k-th transition is (k+1)*(hold - xfade) ---- */
const n = cards.length;
const args = [];
for (let i = 0; i < n; i++) args.push('-loop', '1', '-t', String(HOLD), '-i', join(tmp, `${String(i).padStart(2, '0')}.png`));
let filter = '', prev = '[0:v]';
for (let i = 1; i < n; i++) {
  const off = (i * (HOLD - XF)).toFixed(3);
  const out = i === n - 1 ? '[v]' : `[x${i}]`;
  filter += `${prev}[${i}:v]xfade=transition=fadeblack:duration=${XF}:offset=${off}${out};`;
  prev = `[x${i}]`;
}
filter = filter.replace(/;$/, '');

const mp4 = join(OUT, `${id}-reel.mp4`);
execFileSync('ffmpeg', ['-y', ...args, '-filter_complex', filter, '-map', '[v]',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', mp4],
  { stdio: ['ignore', 'ignore', 'pipe'] });
rmSync(tmp, { recursive: true, force: true });

const secs = (n * HOLD - (n - 1) * XF).toFixed(1);
console.log(`${id}-reel.mp4 — ${n} cards, ${secs}s, ${W}×${H}, silent`);
console.log('\ncards:');
cards.forEach((c, i) => console.log(`  ${i + 1}. ${c.lines.join(' ')}`));
