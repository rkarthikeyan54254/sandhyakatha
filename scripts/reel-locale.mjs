#!/usr/bin/env node
/**
 * Browser-native locale reel renderer.
 *
 * Complex scripts are not manually measured or positioned. Chromium receives
 * one normal text node and owns shaping, spaces, ligatures, and line breaking.
 * English keeps using scripts/reel.mjs unchanged.
 */
import {
  existsSync, statSync, readFileSync, writeFileSync,
  mkdirSync, rmSync, copyFileSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { approvedHeroUrl } from './lib/media.mjs';
import { REEL_STYLE as S } from './lib/reel-style.mjs';
import { gateRendered } from './lib/reel-gates.mjs';
import { gateLocalePlan } from './lib/reel-locale-gates.mjs';
import {
  findBrowser, fontDataUrl, inspectHtml, screenshotHtml
} from './lib/browser-card-render.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const FONTS = join(ROOT, 'assets', 'fonts');
const SOCIAL = join(ROOT, 'social');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const openReview = args.includes('--open');
const localeAt = args.indexOf('--locale');
const locale = localeAt >= 0 ? args[localeAt + 1] : null;
const positional = args.filter(
  (arg, i) => !arg.startsWith('--') && i !== localeAt + 1
);
const id = positional[0];

if (!locale || !id) {
  console.error(
    'usage:\n' +
    '  node scripts/reel-locale.mjs --locale hi-IN --check <story-id>\n' +
    '  node scripts/reel-locale.mjs --locale hi-IN <story-id> [--open]'
  );
  process.exit(1);
}

const language = locale.split('-')[0].toLowerCase();
const read = path => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

const story = read(`content/stories/${id}.json`);
const localeDoc = read(`content/locales/${language}/${id}.json`);
const lock = read('content/locale.lock.json');
const media = read('content/media.json').stories ?? {};
const socialLocales = read('content/social-locales.json');
const spec = socialLocales.locales?.[locale]?.stories?.[id];

if (!spec)
  throw new Error(`no ${locale} reel selectors for ${id}`);

const browser = findBrowser();
console.log(`script renderer: ${browser}`);

const esc = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function localePlain(value) {
  return String(value ?? '')
    .replace(/«([^»]+)»/g, (_m, key) => localeDoc.displayNames?.[key] ?? key)
    .replace(/_/g, '')
    .trim();
}

function sentences(value) {
  const text = localePlain(value);
  const separator = language === 'hi'
    ? /(?<=[।!?])\s+/u
    : /(?<=[.!?])\s+/u;
  const parts = text.split(separator).map(x => x.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

function choose(value, selector) {
  const parts = sentences(value);
  const mode = selector.mode ?? 'full';
  if (mode === 'firstSentence') return parts[0] ?? '';
  if (mode === 'sentence') {
    const text = parts[selector.sentence - 1];
    if (!text)
      throw new Error(`requested sentence ${selector.sentence} does not exist`);
    return text;
  }
  return localePlain(value);
}

const hookSelector = spec.hook ?? { from:'tease', mode:'firstSentence' };
const hook = choose(
  hookSelector.from === 'title' ? localeDoc.title : localeDoc.tease,
  hookSelector
);

const narrative = localeDoc.lengths.short.blocks.filter(
  block => block.t === 'p' || block.t === 'slow'
);

const bodies = spec.blocks.map((selector, i) => {
  const block = narrative[selector.index];
  if (!block)
    throw new Error(`selector ${i + 1}: narrative index ${selector.index} missing`);
  const text = choose(block.text, selector);
  return {
    text,
    sourcePlain:text,
    sourceRaw:block.text,
    selector,
    scene:block.scene ?? null
  };
});

const heroUrl = approvedHeroUrl({
  root:ROOT, story, media,
  warn:message => console.error(`media: ${message}`)
});
const source = `${story.source.work} · ${story.source.locus}`;

const UI = {
  'hi-IN': {
    sourceKicker:'स्रोत',
    ctaKicker:'आज रात पढ़ें',
    cta:'पूरी कहानी आज रात पढ़ें।'
  }
};
const ui = UI[locale];
if (!ui)
  throw new Error(`locale UI contract missing for ${locale}`);

const fonts = {
  deva:fontDataUrl(join(FONTS, 'TiroDevanagariSanskrit-Regular.ttf')),
  gentium:fontDataUrl(join(FONTS, 'GentiumBookPlus-Regular.ttf')),
  karla:fontDataUrl(join(FONTS, 'Karla-var.ttf'))
};

const rawHero = heroUrl.split('?')[0];
const heroDisk = join(ROOT, 'public', rawHero.replace(/^\/+/, ''));
const heroExt = heroDisk.toLowerCase().endsWith('.png') ? 'png'
  : heroDisk.toLowerCase().endsWith('.jpg') ||
    heroDisk.toLowerCase().endsWith('.jpeg') ? 'jpeg' : 'webp';
const heroData =
  `data:image/${heroExt};base64,${readFileSync(heroDisk).toString('base64')}`;

function brand() {
  return `<div class="brand">
    <svg viewBox="0 0 52 62" aria-hidden="true">
      <defs><radialGradient id="f" cx="50%" cy="62%" r="60%">
        <stop offset="0%" stop-color="#fff0c4"/>
        <stop offset="60%" stop-color="${S.gold}"/>
        <stop offset="100%" stop-color="#e0873f"/>
      </radialGradient></defs>
      <path d="M26 0 C34 14 36 24 26 36 C16 24 18 14 26 0 Z" fill="url(#f)"/>
      <ellipse cx="26" cy="27" rx="3" ry="6.4" fill="#fff6dd" opacity=".9"/>
      <path d="M0 42 Q26 61 52 42 Q26 50 0 42 Z" fill="${S.goldDim}"/>
    </svg><span>SANDHYA KATHA</span>
  </div>`;
}

function probeScript(family, sample) {
  return `<script>
document.fonts.ready.then(() => {
  try {
    const el = document.querySelector('[data-sk-text]');
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = Array.from(range.getClientRects())
      .filter(r => r.width > 0 && r.height > 0);
    const box = el.getBoundingClientRect();

    const widths = rects.map(r => r.width / box.width);
    const html = document.documentElement;
    html.setAttribute('data-sk-engine','chromium-block-layout-v1');
    html.setAttribute('data-sk-font-loaded',
      document.fonts.check('64px "${family}"','${sample}') ? '1' : '0');
    html.setAttribute('data-sk-lines', String(rects.length));
    html.setAttribute('data-sk-overflow-x',
      (el.scrollWidth > el.clientWidth + 1 ||
       rects.some(r => r.left < box.left - 1 || r.right > box.right + 1)) ? '1' : '0');
    html.setAttribute('data-sk-overflow-y',
      (el.scrollHeight > el.clientHeight + 1) ? '1' : '0');
    html.setAttribute('data-sk-min-line-ratio',
      String(widths.length ? Math.min(...widths) : 0));
    html.setAttribute('data-sk-max-line-ratio',
      String(widths.length ? Math.max(...widths) : 0));
    html.setAttribute('data-sk-source-length', String(el.textContent.length));
    html.setAttribute('data-sk-ready','1');
  } catch (e) {
    document.documentElement.setAttribute(
      'data-sk-error', encodeURIComponent(String(e.stack || e))
    );
  }
});
</script>`;
}

function cardHtml(card, size) {
  const isHindi = language === 'hi' && card.role !== 'source';
  const family = isHindi ? 'SKDeva' : 'SKGentium';
  const lineHeight = isHindi ? 1.48 : 1.36;
  const sample = isHindi ? 'हिन्दी' : 'Rama';
  const positionClass = card.role === 'cover' ? 'cover-copy' : 'center-copy';
  const bg = card.role === 'cover'
    ? `<img class="hero" src="${heroData}"><div class="cover-shade"></div>`
    : `<div class="night"></div><div class="glow"></div>`;
  const kickerFamily =
    /[\u0900-\u097f]/u.test(card.kicker ?? '') ? 'SKDeva' : 'SKKarla';

  return `<!doctype html><html lang="${isHindi ? 'hi' : 'en'}"><head>
<meta charset="utf-8">
<style>
@font-face{font-family:SKDeva;src:url("${fonts.deva}") format("truetype")}
@font-face{font-family:SKGentium;src:url("${fonts.gentium}") format("truetype")}
@font-face{font-family:SKKarla;src:url("${fonts.karla}") format("truetype")}
*{box-sizing:border-box}
html,body{margin:0;width:${S.width}px;height:${S.height}px;overflow:hidden;background:${S.night}}
.card{position:relative;width:${S.width}px;height:${S.height}px;overflow:hidden}
.night{position:absolute;inset:0;background:${S.night}}
.glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 12%,${S.dusk},transparent 70%)}
.hero{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cover-shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(14,10,22,.38),rgba(14,10,22,.40) 48%,rgba(14,10,22,.88))}
.brand{position:absolute;left:${S.left}px;top:${S.brandY - 12}px;display:flex;align-items:center;gap:20px;font:700 26px SKKarla;color:${S.paperDim};letter-spacing:2.2px}
.brand svg{width:36px;height:48px}
.copy{position:absolute;left:${S.left}px;width:${S.width - S.left - 94}px}
.center-copy{top:50%;transform:translateY(-50%)}
.cover-copy{top:1100px}
.kicker{margin:0 0 54px;font:700 24px ${kickerFamily};color:${S.goldDim}}
.text{
  margin:0;width:100%;
  font-family:${family};
  font-size:${size}px;
  line-height:${lineHeight};
  font-weight:400;
  color:${card.color};
  white-space:normal;
  word-break:normal;
  overflow-wrap:normal;
  hyphens:none;
  letter-spacing:normal;
  word-spacing:normal;
  font-kerning:normal;
  font-feature-settings:"kern" 1,"liga" 1;
  text-rendering:optimizeLegibility;
  text-wrap:balance;
}
.footer{position:absolute;left:${S.left}px;top:${S.footerY - 32}px;font:600 ${card.url ? S.urlSize : S.footerSize}px SKKarla;color:${card.url ? S.gold : S.footer}}
</style></head><body>
<div class="card">${bg}${brand()}
<div class="copy ${positionClass}">
${card.kicker ? `<p class="kicker">${esc(card.kicker)}</p>` : ''}
<p class="text" data-sk-text>${esc(card.text)}</p>
</div>
<div class="footer">sandhyakatha.com</div></div>
${probeScript(family, sample)}
</body></html>`;
}

function fitCard(card) {
  const starts = {
    cover:S.hookSize,
    body:S.bodySize,
    source:S.sourceSize,
    cta:S.ctaSize
  };
  const mins = {
    cover:48,
    body:44,
    source:32,
    cta:44
  };

  let last;
  for (let size = starts[card.role]; size >= mins[card.role]; size -= 2) {
    const html = cardHtml(card, size);
    const diagnostics = inspectHtml({
      html, width:S.width, height:S.height, browser
    });
    last = diagnostics;

    const acceptable =
      diagnostics.fontLoaded &&
      !diagnostics.overflowX &&
      !diagnostics.overflowY &&
      diagnostics.lineCount <= card.maxLines &&
      (diagnostics.lineCount <= 1 || diagnostics.minLineRatio >= 0.22);

    if (acceptable)
      return { ...card, size, html, diagnostics };
  }

  throw new Error(
    `${card.role} could not fit with browser-native layout; last=` +
    JSON.stringify(last)
  );
}

const rawCards = [
  {
    role:'cover', text:hook, sourcePlain:hook,
    color:S.highlight, maxLines:S.maxLines
  },
  { role:'hero', text:'', color:S.paper, maxLines:0 },
  ...bodies.map((body, i) => ({
    role:'body',
    text:body.text,
    sourcePlain:body.sourcePlain,
    sourceRaw:body.sourceRaw,
    selector:body.selector,
    scene:body.scene,
    color:i === bodies.length - 1 ? S.highlight : S.paper,
    maxLines:S.maxLines
  })),
  {
    role:'source', text:source, color:S.paperDim,
    maxLines:S.maxSourceLines, kicker:ui.sourceKicker
  },
  {
    role:'cta', text:ui.cta, color:S.paper,
    maxLines:S.maxLines, kicker:ui.ctaKicker, url:'sandhyakatha.com'
  }
];

const cards = rawCards.map(card =>
  card.role === 'hero' ? card : fitCard(card)
);

let passes;
try {
  passes = gateLocalePlan({
    root:ROOT, story, localeDoc, lock, spec, heroUrl, cards
  });
} catch {
  process.exit(1);
}

console.log(`locale reel preflight: PASS — ${locale} · ${passes.join(' · ')}`);
cards.forEach((card, i) => {
  console.log(
    `  ${i + 1}. [${card.role}] ${card.text}` +
    (card.diagnostics
      ? ` · ${card.diagnostics.lineCount} line(s) · ${card.size}px`
      : '')
  );
});

if (checkOnly) {
  console.log('\nNo render performed.');
  process.exit(0);
}

const localeOut = join(SOCIAL, language);
const reviewDir = join(SOCIAL, 'review', language, id);
mkdirSync(localeOut, { recursive:true });
rmSync(reviewDir, { recursive:true, force:true });
mkdirSync(reviewDir, { recursive:true });

const framePaths = [];
cards.forEach((card, i) => {
  const out = join(
    reviewDir,
    `card-${String(i + 1).padStart(2, '0')}.png`
  );

  if (card.role === 'hero') {
    execFileSync('ffmpeg', [
      '-y','-v','error','-i',heroDisk,
      '-vf',
      `scale=${S.width}:${S.height}:force_original_aspect_ratio=increase,crop=${S.width}:${S.height}`,
      '-frames:v','1',out
    ], { stdio:['ignore','ignore','pipe'] });

    if (!existsSync(out) || statSync(out).size < 50_000)
      throw new Error('hero raster gate failed');
  } else {
    screenshotHtml({
      html:card.html, outPath:out,
      width:S.width, height:S.height, browser
    });
  }
  framePaths.push(out);
});

copyFileSync(
  framePaths[0],
  join(localeOut, `${id}-reel-cover.png`)
);

const ff = [];
for (const frame of framePaths)
  ff.push('-loop','1','-t',String(S.holdSeconds),'-i',frame);

let filter = '';
let prev = '[0:v]';
for (let i = 1; i < framePaths.length; i++) {
  const offset = (i * (S.holdSeconds - S.fadeSeconds)).toFixed(3);
  const next = i === framePaths.length - 1 ? '[v]' : `[x${i}]`;
  filter += `${prev}[${i}:v]xfade=transition=fadeblack:duration=${S.fadeSeconds}:offset=${offset}${next};`;
  prev = `[x${i}]`;
}
filter = filter.replace(/;$/, '');

const mp4 = join(localeOut, `${id}-reel.mp4`);
execFileSync('ffmpeg', [
  '-y',...ff,
  '-filter_complex',filter,
  '-map','[v]',
  '-c:v','libx264',
  '-profile:v','high',
  '-level:v','4.1',
  '-preset','slow',
  '-tune','stillimage',
  '-crf','14',
  '-pix_fmt','yuv420p',
  '-r','30',
  '-colorspace','bt709',
  '-color_primaries','bt709',
  '-color_trc','bt709',
  '-movflags','+faststart',
  mp4
], { stdio:['ignore','ignore','pipe'] });

const technical = gateRendered(mp4);

const exportsDir = join(reviewDir, 'exports');
mkdirSync(exportsDir, { recursive:true });
for (const [index, name] of [
  [2,'first-body.png'],
  [4,'tumhari-card.png'],
  [5,'long-body.png'],
  [7,'source-card.png'],
  [8,'cta-card.png']
]) copyFileSync(framePaths[index], join(exportsDir, name));

writeFileSync(
  join(reviewDir, 'manifest.json'),
  JSON.stringify({
    template:`${S.id}-browser-native-locale-v1`,
    storyId:id,
    storyVersion:story.version,
    locale,
    hero:heroUrl,
    source,
    browser,
    output:mp4.replace(ROOT + '/', ''),
    durationSeconds:+technical.duration.toFixed(1),
    cards:cards.map(card => ({
      role:card.role,
      text:card.text,
      fontSize:card.size ?? null,
      diagnostics:card.diagnostics ?? null
    })),
    gates:passes
  }, null, 2) + '\n'
);

const figures = framePaths.map((path, i) =>
  `<figure><img src="${path.split('/').at(-1)}"><figcaption>${i + 1}. ${esc(cards[i].role)}</figcaption></figure>`
).join('\n');
const checks = passes.map(value => `<li>✓ ${esc(value)}</li>`).join('');

writeFileSync(
  join(reviewDir, 'index.html'),
  `<!doctype html><html lang="hi"><head><meta charset="utf-8">
<title>${esc(localeDoc.title)} · Reel review</title>
<style>
body{margin:0;background:#100c17;color:#f3e7d3;font:16px system-ui;padding:32px}
h1{font:36px serif}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
img{width:100%;border-radius:10px}figure{margin:0}figcaption{color:#8e849f;padding:6px 0}
video{width:min(360px,90vw);display:block;border-radius:14px}
</style></head><body>
<h1>${esc(localeDoc.title)}</h1>
<p>Chromium-native locale typography · ${technical.duration.toFixed(1)}s</p>
<video controls muted src="../../../${language}/${id}-reel.mp4"></video>
<ul>${checks}</ul><div class="grid">${figures}</div></body></html>`
);

console.log(`\nlocale reel render: PASS — ${locale} · browser-native layout`);
console.log(`video:  social/${language}/${id}-reel.mp4`);
console.log(`review: social/review/${language}/${id}/index.html`);

if (openReview && process.platform === 'darwin')
  execFileSync('open', [join(reviewDir, 'index.html')]);
