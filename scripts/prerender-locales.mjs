#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitBlobSha1 } from './lib/locale-content.mjs';
import { approvedHeroUrl } from './lib/media.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SITE = process.env.SITE_URL ?? 'https://sandhyakatha.com';
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const previews = read('content/locale-previews.json');
const media = read('content/media.json').stories ?? {};
const LANG = { ta: { label: 'தமிழ்', name: 'Tamil' }, hi: { label: 'हिन्दी', name: 'Hindi' } };

function localePath(locale, storyId) { const lang = locale.split('-')[0]; return `content/locales/${lang}/${storyId}.json`; }
function render(text, doc) {
  return String(text ?? '').split(/(«[^»]+»|_[^_]+_)/g).filter(Boolean).map(part => {
    if (part.startsWith('«')) { const key = part.slice(1,-1); return `<span class="name" data-canonical="${esc(key)}">${esc(doc.displayNames[key] ?? key)}</span>`; }
    if (part.startsWith('_')) return `<em>${render(part.slice(1,-1), doc)}</em>`;
    return esc(part);
  }).join('');
}
function gateState(gate) { return gate?.status ?? 'pending'; }
function reviewRows(doc) {
  const duration = Number.isInteger(doc.lengths?.short?.measuredSeconds)
    ? `approved · ${Math.round(doc.lengths.short.measuredSeconds / 60)} min measured`
    : gateState(doc.review?.nativeReadAloud?.short);
  return [
    ['Exact source story + version','approved'],
    ['Native read-aloud',duration],
    ['Language / editorial review',gateState(doc.review?.languageEditor)],
    ['Locale source-fidelity review',gateState(doc.review?.sourceFidelity)]
  ].map(([label,status]) => {
    const cls = String(status).startsWith('approved') ? 'approved' : esc(String(status));
    return `<div class="reviewrow"><span>${esc(label)}</span><b class="${cls}">${esc(String(status).replace('-', ' '))}</b></div>`;
  }).join('');
}
function blocks(doc) {
  return doc.lengths.short.blocks.map(b => b.t === 'beat'
    ? `<div class="beat" aria-label="Pause"><span class="sr-only">Pause</span><i aria-hidden="true">• • •</i></div>`
    : b.t === 'aside'
      ? `<aside class="note"><span class="label">For the parent</span><p>${render(b.text,doc)}</p></aside>`
      : `<p${b.t === 'slow' ? ' class="slow"' : ''}>${render(b.text,doc)}</p>`).join('\n');
}
function feedback(doc, source) {
  const intro = doc.status === 'approved'
    ? 'This edition has completed native read-aloud, language and source-fidelity review. If something still sounds wrong, tell us exactly where — corrections remain part of the editorial process.'
    : 'This is an early language edition. If a sentence sounds translated, a name feels wrong, the tradition is misstated, or the read-aloud rhythm does not work, tell us exactly where.';
  return `<section class="feedback"><h3>Help us keep this language right</h3><p>${esc(intro)}</p><form data-locale-report data-story-id="${esc(source.id)}" data-version="${source.version}" data-locale="${esc(doc.locale)}"><label class="hp"><span>Leave this empty</span><input name="hp" tabindex="-1" autocomplete="off"></label><label for="cat-${esc(doc.language)}">What kind of issue is it?</label><select id="cat-${esc(doc.language)}" name="category"><option value="unnatural-wording">Unnatural wording / sounds translated</option><option value="name-pronunciation">Name or pronunciation</option><option value="source-tradition">Source or tradition concern</option><option value="tone-delivery">Tone, rhythm or read-aloud delivery</option><option value="other">Something else</option></select><label for="note-${esc(doc.language)}">What should we look at?</label><textarea id="note-${esc(doc.language)}" rows="4" maxlength="2000" placeholder="Quote the line or describe what sounded wrong. Please leave your own personal details out."></textarea><button type="submit">Send to language review</button></form></section>`;
}
function edition(doc, source, hero) {
  const lang = LANG[doc.language] ?? { label: doc.language, name: doc.language };
  const asks = (doc.close.ifTheyAsk ?? []).map(f => `<details class="ask"><summary>If they ask: “${render(f.q,doc)}”</summary><p>${render(f.a,doc)}</p></details>`).join('');
  const approved = doc.status === 'approved';
  const shareText = approved
    ? `Reviewed ${lang.name} edition of a source-linked Sandhya Katha story. Native read-aloud, language and source-fidelity review complete.`
    : `Early ${lang.name} edition of a source-linked Sandhya Katha story. Native read-aloud review is still in progress.`;
  const statusNote = approved
    ? 'This language edition is locked to the exact reviewed source story. Native read-aloud, language/editorial and locale source-fidelity review are complete.'
    : 'The source story, story version and claim map are mechanically pinned. Native phrasing, spoken rhythm and locale-specific source fidelity still require human approval.';
  const shareNote = approved
    ? 'This is a reviewed language edition being shared through the preview lane before multilingual discovery is added to Tonight and The Shelf.'
    : 'This link is intentionally labelled as a preview. It does not place the edition on The Shelf or imply that native review is complete.';
  return `<article class="locale" lang="${esc(doc.language)}" data-locale-edition data-lang="${esc(doc.language)}" data-locale="${esc(doc.locale)}" data-status="${esc(doc.status)}" data-title="${esc(doc.title)}" data-share-text="${esc(shareText)}"><h1>${esc(doc.title)}</h1><p class="tease">${render(doc.tease,doc)}</p><div class="attrib"><p><b>${esc(source.source.work)}</b> — ${esc(source.source.locus)}</p><p><b>Tradition note.</b> ${render(doc.traditionNote,doc)}</p><p><b>Before you begin.</b> ${render(doc.parentNote,doc)}</p></div><div class="meta"><span>${esc(lang.name)} ${approved ? 'reviewed edition' : 'preview'}</span><span>Short edition</span><span>${Number.isInteger(doc.lengths.short.measuredSeconds) ? `${Math.round(doc.lengths.short.measuredSeconds/60)} min measured` : 'timing not yet certified'}</span></div><details class="editionstatus"><summary>Review status for this edition</summary><div class="reviewgrid">${reviewRows(doc)}</div><p style="margin-top:10px">${esc(statusNote)}</p></details>${hero ? `<figure class="storyart"><img src="${esc(hero)}" alt="Illustration for ${esc(source.title)}"><figcaption>Reviewed illustration · canonical story v${source.version}</figcaption></figure>` : ''}<div class="prose">${blocks(doc)}</div><section class="turn"><span class="eyebrow">Now turn to your child</span><p>${render(doc.close.question,doc)}</p><p class="seed">And if they shrug, you can leave it at this: <b>${render(doc.close.seed,doc)}</b></p></section>${asks}${feedback(doc,source)}<section class="sharewrap"><p>${esc(shareNote)}</p><button type="button" class="sharebtn" data-share-preview>Share this preview</button></section></article>`;
}

