import {
  existsSync, mkdirSync, rmSync, statSync, writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import {
  browserProbeScript, findBrowser, fontDataUrl, inspectHtml, screenshotHtml
} from './browser-card-render.mjs';

const SIZE = 1080;
const NIGHT = '#14101c';
const DUSK = '#312752';
const PAPER = '#f3e7d3';
const PAPER_DIM = '#c9baa4';
const GOLD = '#f0b458';
const GOLD_DIM = '#a97c3a';
const FOOTER = '#948aa6';

const esc = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function slidePlan(edition) {
  return [
    { role:'hook', text:edition.hook, color:PAPER },
    ...edition.bodies.map((body, i) => ({
      role:'body',
      text:body.text,
      color:i === edition.bodies.length - 1 ? '#ffe9c4' : PAPER
    })),
    { role:'question', text:edition.closeQuestion, color:'#ffe9c4' },
    {
      role:'source',
      text:edition.sourceNote || `${edition.sourceWork} · ${edition.sourceLocus}`,
      color:PAPER_DIM,
      sourceWork:edition.sourceWork,
      sourceLocus:edition.sourceLocus,
      kicker:edition.policy.ui.sourceKicker
    },
    {
      role:'cta',
      text:edition.policy.ui.cta,
      color:PAPER,
      kicker:edition.policy.ui.ctaKicker,
      url:'sandhyakatha.com'
    }
  ];
}

function validatePlan(edition, slides) {
  const errors = [];
  const expected = 1 + edition.bodies.length + 3;
  if (slides.length !== expected)
    errors.push(`carousel slide count ${slides.length} != ${expected}`);
  if (slides.length > 10)
    errors.push(`carousel has ${slides.length} slides; platform-safe max is 10`);
  if (slides[0]?.role !== 'hook') errors.push('carousel must start with hook');
  if (slides.at(-3)?.role !== 'question') errors.push('question must precede source + CTA');
  if (slides.at(-2)?.role !== 'source') errors.push('source must be penultimate');
  if (slides.at(-1)?.role !== 'cta') errors.push('CTA must be last');
  for (const [i, slide] of slides.entries()) {
    if (!String(slide.text ?? '').trim())
      errors.push(`slide ${i + 1} ${slide.role} has empty text`);
    if (/[«»_]/.test(String(slide.text ?? '')))
      errors.push(`slide ${i + 1} leaked story markup`);
  }
  if (errors.length)
    throw new Error(`carousel plan failed: ${errors.join('; ')}`);
}

function latinWrap(text, maxPx, sizePx, em = 0.50) {
  const per = sizePx * em;
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length * per > maxPx && line) {
      out.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) out.push(line);
  return out;
}

function latinFit(text, {
  maxPx = 900, start = 50, min = 32, maxLines = 7, em = 0.48
} = {}) {
  for (let size = start; size >= min; size -= 2) {
    const lines = latinWrap(text, maxPx, size, em);
    if (lines.length <= maxLines) return { size, lines };
  }
  const lines = latinWrap(text, maxPx, min, em);
  if (lines.length > maxLines)
    throw new Error(`English carousel text cannot fit without truncation: ${text}`);
  return { size:min, lines };
}

function defs() {
  return `<defs>
  <radialGradient id="glow" cx="50%" cy="0%" r="78%">
    <stop offset="0%" stop-color="${DUSK}"/><stop offset="100%" stop-color="${NIGHT}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="flame" cx="50%" cy="62%" r="60%">
    <stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="${GOLD}"/><stop offset="100%" stop-color="#e0873f"/>
  </radialGradient>
</defs>`;
}

function svgChrome(index, total) {
  return `<rect width="${SIZE}" height="${SIZE}" fill="${NIGHT}"/>
<rect width="${SIZE}" height="${SIZE}" fill="url(#glow)"/>
<g transform="translate(74,66)">
  <path d="M7 0 C13 11 15 19 7 28 C-1 19 1 11 7 0 Z" fill="url(#flame)"/>
  <ellipse cx="7" cy="21" rx="2.4" ry="5" fill="#fff6dd" opacity="0.9"/>
  <path d="M-13 33 Q7 48 27 33 Q7 39 -13 33 Z" fill="${GOLD_DIM}"/>
</g>
<text x="114" y="82" font-family="Karla" font-size="21" font-weight="700"
      letter-spacing="1.7" fill="${PAPER_DIM}">SANDHYA KATHA</text>
${Array.from({ length:total }, (_, i) =>
  `<circle cx="${SIZE / 2 - (total - 1) * 9 + i * 18}" cy="1010" r="4" fill="${i === index ? GOLD : '#3b3350'}"/>`
).join('')}`;
}

