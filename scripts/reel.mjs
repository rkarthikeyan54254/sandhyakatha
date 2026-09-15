#!/usr/bin/env node
/**
 * Deterministic Sandhya Katha reel generator.
 *
 * Cheap preflight:
 *   npm run reel:check -- <story-id>
 *
 * Generate + gate + open local review:
 *   npm run reel -- <story-id> --open
 */
import {
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import { audienceText } from './lib/lexicon-display.mjs';
import { approvedHeroUrl } from './lib/media.mjs';
import { REEL_STYLE as S } from './lib/reel-style.mjs';
import { gatePlan, gateRendered } from './lib/reel-gates.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const FONTS = join(ROOT, 'assets', 'fonts');
const OUT = join(ROOT, 'social');
const REVIEW = join(OUT, 'review');

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const openReview = argv.includes('--open');
const id = argv.find(a => !a.startsWith('--'));

if (!id) {
  console.error(
    'usage:\n' +
    '  npm run reel:check -- <story-id>\n' +
    '  npm run reel -- <story-id> [--open]'
  );
  process.exit(1);
}

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const s = read(`content/stories/${id}.json`);
const lex = read('content/lexicon.json');
const canon = read('content/canon.json').canon;
const media = read('content/media.json').stories ?? {};
const social = read('content/social.json').stories ?? {};
const canonRow = canon.find(row => row.id === id);
const spec = social[id]?.reel;

const plain = t => audienceText(String(t ?? ''), lex).trim();
const esc = t =>
  String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function sentences(text) {
  const t = plain(text);
  const parts = t.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  return parts.length ? parts : [t];
}

function firstSentence(text) {
  return sentences(text)[0] ?? '';
}

function wrap(text, maxPx, sizePx, em = 0.47) {
  const per = sizePx * em;
  const out = [];
  let line = '';

  for (const w of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length * per > maxPx && line) {
      out.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) out.push(line);
  return out;
}

function pickHook() {
  const hs = spec?.hook ?? { from: 'canon', mode: 'firstSentence' };
  let raw;
  if (hs.from === 'title') raw = s.title;
  else if (hs.from === 'tease') raw = s.tease;
  else raw = canonRow?.hook || s.tease;

  return hs.mode === 'firstSentence' ? firstSentence(raw) : plain(raw);
}

function selectedBody() {
  if (!spec?.blocks?.length) return [];

  const blocks = s.lengths.short.blocks.filter(b => b.t === 'p' || b.t === 'slow');

  return spec.blocks.map((sel, i) => {
    const block = blocks[sel.index];
    if (!block)
      throw new Error(`Invalid reel block index ${sel.index} at selection ${i + 1}`);

    const all = sentences(block.text);
    let text;
    if ((sel.mode ?? 'full') === 'firstSentence') text = all[0];
    else if (sel.mode === 'sentence') {
      text = all[sel.sentence - 1];
      if (!text)
        throw new Error(
          `Block ${sel.index} has ${all.length} sentence(s); cannot select sentence ${sel.sentence}`
        );
    } else text = plain(block.text);

    return text.trim();
  });
}

const heroUrl = approvedHeroUrl({
  root: ROOT,
  story: s,
  media,
  warn: msg => console.error(`media: ${msg}`)
});

const hook = pickHook();
const body = selectedBody();
const source = `${s.source.work} · ${s.source.locus}`;
const cta = `Read the ${s.lengths.full.minutes}-minute telling tonight.`;
const storyUrl = `sandhyakatha.com/s/${id}/`;

const cards = [
  {
    role: 'cover',
    text: hook,
    size: S.hookSize,
    lines: wrap(hook, 860, S.hookSize),
    color: S.highlight
  },
  {
    role: 'hero',
    text: '',
    size: S.bodySize,
    lines: [],
    color: S.paper
  },
  ...body.map((text, i) => ({
    role: 'body',
    text,
    size: S.bodySize,
    lines: wrap(text, 890, S.bodySize),
    color: i === body.length - 1 ? S.highlight : S.paper
  })),
  {
    role: 'source',
    text: source,
    size: S.sourceSize,
    lines: wrap(source, 890, S.sourceSize),
    color: S.paperDim,
    kicker: 'SOURCE CHECKED'
  },
  {
    role: 'cta',
    text: cta,
    size: S.ctaSize,
    lines: wrap(cta, 890, S.ctaSize),
    color: S.paper,
    kicker: 'READ TONIGHT',
    url: storyUrl
  }
];

let passes;
try {
  passes = gatePlan({ root: ROOT, story: s, spec, heroUrl, cards });
} catch {
  process.exit(1);
}

console.log(`reel preflight: PASS — ${passes.join(' · ')}`);
console.log('\nplan:');
cards.forEach((c, i) => console.log(`  ${i + 1}. [${c.role}] ${c.text}`));

if (checkOnly) {
  console.log('\nNo render performed.');
  process.exit(0);
}

function brand() {
  return `
<g transform="translate(${S.left},${S.brandY})">
  <path d="M9 0 C17 14 19 24 9 36 C-1 24 1 14 9 0 Z" fill="url(#flame)"/>
  <ellipse cx="9" cy="27" rx="3" ry="6.4" fill="#fff6dd" opacity="0.9"/>
  <path d="M-17 42 Q9 61 35 42 Q9 50 -17 42 Z" fill="${S.goldDim}"/>
</g>
<text x="${S.left + 52}" y="${S.brandY + 21}" font-family="${S.sans}" font-size="26"
      font-weight="700" letter-spacing="2.2" fill="${S.paperDim}">SANDHYA KATHA</text>`;
}

function defs() {
  return `<defs>
  <radialGradient id="g" cx="50%" cy="12%" r="70%">
    <stop offset="0%" stop-color="${S.dusk}"/>
    <stop offset="100%" stop-color="${S.night}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="flame" cx="50%" cy="62%" r="60%">
    <stop offset="0%" stop-color="#fff0c4"/>
    <stop offset="60%" stop-color="${S.gold}"/>
    <stop offset="100%" stop-color="#e0873f"/>
  </radialGradient>
  <linearGradient id="coverShade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0e0a16" stop-opacity=".38"/>
    <stop offset="48%" stop-color="#0e0a16" stop-opacity=".40"/>
    <stop offset="100%" stop-color="#0e0a16" stop-opacity=".88"/>
  </linearGradient>
</defs>`;
}

function textLines(lines, { size, color, startY, lineHeight = 1.34 }) {
  const lh = size * lineHeight;
  return lines.map((line, i) =>
    `<text x="${S.left}" y="${startY + i * lh}" font-family="${S.serif}"
       font-size="${size}" fill="${color}">${esc(line)}</text>`
  ).join('\n');
}

function textCardSvg(c) {
  const lh = c.size * 1.34;
  const blockH = (c.lines.length - 1) * lh;
  const top = S.height / 2 - blockH / 2 + c.size * 0.30;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S.width}" height="${S.height}"
     viewBox="0 0 ${S.width} ${S.height}">
${defs()}
<rect width="${S.width}" height="${S.height}" fill="${S.night}"/>
<rect width="${S.width}" height="${S.height}" fill="url(#g)"/>
${brand()}
${c.kicker ? `<text x="${S.left}" y="${top - 100}" font-family="${S.sans}" font-size="24"
  font-weight="700" letter-spacing="3" fill="${S.goldDim}">${esc(c.kicker)}</text>` : ''}
${textLines(c.lines, { size: c.size, color: c.color, startY: top })}
${c.url
  ? `<text x="${S.left}" y="${S.footerY}" font-family="${S.sans}" font-size="${S.urlSize}"
       font-weight="700" fill="${S.gold}">${esc(c.url)}</text>`
  : `<text x="${S.left}" y="${S.footerY}" font-family="${S.sans}" font-size="${S.footerSize}"
       font-weight="600" letter-spacing="0.8" fill="${S.footer}">sandhyakatha.com</text>`}
</svg>`;
}

function heroSvg(dataUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S.width}" height="${S.height}"
     viewBox="0 0 ${S.width} ${S.height}">
${defs()}
<image href="${dataUri}" x="0" y="0" width="${S.width}" height="${S.height}"
       preserveAspectRatio="xMidYMid slice"/>
<rect width="${S.width}" height="${S.height}" fill="#0e0a16" opacity="0.10"/>
${brand()}
<text x="${S.left}" y="${S.footerY}" font-family="${S.sans}" font-size="26"
      fill="${S.paperDim}">sandhyakatha.com</text>
</svg>`;
}