let rendered = 0;
for (const cfg of previews.previews ?? []) {
  const storyRel = `content/stories/${cfg.storyId}.json`;
  if (!existsSync(join(ROOT,storyRel))) throw new Error(`preview source missing: ${storyRel}`);
  const sourceText = readFileSync(join(ROOT,storyRel),'utf8'); const source = JSON.parse(sourceText);
  if (source.status !== 'published') throw new Error(`${source.id}: preview source must be published`);
  if (source.audience?.gated) throw new Error(`${source.id}: gated stories cannot have public locale previews`);
  const docs = (cfg.locales ?? []).map(locale => {
    const rel = localePath(locale,cfg.storyId); if (!existsSync(join(ROOT,rel))) throw new Error(`${cfg.storyId}: allowlisted locale file missing: ${rel}`);
    const doc = read(rel); if (doc.locale !== locale || doc.storyId !== cfg.storyId) throw new Error(`${rel}: identity mismatch`); if (doc.status === 'draft') throw new Error(`${rel}: draft locales cannot be public previews`); if (doc.sourceVersion !== source.version) throw new Error(`${rel}: source version mismatch`); if (doc.sourceBlobSha1 !== gitBlobSha1(sourceText)) throw new Error(`${rel}: source bytes changed; re-review required`); if (!doc.lengths?.short) throw new Error(`${rel}: public preview requires an independently written short rendition`); return doc;
  });
  if (!docs.some(d => d.locale === cfg.defaultLocale)) throw new Error(`${cfg.storyId}: defaultLocale ${cfg.defaultLocale} is not allowlisted`);
  const hero = approvedHeroUrl({root:ROOT,story:source,media});
  const canonical = `${SITE}/s/${source.id}/`;
  const switchLinks = [`<a class="canonical" href="/s/${esc(source.id)}/">English · source edition</a>`, ...docs.map(d => `<a href="/preview/${esc(source.id)}/${esc(d.language)}/">${esc((LANG[d.language] ?? {}).label ?? d.language)}</a>`)].join('');

  for (const doc of docs) {
    const meta = LANG[doc.language] ?? { label:doc.language, name:doc.language };
    const url = `${SITE}/preview/${source.id}/${doc.language}/`;
    const approved = doc.status === 'approved';
    const ogDesc = approved
      ? `Reviewed ${meta.name} edition of a source-linked Sandhya Katha story. Native read-aloud, language and source-fidelity review complete.`
      : `Early ${meta.name} edition of a source-linked Sandhya Katha story. Native read-aloud review is still in progress.`;
    const badge = approved ? 'Reviewed language edition' : 'Early language edition';
    const heading = approved
      ? 'Source-linked. Human review complete.'
      : 'Source-linked. Human language review still in progress.';
    const disclosure = approved
      ? 'This edition has completed native read-aloud, language/editorial and locale source-fidelity review and is locked to the exact reviewed source story. It is being shared here first before multilingual discovery is added to Tonight and The Shelf.'
      : 'This preview is intentionally public so families can help us hear what a machine check cannot. It is not on The Shelf and is not yet a reviewed Sandhya Katha language edition.';
    const html = `<!doctype html><html lang="${esc(doc.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(doc.title)} — ${esc(meta.name)} ${approved ? 'edition' : 'preview'} | Sandhya Katha</title><meta name="robots" content="noindex,nofollow,noarchive"><meta name="description" content="${esc(ogDesc)}"><link rel="canonical" href="${esc(canonical)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:type" content="article"><meta property="og:site_name" content="Sandhya Katha"><meta property="og:title" content="${esc(doc.title)} · ${esc(meta.name)} ${approved ? 'edition' : 'preview'}"><meta property="og:description" content="${esc(ogDesc)}"><meta property="og:url" content="${esc(url)}">${hero ? `<meta property="og:image" content="${esc(SITE + hero)}">` : ''}<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#14101c"><script async src="https://www.googletagmanager.com/gtag/js?id=G-8QPVB5L4QJ"></script><script src="/gtag-init.js"></script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Karla:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&family=Tiro+Devanagari+Sanskrit&display=swap"><link rel="stylesheet" href="/locale-preview.css"><script src="/locale-preview.js" defer></script></head><body data-story-id="${esc(source.id)}" data-story-version="${source.version}" data-story-corpus="${esc(source.source.corpus)}" data-default-lang="${esc(doc.language)}"><div class="w"><header class="sitehead"><a class="brand" href="/"><span class="brandmark">☾</span><span><b>Sandhya Katha</b><small>source-linked stories for families</small></span></a><a class="englishlink" href="/s/${esc(source.id)}/">English source edition</a></header><section class="previewnotice"><span class="badge">${esc(badge)}</span><h2>${esc(heading)}</h2><p>${esc(disclosure)}</p></section><nav class="locale-switch" aria-label="Story language">${switchLinks}</nav>${edition(doc,source,hero)}<p class="footnote">This language edition is adapted from the same source-checked story. <a href="/s/${esc(source.id)}/">Read the English source edition</a>.</p></div></body></html>`;
    const dir = join(DIST,'preview',source.id,doc.language); mkdirSync(dir,{recursive:true}); writeFileSync(join(dir,'index.html'),html); rendered += 1;
  }

  const defaultDoc = docs.find(d => d.locale === cfg.defaultLocale);
  const allowedLangs = docs.map(d => d.language);
  const rootDir = join(DIST,'preview',source.id); mkdirSync(rootDir,{recursive:true});
  writeFileSync(join(rootDir,'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Language preview · Sandhya Katha</title><script src="/locale-preview.js" defer></script></head><body data-locale-preview-root data-story-id="${esc(source.id)}" data-default-lang="${esc(defaultDoc.language)}" data-allowed-langs="${esc(allowedLangs.join(','))}"><p><a href="/preview/${source.id}/${defaultDoc.language}/">Continue to the language preview</a></p></body></html>`);
}
console.log(`locale previews: rendered ${rendered} allowlisted edition page(s)`);
