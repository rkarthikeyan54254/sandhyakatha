#!/usr/bin/env node
/**
 * Static, shareable page per published story — the growth loop.
 *
 * A parent shares "the squirrel story" into a family WhatsApp group and the
 * link has to open into something real: the story, its source, the tradition
 * note. Not an app-store interstitial, and not a JavaScript shell that shows
 * a spinner in an in-app browser.
 *
 * Only the SHORT rendition goes public. The full telling, the length dial and
 * everything that accrues live in the app.
 *
 * Runs after `vite build`; Netlify serves an existing file before it applies
 * the SPA rewrite, so /s/<id>/ resolves here and every other path still boots
 * the app.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = process.env.SITE_URL ?? 'https://sandhyakatha.com';
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const lex = read('content/lexicon.json');
const STABILITY = {
  variant: 'The recensions differ here.',
  regional: 'Not in the Sanskrit — this one reaches us through a regional tradition.',
  folk: 'Oral tradition; there is no text to check it against.'
};

/** «Term» → plain name (collected for the pronunciation list); _x_ → <em>x</em>. */
function render(text, seen) {
  return esc(text)
    .replace(/«([^»]+)»/g, (_, t) => { if (lex[t]) seen.add(t); return `<b class="n">${t}</b>`; })
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

function page(s) {
  const seen = new Set();
  const r = s.lengths.short ?? s.lengths.full;
  const body = r.blocks.map(b => b.t === 'beat'
    ? '<div class="beat"><span>pause</span></div>'
    : `<p${b.t === 'slow' ? ' class="slow"' : ''}>${render(b.text, seen)}</p>`).join('\n');
  const says = [...seen].map(t => `<li><b>${t}</b><span>${esc(lex[t].say)}</span><i>${esc(lex[t].gloss)}</i></li>`).join('');
  const url = `${SITE}/s/${s.id}/`;
  const og = existsSync(join(ROOT, `public/og/${s.id}.png`)) ? `${SITE}/og/${s.id}.png` : `${SITE}/og/default.png`;
  const desc = `${s.tease} — ${s.source.work}, ${s.source.locus}. Ages ${s.audience.minAge}+.`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(s.title)} · Sandhya Katha</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:site_name" content="Sandhya Katha">
<meta property="og:title" content="${esc(s.title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14101c">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Tiro+Devanagari+Sanskrit&display=swap">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ShortStory', name: s.title, url,
  description: desc, inLanguage: 'en', isBasedOn: `${s.source.work}, ${s.source.locus}`,
  typicalAgeRange: `${s.audience.minAge}-15`, isAccessibleForFree: true,
  publisher: { '@type': 'Organization', name: 'Sandhya Katha', url: SITE }
})}</script>
<style>
:root{--night:#14101c;--lamp:#f0b458;--lamp-dim:#a97c3a;--ember-lit:#e0937f;--paper:#f3e7d3;--paper-dim:#c9baa4;--muted:#948aa6;--line:#302941}
*{box-sizing:border-box}
body{margin:0;background:var(--night);color:var(--paper);font-family:Karla,system-ui,sans-serif;
  background-image:radial-gradient(900px 500px at 50% -10%,#282040 0,rgba(40,32,64,0) 70%);background-attachment:fixed}
.w{max-width:620px;margin:0 auto;padding:0 22px 70px}
header{display:flex;align-items:center;gap:10px;padding:22px 0 18px;border-bottom:1px solid var(--line)}
header a{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}
header b{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:18px}
header i{font-family:"Tiro Devanagari Sanskrit",serif;font-style:normal;font-size:11px;color:var(--lamp-dim);display:block}
h1{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:clamp(30px,7vw,40px);line-height:1.15;margin:26px 0 0;text-wrap:balance}
.attrib{margin:16px 0 0;padding:12px 14px;border-left:2px solid var(--lamp-dim);background:rgba(240,180,88,.05)}
.attrib p{margin:0;font-size:13px;line-height:1.55;color:var(--paper-dim)}
.attrib p+p{margin-top:8px}.attrib .t b{color:var(--ember-lit)}.attrib .c b{color:var(--ember-lit)}
.meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
.meta span{font-size:11px;padding:4px 9px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}
main p{font-family:"Gentium Book Plus",Georgia,serif;font-size:19px;line-height:1.72;margin:0 0 20px}
main{margin-top:28px}
main em{color:#ffe3b0}
main .n{font-weight:400;color:var(--lamp)}
p.slow{border-left:2px solid var(--lamp);padding-left:15px;font-size:20px}
.beat{display:flex;align-items:center;gap:10px;margin:0 0 20px;color:var(--lamp-dim)}
.beat:before,.beat:after{content:"";flex:1;height:1px;background:var(--line)}
.beat span{font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;font-weight:700}
.turn{margin-top:8px;border:1px solid rgba(240,180,88,.34);border-radius:16px;padding:20px 18px;background:rgba(240,180,88,.06)}
.turn span.e{font-size:10.5px;letter-spacing:.17em;text-transform:uppercase;color:var(--lamp);font-weight:700}
.turn p{font-family:"Gentium Book Plus",Georgia,serif;font-size:20px;line-height:1.5;margin:12px 0 0;color:#ffe9c4}
.turn p.s{font-size:15px;font-style:italic;color:var(--paper-dim);margin-top:14px}
.says{margin:30px 0 0;padding:0;list-style:none;border-top:1px solid var(--line)}
.says li{padding:12px 0;border-bottom:1px solid var(--line);font-size:13px;line-height:1.5}
.says b{font-family:"Gentium Book Plus",serif;color:var(--paper);margin-right:9px}
.says span{color:var(--lamp);font-weight:700;letter-spacing:.03em}
.says i{display:block;color:var(--muted);margin-top:4px;font-style:normal}
.cta{margin-top:32px;padding:22px;border:1px solid var(--line);border-radius:14px;background:#1b1526;text-align:center}
.cta p{margin:0 0 14px;font-size:14px;line-height:1.6;color:var(--paper-dim)}
.cta a{display:inline-block;padding:13px 22px;border-radius:11px;background:var(--lamp);color:#2a1c08;
  font-weight:700;font-size:14px;text-decoration:none}
footer{margin-top:34px;font-size:11.5px;color:var(--muted);line-height:1.7}
</style></head>
<body><div class="w">
<header><a href="/"><span aria-hidden="true">🪔</span><span><b>Sandhya Katha</b><i>संध्या कथा</i></span></a></header>
<h1>${esc(s.title)}</h1>
<div class="attrib">
  <p><b>${esc(s.source.work)}</b> — ${esc(s.source.locus)}</p>
  ${s.source.traditionNote ? `<p class="t"><b>Tradition note.</b> ${esc(s.source.traditionNote)}</p>`
    : (STABILITY[s.source.stability] ? `<p class="t"><b>Note.</b> ${STABILITY[s.source.stability]}</p>` : '')}
  ${s.audience.careNote ? `<p class="c"><b>Before you begin.</b> ${esc(s.audience.careNote)}</p>` : ''}
</div>
<div class="meta"><span>Ages ${s.audience.minAge}+</span><span>${r.minutes} min aloud</span>${s.values.map(v => `<span>${esc(v)}</span>`).join('')}</div>
<main>${body}</main>
<div class="turn"><span class="e">Now turn to your child</span>
  <p>${render(s.close.question, new Set())}</p>
  <p class="s">And if they shrug, you can leave it at this: <b>${esc(s.close.seed)}</b></p>
</div>
${says ? `<ul class="says">${says}</ul>` : ''}
<div class="cta">
  <p>This is the three-minute telling. The longer one, tonight's pick, and ${'the rest of the collection'} are in the app — free, nothing to install.</p>
  <a href="/">Open Sandhya Katha</a>
</div>
<footer>Told from ${esc(s.source.work)}, ${esc(s.source.locus)}. Where traditions differ, we say so.<br>
Everything about your child stays on your device.</footer>
</div></body></html>`;
}

const dist = join(ROOT, 'dist');
if (!existsSync(dist)) { console.error('run vite build first'); process.exit(1); }

const urls = [`${SITE}/`];
let n = 0;
for (const f of readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json'))) {
  const s = read(`content/stories/${f}`);
  if (s.status !== 'published' || s.audience.gated) continue;   // gated stories are never public
  mkdirSync(join(dist, 's', s.id), { recursive: true });
  writeFileSync(join(dist, 's', s.id, 'index.html'), page(s));
  urls.push(`${SITE}/s/${s.id}/`);
  n++;
}

writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') +
  `\n</urlset>\n`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`prerendered ${n} shareable story page(s) + sitemap`);