function latinSvg(slide, index, total) {
  if (slide.role === 'source') {
    const note = latinFit(slide.text, { start:31, min:25, maxLines:7, em:0.49 });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
${defs()}${svgChrome(index,total)}
<text x="90" y="290" font-family="Karla" font-size="19" font-weight="700" letter-spacing="2.4" fill="${GOLD_DIM}">${esc(slide.kicker)}</text>
<text x="90" y="355" font-family="Karla" font-size="31" font-weight="700" fill="${GOLD}">${esc(slide.sourceWork)}</text>
<text x="90" y="402" font-family="Gentium Book Plus" font-size="27" font-style="italic" fill="${FOOTER}">${esc(slide.sourceLocus)}</text>
${note.lines.map((line,i)=>`<text x="90" y="${485+i*44}" font-family="Gentium Book Plus" font-size="${note.size}" fill="${PAPER_DIM}">${esc(line)}</text>`).join('\n')}
</svg>`;
  }

  const params = slide.role === 'hook'
    ? { start:58, min:42, maxLines:7, em:0.47 }
    : slide.role === 'cta'
      ? { start:54, min:40, maxLines:6, em:0.47 }
      : { start:46, min:34, maxLines:8, em:0.48 };
  const fit = latinFit(slide.text, params);
  const lh = fit.size * (slide.role === 'hook' ? 1.38 : 1.42);
  const top = SIZE / 2 - ((fit.lines.length - 1) * lh) / 2 + fit.size * 0.30;
  const italic = slide.role === 'question' ? ' font-style="italic"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
${defs()}${svgChrome(index,total)}
${slide.kicker ? `<text x="90" y="${top-95}" font-family="Karla" font-size="19" font-weight="700" letter-spacing="2.4" fill="${GOLD_DIM}">${esc(slide.kicker)}</text>` : ''}
${fit.lines.map((line,i)=>`<text x="90" y="${top+i*lh}" font-family="Gentium Book Plus" font-size="${fit.size}"${italic} fill="${slide.color}">${esc(line)}</text>`).join('\n')}
${slide.url ? `<text x="90" y="920" font-family="Karla" font-size="38" font-weight="700" fill="${GOLD}">${esc(slide.url)}</text>` : ''}
</svg>`;
}

function htmlBrand() {
  return `<div class="brand"><svg viewBox="0 0 52 62" aria-hidden="true">
<defs><radialGradient id="f" cx="50%" cy="62%" r="60%"><stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="${GOLD}"/><stop offset="100%" stop-color="#e0873f"/></radialGradient></defs>
<path d="M26 0 C34 14 36 24 26 36 C16 24 18 14 26 0 Z" fill="url(#f)"/><ellipse cx="26" cy="27" rx="3" ry="6.4" fill="#fff6dd" opacity=".9"/><path d="M0 42 Q26 61 52 42 Q26 50 0 42 Z" fill="${GOLD_DIM}"/></svg><span>SANDHYA KATHA</span></div>`;
}

function htmlDots(index,total) {
  return `<div class="dots">${Array.from({length:total},(_,i)=>`<i class="${i===index?'on':''}"></i>`).join('')}</div>`;
}

function complexHtml({ slide, index, total, size, fonts, policy }) {
  const isSource = slide.role === 'source';
  const family = isSource ? 'SKScript' : 'SKScript';
  const sample = policy.sample;
  const lineHeight = policy.lineHeight;
  const roleClass = `role-${slide.role}`;
  const sourceBlocks = isSource ? `<div class="source-meta"><div class="source-work">${esc(slide.sourceWork)}</div><div class="source-locus">${esc(slide.sourceLocus)}</div></div>` : '';
  return `<!doctype html><html lang="${policy.language}"><head><meta charset="utf-8"><style>
@font-face{font-family:SKScript;src:url("${fonts.script}") format("truetype")}
@font-face{font-family:SKGentium;src:url("${fonts.gentium}") format("truetype")}
@font-face{font-family:SKKarla;src:url("${fonts.karla}") format("truetype")}
*{box-sizing:border-box}html,body{margin:0;width:${SIZE}px;height:${SIZE}px;overflow:hidden;background:${NIGHT}}
.card{position:relative;width:${SIZE}px;height:${SIZE}px;overflow:hidden;background:${NIGHT}}
.glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,${DUSK},transparent 78%)}
.brand{position:absolute;left:74px;top:54px;display:flex;align-items:center;gap:16px;color:${PAPER_DIM};font:700 21px SKKarla;letter-spacing:1.7px}.brand svg{width:28px;height:38px}
.dots{position:absolute;left:0;right:0;bottom:62px;display:flex;justify-content:center;gap:10px}.dots i{width:8px;height:8px;border-radius:50%;background:#3b3350}.dots i.on{background:${GOLD}}
.copy{position:absolute;left:90px;width:900px;top:50%;transform:translateY(-50%)}
.kicker{margin:0 0 34px;font:700 22px SKScript;color:${GOLD_DIM}}
.text{margin:0;width:900px;font-family:${family};font-size:${size}px;line-height:${lineHeight};font-weight:400;color:${slide.color};white-space:normal;word-break:normal;overflow-wrap:normal;hyphens:none;letter-spacing:normal;word-spacing:normal;font-kerning:normal;font-feature-settings:"kern" 1,"liga" 1;text-rendering:optimizeLegibility;text-wrap:balance}
.role-question .text{font-style:normal}.role-source .copy{top:48%}.role-source .text{color:${PAPER_DIM}}
.source-meta{margin-bottom:34px}.source-work{font:700 31px SKGentium;color:${GOLD};margin-bottom:10px}.source-locus{font:italic 27px SKGentium;color:${FOOTER}}
.url{margin-top:46px;font:700 34px SKKarla;color:${GOLD}}
</style></head><body><div class="card ${roleClass}"><div class="glow"></div>${htmlBrand()}<div class="copy">${slide.kicker?`<p class="kicker">${esc(slide.kicker)}</p>`:''}${sourceBlocks}<p class="text" data-sk-text>${esc(slide.text)}</p>${slide.url?`<div class="url">${esc(slide.url)}</div>`:''}</div>${htmlDots(index,total)}</div>${browserProbeScript({family,sample})}</body></html>`;
}

function fitComplex({ slide, index, total, fonts, policy, browser }) {
  const starts = { hook:58, body:46, question:44, source:30, cta:52 };
  const mins = { hook:42, body:34, question:32, source:22, cta:38 };
  const maxLines = { hook:7, body:8, question:8, source:8, cta:6 };
  let last;
  for (let size = starts[slide.role]; size >= mins[slide.role]; size -= 2) {
    const html = complexHtml({ slide,index,total,size,fonts,policy });
    const d = inspectHtml({ html,width:SIZE,height:SIZE,browser });
    last = d;
    const acceptable = d.fontLoaded && !d.overflowX && !d.overflowY &&
      d.lineCount <= maxLines[slide.role] &&
      (d.lineCount <= 1 || d.minLineRatio >= 0.18) &&
      d.sourceLength === slide.text.length;
    if (acceptable) return { html,size,diagnostics:d };
  }
  throw new Error(`${policy.locale} carousel ${slide.role} cannot fit: ${JSON.stringify(last)}`);
}

function gatePng(path) {
  if (!existsSync(path) || statSync(path).size < 12_000)
    throw new Error(`carousel PNG missing or suspiciously small: ${path}`);
  const probe = JSON.parse(execFileSync('ffprobe', [
    '-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path
  ], { encoding:'utf8' }));
  const stream = probe.streams?.[0];
  if (+stream?.width !== SIZE || +stream?.height !== SIZE)
    throw new Error(`carousel PNG is ${stream?.width}x${stream?.height}; expected ${SIZE}x${SIZE}`);
}

export async function runCarousel({ root, edition, checkOnly = false }) {
  const slides = slidePlan(edition);
  validatePlan(edition, slides);
  const outDir = join(root,'social','carousel',edition.locale,edition.id);
  const diagnostics = [];

  if (edition.policy.complexScript) {
    const fontDir = join(root,'assets','fonts');
    const fonts = {
      script:fontDataUrl(join(fontDir, edition.policy.fontFile)),
      gentium:fontDataUrl(join(fontDir,'GentiumBookPlus-Regular.ttf')),
      karla:fontDataUrl(join(fontDir,'Karla-var.ttf'))
    };
    const browser = findBrowser();
    const fitted = slides.map((slide,index) => fitComplex({
      slide,index,total:slides.length,fonts,policy:edition.policy,browser
    }));
    diagnostics.push(...fitted.map((f,i)=>({
      role:slides[i].role,fontSize:f.size,...f.diagnostics
    })));
    if (!checkOnly) {
      rmSync(outDir,{recursive:true,force:true});
      mkdirSync(outDir,{recursive:true});
      for (let i=0;i<slides.length;i++) {
        const path=join(outDir,`${String(i+1).padStart(2,'0')}.png`);
        screenshotHtml({html:fitted[i].html,outPath:path,width:SIZE,height:SIZE,browser});
        gatePng(path);
      }
    }
  } else {
    const fontDirs=[join(root,'assets','fonts')];
    if (!checkOnly) {
      rmSync(outDir,{recursive:true,force:true});
      mkdirSync(outDir,{recursive:true});
    }
    for (let i=0;i<slides.length;i++) {
      const svg=latinSvg(slides[i],i,slides.length);
      diagnostics.push({role:slides[i].role,engine:'resvg-latin-v1'});
      if (!checkOnly) {
        const rendered=new Resvg(svg,{fitTo:{mode:'width',value:SIZE},font:{fontDirs,loadSystemFonts:false,defaultFontFamily:'Gentium Book Plus'}}).render().asPng();
        const path=join(outDir,`${String(i+1).padStart(2,'0')}.png`);
        writeFileSync(path,rendered);
        gatePng(path);
      }
    }
  }

  console.log(
    `carousel ${checkOnly?'preflight':'render'}: PASS — ${edition.locale} · ` +
    `${slides.length} slides · ${edition.policy.complexScript?'browser-native complex script':'stable Latin SVG'}`
  );
  return { outDir, slides, diagnostics };
}