function coverSvg(c, dataUri) {
  const lh = c.size * 1.24;
  const blockH = (c.lines.length - 1) * lh;
  const top = 1190 - blockH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S.width}" height="${S.height}"
     viewBox="0 0 ${S.width} ${S.height}">
${defs()}
<image href="${dataUri}" x="0" y="0" width="${S.width}" height="${S.height}"
       preserveAspectRatio="xMidYMid slice"/>
<rect width="${S.width}" height="${S.height}" fill="url(#coverShade)"/>
${brand()}
${textLines(c.lines, { size: c.size, color: c.color, startY: top, lineHeight: 1.24 })}
<text x="${S.left}" y="${S.footerY}" font-family="${S.sans}" font-size="26"
      fill="${S.paperDim}">sandhyakatha.com</text>
</svg>`;
}

const rawHero = heroUrl.split('?')[0];
const heroDisk = join(ROOT, 'public', rawHero.replace(/^\/+/, ''));
const heroExt = heroDisk.toLowerCase().endsWith('.png') ? 'png'
  : heroDisk.toLowerCase().endsWith('.jpg') || heroDisk.toLowerCase().endsWith('.jpeg') ? 'jpeg'
  : 'webp';
const heroData = `data:image/${heroExt};base64,${readFileSync(heroDisk).toString('base64')}`;

mkdirSync(OUT, { recursive: true });
mkdirSync(REVIEW, { recursive: true });
const reviewDir = join(REVIEW, id);
rmSync(reviewDir, { recursive: true, force: true });
mkdirSync(reviewDir, { recursive: true });

const framePaths = [];
const resvgOptions = {
  fitTo: { mode: 'width', value: S.width },
  font: {
    fontDirs: [FONTS],
    loadSystemFonts: false,
    defaultFontFamily: S.serif
  }
};

cards.forEach((c, i) => {
  const path = join(reviewDir, `card-${String(i + 1).padStart(2, '0')}.png`);

  if (c.role === 'hero') {
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-v', 'error',
        '-i', heroDisk,
        '-vf',
        `scale=${S.width}:${S.height}:force_original_aspect_ratio=increase,` +
          `crop=${S.width}:${S.height}`,
        '-frames:v', '1',
        path
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );

    if (!existsSync(path))
      throw new Error(`FAIL hero raster gate: frame was not written for ${id}`);

    const heroStat = statSync(path);
    if (heroStat.size < 50_000)
      throw new Error(
        `FAIL hero raster gate: rendered hero is suspiciously small (${heroStat.size} bytes)`
      );

    const probe = JSON.parse(
      execFileSync(
        'ffprobe',
        [
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries', 'stream=width,height',
          '-of', 'json',
          path
        ],
        { encoding: 'utf8' }
      )
    );
    const stream = probe.streams?.[0];

    if (+stream?.width !== S.width || +stream?.height !== S.height)
      throw new Error(
        `FAIL hero raster gate: got ${stream?.width}x${stream?.height}, ` +
        `expected ${S.width}x${S.height}`
      );

    console.log(
      `hero raster gate: PASS — ${S.width}x${S.height}, ${heroStat.size} bytes`
    );
    framePaths.push(path);
    return;
  }

  const svg = textCardSvg(c);
  const rendered = new Resvg(svg, resvgOptions).render().asPng();
  writeFileSync(path, rendered);
  framePaths.push(path);
});

const coverOut = join(OUT, `${id}-reel-cover.png`);
copyFileSync(framePaths[0], coverOut);

const args = [];
for (const frame of framePaths) {
  args.push('-loop', '1', '-t', String(S.holdSeconds), '-i', frame);
}

let filter = '';
let prev = '[0:v]';
for (let i = 1; i < framePaths.length; i++) {
  const off = (i * (S.holdSeconds - S.fadeSeconds)).toFixed(3);
  const next = i === framePaths.length - 1 ? '[v]' : `[x${i}]`;
  filter += `${prev}[${i}:v]xfade=transition=fadeblack:duration=${S.fadeSeconds}:offset=${off}${next};`;
  prev = `[x${i}]`;
}
filter = filter.replace(/;$/, '');

const mp4 = join(OUT, `${id}-reel.mp4`);
execFileSync('ffmpeg', [
  '-y',
  ...args,
  '-filter_complex', filter,
  '-map', '[v]',
  '-c:v', 'libx264',
  '-profile:v', 'high',
  '-level:v', '4.1',
  '-preset', 'slow',
  '-tune', 'stillimage',
  '-crf', '14',
  '-pix_fmt', 'yuv420p',
  '-r', '30',
  '-colorspace', 'bt709',
  '-color_primaries', 'bt709',
  '-color_trc', 'bt709',
  '-movflags', '+faststart',
  mp4
], { stdio: ['ignore', 'ignore', 'pipe'] });

let technical;
try {
  technical = gateRendered(mp4);
} catch {
  process.exit(1);
}

const manifest = {
  template: S.id,
  storyId: id,
  storyVersion: s.version,
  hero: heroUrl,
  source,
  output: mp4.replace(ROOT + '/', ''),
  durationSeconds: +technical.duration.toFixed(1),
  cards: cards.map(c => ({ role: c.role, text: c.text })),
  gates: passes
};
writeFileSync(
  join(reviewDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);

const frameHtml = framePaths.map((p, i) =>
  `<figure><img src="${p.split('/').at(-1)}"><figcaption>${i + 1}. ${esc(cards[i].role)}</figcaption></figure>`
).join('\n');

const checks = passes.map(x => `<li>✓ ${esc(x)}</li>`).join('');
const reviewHtml = `<!doctype html>
<html><head><meta charset="utf-8">
<title>${esc(s.title)} · Reel review</title>
<style>
body{margin:0;background:#100c17;color:#f3e7d3;font:16px system-ui;padding:32px}
h1{font:36px Georgia,serif;margin:0 0 10px}.sub{color:#b9ad9d;margin-bottom:28px}
video{width:min(360px,90vw);display:block;border-radius:14px;margin-bottom:30px}
ul{line-height:1.8;color:#d8cbb8}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
figure{margin:0}img{width:100%;display:block;border-radius:10px}figcaption{color:#8e849f;padding:6px 0}
</style></head><body>
<h1>${esc(s.title)}</h1>
<p class="sub">${esc(S.id)} · ${cards.length} cards · ${technical.duration.toFixed(1)}s · silent</p>
<video controls muted src="../../${id}-reel.mp4"></video>
<h2>Programmatic gates</h2><ul>${checks}<li>✓ rendered ${S.width}×${S.height}, no audio</li></ul>
<h2>Visual review</h2>
<div class="grid">${frameHtml}</div>
</body></html>`;
const reviewPath = join(reviewDir, 'index.html');
writeFileSync(reviewPath, reviewHtml);

console.log(
  `\nreel render: PASS — ${cards.length} cards, ${technical.duration.toFixed(1)}s, ` +
  `${S.width}×${S.height}, silent`
);
console.log(`video:  social/${id}-reel.mp4`);
console.log(`cover:  social/${id}-reel-cover.png`);
console.log(`review: social/review/${id}/index.html`);
console.log(`\nLocal visual check:\n  open social/review/${id}/index.html`);

if (openReview && process.platform === 'darwin') {
  execFileSync('open', [reviewPath]);
}
