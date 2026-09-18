#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitBlobSha1, localeContentHash } from './lib/locale-content.mjs';
import { localeLanguage, publicLocaleHref } from './lib/locale-paths.mjs';
import { approvedHeroUrl } from './lib/media.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SITE = process.env.SITE_URL ?? 'https://sandhyakatha.com';
const read = p => JSON.parse(readFileSync(join(ROOT,p),'utf8'));
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cfg = read('content/locale-public.json');
const lock = read('content/locale.lock.json');
const media = read('content/media.json').stories ?? {};

const LANG = {
  'hi-IN': {
    language:'hi', label:'हिन्दी', name:'Hindi', ogLocale:'hi_IN',
    reviewedHeading:'समीक्षित हिन्दी संस्करण',
    reviewedBody:'इसे माता-पिता के पढ़कर सुनाने, हिन्दी भाषा-संपादन और मूल स्रोत से मिलान—तीनों के बाद मंज़ूर किया गया है। भाषा बदलने से कहानी की पहचान नहीं बदलती।',
    traditionLabel:'परंपरा के बारे में.', beforeLabel:'शुरू करने से पहले.',
    questionLabel:'अब बच्चे की ओर मुड़िए',
    seedPrefix:'और अगर वह कंधे उचका दे, तो इतना कहकर छोड़ सकते हैं:',
    askPrefix:'अगर बच्चा पूछे:',
    shareNote:'यह वही स्रोत-जाँची कहानी है, अब समीक्षित हिन्दी में।',
    shareButton:'यह कहानी किसी परिवार को भेजें',
    pause:'ठहराव', parent:'माता-पिता के लिए',
    minutes:'मिनट', age:'उम्र',
    shelfHeading:'पाँच कहानियाँ, पढ़कर सुनाने के लिए',
    shelfIntro:'राम, कृष्ण, गणेश, देवी और हनुमान की पाँच कहानियाँ। हर हिन्दी संस्करण उसी जाँची हुई मूल कहानी से जुड़ा है, अलग से पढ़कर सुनाया गया है, भाषा-संपादन से गुज़रा है और स्रोत से दोबारा मिलाया गया है।',
    back:'← पूरी अंग्रेज़ी शेल्फ़ देखें',
    moved:'इस हिन्दी संस्करण की समीक्षा पूरी हो चुकी है। यह पुराना समीक्षा लिंक है; कहानी अब अपने स्थायी सार्वजनिक पते पर उपलब्ध है।',
    movedCta:'समीक्षित हिन्दी कहानी पढ़ें',
    tonightCta:'आज रात की हिन्दी कहानी पढ़ें',
    tonightNote:'हर रात इन्हीं समीक्षित हिन्दी कहानियों में से उम्र और दिन के अनुसार एक कहानी चुनी जाती है।'
  },
  'ta-IN': {
    language:'ta', label:'தமிழ்', name:'Tamil', ogLocale:'ta_IN',
    reviewedHeading:'மதிப்பாய்வு செய்யப்பட்ட தமிழ் பதிப்பு',
    reviewedBody:'இந்தப் பதிப்பு பெற்றோர் குழந்தைகளுக்குப் படித்துச் சொல்லும் சோதனை, தமிழ் மொழிச் செம்மை, மூல ஆதார ஒப்பீடு ஆகிய மூன்றையும் முடித்துள்ளது. மொழி மாறினாலும் கதையின் அடையாளம் அதே.',
    traditionLabel:'மரபுக் குறிப்பு.', beforeLabel:'தொடங்குவதற்கு முன்.',
    questionLabel:'இப்போது குழந்தையிடம் கேளுங்கள்',
    seedPrefix:'அவர்கள் பதில் சொல்லாமல் இருந்தால், இதை மட்டும் சொல்லிவிடலாம்:',
    askPrefix:'குழந்தை கேட்டால்:',
    shareNote:'இதே ஆதாரச் சரிபார்க்கப்பட்ட கதை, இப்போது மதிப்பாய்வு செய்யப்பட்ட தமிழில்.',
    shareButton:'இந்தக் கதையை ஒரு குடும்பத்துடன் பகிருங்கள்',
    pause:'இடைவேளை', parent:'பெற்றோருக்கு',
    minutes:'நிமிடம்', age:'வயது',
    shelfHeading:'குழந்தைகளுக்குப் படித்துச் சொல்ல ஐந்து கதைகள்',
    shelfIntro:'ராமர், கிருஷ்ணர், விநாயகர், தேவி, அனுமன் பற்றிய ஐந்து கதைகள். ஒவ்வொரு தமிழ் பதிப்பும் அதே ஆதாரச் சரிபார்க்கப்பட்ட மூலக் கதையுடன் இணைக்கப்பட்டு, தனியாக வாசித்துச் சோதிக்கப்பட்டு, மொழிச் செம்மையும் மூல ஆதார ஒப்பீடும் முடித்த பிறகே வெளியிடப்படுகிறது.',
    back:'← முழு ஆங்கிலத் தொகுப்பைப் பார்க்க',
    moved:'இந்த தமிழ் பதிப்பின் மதிப்பாய்வு முடிந்துவிட்டது. இது பழைய மதிப்பாய்வு இணைப்பு; கதை இப்போது தனது நிரந்தர பொது முகவரியில் கிடைக்கிறது.',
    movedCta:'மதிப்பாய்வு செய்யப்பட்ட தமிழ் கதையை வாசிக்க',
    tonightCta:'இன்றிரவு தமிழ் கதையை வாசிக்க',
    tonightNote:'ஒவ்வொரு இரவும் மதிப்பாய்வு செய்யப்பட்ட தமிழ் கதைகளில் இருந்து வயதுக்கும் நாளுக்கும் ஏற்ற ஒரு கதை தேர்ந்தெடுக்கப்படும்.'
  }
};

if (cfg.schemaVersion !== '1.0')
  throw new Error('content/locale-public.json: schemaVersion must remain 1.0');

const landings = cfg.landings ?? (cfg.landing ? [cfg.landing] : []);
if (!landings.length) throw new Error('content/locale-public.json: at least one locale landing is required');
for (const landing of landings) {
  if (!LANG[landing.locale]) throw new Error(`no public locale presentation policy for ${landing.locale}`);
  if (landing.path !== `/${localeLanguage(landing.locale)}/`)
    throw new Error(`${landing.locale}: landing path must be /${localeLanguage(landing.locale)}/`);
}

const publicByStory = new Map();
for (const row of cfg.editions ?? []) {
  const arr = publicByStory.get(row.storyId) ?? [];
  arr.push(row);
  publicByStory.set(row.storyId, arr);
}

function localePath(locale, storyId) {
  return `content/locales/${localeLanguage(locale)}/${storyId}.json`;
}
function render(text, doc) {
  return String(text ?? '').split(/(«[^»]+»|_[^_]+_)/g).filter(Boolean).map(part => {
    if (part.startsWith('«')) {
      const key=part.slice(1,-1);
      return `<span class="name" data-canonical="${esc(key)}">${esc(doc.displayNames[key] ?? key)}</span>`;
    }
    if (part.startsWith('_')) return `<em>${render(part.slice(1,-1),doc)}</em>`;
    return esc(part);
  }).join('');
}
function blocks(doc, policy) {
  return doc.lengths.short.blocks.map(b => b.t === 'beat'
    ? `<div class="beat" aria-label="${esc(policy.pause)}"><span class="sr-only">${esc(policy.pause)}</span><i aria-hidden="true">• • •</i></div>`
    : b.t === 'aside'
      ? `<aside class="note"><span class="label">${esc(policy.parent)}</span><p>${render(b.text,doc)}</p></aside>`
      : `<p${b.t === 'slow' ? ' class="slow"' : ''}>${render(b.text,doc)}</p>`).join('\n');
}
function asks(doc, policy) {
  return (doc.close.ifTheyAsk ?? []).map(f =>
    `<details class="ask"><summary>${esc(policy.askPrefix)} “${render(f.q,doc)}”</summary><p>${render(f.a,doc)}</p></details>`
  ).join('');
}
function reviewApproved(doc, key) {
  const locked=lock.locales?.[key];
  if (doc.status !== 'approved') throw new Error(`${key}: public locale must be approved`);
  if (!locked) throw new Error(`${key}: public locale must be locked`);
  if (locked.hash !== localeContentHash(doc)) throw new Error(`${key}: locale lock hash is stale`);
  const gates=[doc.review?.nativeReadAloud?.short,doc.review?.languageEditor,doc.review?.sourceFidelity];
  if (gates.some(g=>g?.status!=='approved'||!g.reviewer||!g.reviewedOn))
    throw new Error(`${key}: human review gates are incomplete`);
  if (!Number.isInteger(doc.lengths?.short?.measuredSeconds))
    throw new Error(`${key}: measured read-aloud time is missing`);
}
function alternates(storyId) {
  const rows=publicByStory.get(storyId) ?? [];
  const links=[`<link rel="alternate" hreflang="en" href="${SITE}/s/${storyId}/">`];
  for (const row of rows) {
    const lang=localeLanguage(row.locale);
    links.push(`<link rel="alternate" hreflang="${lang}" href="${SITE}${publicLocaleHref(storyId,row.locale)}">`);
  }
  links.push(`<link rel="alternate" hreflang="x-default" href="${SITE}/s/${storyId}/">`);
  return links.join('');
}
function switcher(storyId,current) {
  const rows=publicByStory.get(storyId) ?? [];
  const items=[`<a href="/s/${esc(storyId)}/"${current==='en'?' aria-current="page"':''}>English</a>`];
  for (const row of rows) {
    const p=LANG[row.locale];
    items.push(`<a href="${esc(publicLocaleHref(storyId,row.locale))}"${current===row.locale?' aria-current="page"':''}>${esc(p.label)}</a>`);
  }
  return `<nav class="locale-public-switch" aria-label="Story language"><span class="langlabel">Language</span>${items.join('')}</nav>`;
}
function heroFor(source) {
  return approvedHeroUrl({root:ROOT,story:source,media});
}
function publicPage(doc,source) {
  const policy=LANG[doc.locale];
  const href=publicLocaleHref(source.id,doc.locale);
  const absolute=`${SITE}${href}`;
  const hero=heroFor(source);
  const duration=Math.round(doc.lengths.short.measuredSeconds/60);
  const sensitivity=(source.audience?.sensitivity ?? []).map(x=>x.replace(/-/g,' ')).join(', ');
  const og=existsSync(join(ROOT,`public/og/${source.id}.jpg`))
    ? `${SITE}/og/${source.id}.jpg?v=${source.version}`
    : `${SITE}/og/default.png`;
  const localeRevision=lock.locales?.[`${doc.locale}/${source.id}`]?.hash?.slice(0,10);
  if (!localeRevision) throw new Error(`${doc.locale}/${source.id}: locked locale revision missing`);
  const shareUrl=`${absolute}?l=${localeRevision}`;
  const sharePayload=JSON.stringify({
    text:`${doc.title} — Sandhya Katha ${policy.name} edition`,
    url:shareUrl
  }).replace(/'/g,'&#39;');
  return `<!doctype html><html lang="${policy.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(doc.title)} — ${esc(policy.label)} | Sandhya Katha</title><meta name="description" content="${esc(doc.tease)}"><link rel="canonical" href="${esc(absolute)}">${alternates(source.id)}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:type" content="article"><meta property="og:site_name" content="Sandhya Katha"><meta property="og:title" content="${esc(doc.title)} · ${esc(policy.label)}"><meta property="og:description" content="${esc(doc.tease)}"><meta property="og:url" content="${esc(absolute)}"><meta property="og:locale" content="${esc(policy.ogLocale)}"><meta property="og:image" content="${esc(og)}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(og)}"><meta name="theme-color" content="#14101c"><script async src="https://www.googletagmanager.com/gtag/js?id=G-8QPVB5L4QJ"></script><script src="/gtag-init.js"></script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Karla:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&family=Tiro+Devanagari+Sanskrit&display=swap"><link rel="stylesheet" href="/locale-preview.css"><link rel="stylesheet" href="/locale-edition-v2.css"><script src="/share.js" defer></script></head><body data-story-id="${esc(source.id)}" data-history-story-id="${esc(source.id)}" data-story-version="${source.version}" data-locale="${esc(doc.locale)}"><div class="w"><header class="sitehead"><a class="brand" href="/"><svg class="brandflame" viewBox="0 0 22 26" aria-hidden="true"><path d="M3 22h16" stroke="#a97c3a" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M5 22c0-2.6 2.7-3.4 6-3.4s6 .8 6 3.4" fill="#2b2338" stroke="#a97c3a" stroke-width="1.2"/><g><path d="M11 5c2.6 3.1 3.8 5 3.8 7.2A3.8 3.8 0 0 1 11 16a3.8 3.8 0 0 1-3.8-3.8C7.2 10 8.4 8.1 11 5z" fill="#f0b458"/><path d="M11 9.4c1.2 1.6 1.7 2.5 1.7 3.4A1.7 1.7 0 0 1 11 14.5a1.7 1.7 0 0 1-1.7-1.7c0-.9.5-1.8 1.7-3.4z" fill="#fff0d0"/></g></svg><span><b>Sandhya Katha</b><small>Source-linked family stories</small></span></a></header>${switcher(source.id,doc.locale)}<article class="locale" lang="${policy.language}"><h1>${esc(doc.title)}</h1><p class="tease">${render(doc.tease,doc)}</p><div class="public-edition-note" data-reviewed-locale-edition="1"><b>${esc(policy.reviewedHeading)}</b><p>${esc(policy.reviewedBody)}</p></div><div class="attrib"><p><b>${esc(source.source.work)}</b> — ${esc(source.source.locus)}</p><p><b>${esc(policy.traditionLabel)}</b> ${render(doc.traditionNote,doc)}</p><p><b>${esc(policy.beforeLabel)}</b> ${render(doc.parentNote,doc)}</p></div><div class="meta"><span>${duration} ${esc(policy.minutes)}</span><span>${esc(policy.age)} ${source.audience.minAge}+</span>${sensitivity?`<span>${esc(sensitivity)}</span>`:''}<span>canonical story v${source.version}</span></div>${hero?`<figure class="storyart"><img src="${esc(hero)}" alt="${esc(source.title)}"><figcaption>Reviewed illustration · canonical story v${source.version}</figcaption></figure>`:''}<div class="prose">${blocks(doc,policy)}</div><section class="turn" data-close-question-source="${esc(encodeURIComponent(doc.close.question))}"><span class="eyebrow">${esc(policy.questionLabel)}</span><p>${render(doc.close.question,doc)}</p><p class="seed">${esc(policy.seedPrefix)} <b>${render(doc.close.seed,doc)}</b></p></section>${asks(doc,policy)}<section class="sharewrap"><p>${esc(policy.shareNote)}</p><button type="button" class="sharebtn" data-share='${sharePayload}'>${esc(policy.shareButton)}</button></section><p class="footnote"><a href="/s/${esc(source.id)}/">English source edition</a> · <a href="/${policy.language}/">${esc(policy.label)}</a></p></article></div></body></html>`;
}
function movedPreview(doc,source) {
  const p=LANG[doc.locale];
  const href=publicLocaleHref(source.id,doc.locale);
  const absolute=`${SITE}${href}`;
  return `<!doctype html><html lang="${p.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><link rel="canonical" href="${esc(absolute)}"><title>${esc(doc.title)} · ${esc(p.label)}</title><link rel="stylesheet" href="/locale-edition-v2.css"><link rel="stylesheet" href="/locale-preview.css"></head><body style="background:#14101c"><main class="preview-moved"><p>Sandhya Katha</p><h1>${esc(doc.title)}</h1><p>${esc(p.moved)}</p><a href="${esc(href)}">${esc(p.movedCta)}</a></main></body></html>`;
}
function injectEnglish(source) {
  const path=join(DIST,'s',source.id,'index.html');
  if (!existsSync(path)) throw new Error(`${source.id}: English /s page missing before locale promotion`);
  let html=readFileSync(path,'utf8');
  if (!html.includes('</head>')) throw new Error(`${source.id}: English page has no </head>`);
  html=html.replace('</head>',`${alternates(source.id)}<link rel="stylesheet" href="/locale-edition-v2.css"></head>`);
  const headerEnd=html.indexOf('</header>');
  if (headerEnd<0) throw new Error(`${source.id}: English page has no header`);
  const at=headerEnd+'</header>'.length;
  html=html.slice(0,at)+switcher(source.id,'en')+html.slice(at);
  writeFileSync(path,html);
}
function addSitemapUrls(urls) {
  const path=join(DIST,'sitemap.xml');
  if (!existsSync(path)) throw new Error('dist/sitemap.xml missing before public locale promotion');
  let xml=readFileSync(path,'utf8');
  const missing=[...new Set(urls)].filter(url=>!xml.includes(`<loc>${url}</loc>`));
  if (!missing.length) return;
  if (!xml.includes('</urlset>')) throw new Error('sitemap has no </urlset>');
  xml=xml.replace('</urlset>',`${missing.map(url=>`  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>`);
  writeFileSync(path,xml);
}

const shelfRows=new Map(landings.map(x=>[x.locale,[]]));
const sitemapUrls=landings.map(x=>`${SITE}${x.path}`);
const sources=new Map();
let rendered=0;

for (const pub of cfg.editions ?? []) {
  const policy=LANG[pub.locale];
  if (!policy) throw new Error(`${pub.locale}: no public locale presentation policy`);
  const doc=read(localePath(pub.locale,pub.storyId));
  const sourceText=readFileSync(join(ROOT,'content/stories',`${pub.storyId}.json`),'utf8');
  const source=JSON.parse(sourceText);
  const key=`${pub.locale}/${pub.storyId}`;
  if (doc.storyId!==pub.storyId||doc.locale!==pub.locale) throw new Error(`${key}: public allowlist identity mismatch`);
  if (source.id!==pub.storyId||source.status!=='published'||source.audience?.gated) throw new Error(`${key}: canonical story is not publicly eligible`);
  if (doc.sourceVersion!==source.version) throw new Error(`${key}: source version mismatch`);
  if (doc.sourceBlobSha1!==gitBlobSha1(sourceText)) throw new Error(`${key}: canonical source bytes changed; re-review required`);
  reviewApproved(doc,key);
  const lang=localeLanguage(pub.locale);
  const dir=join(DIST,'s',source.id,lang);
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'index.html'),publicPage(doc,source));
  const previewDir=join(DIST,'preview',source.id,lang);
  mkdirSync(previewDir,{recursive:true});
  writeFileSync(join(previewDir,'index.html'),movedPreview(doc,source));
  const rows=shelfRows.get(pub.locale);
  if (!rows) throw new Error(`${pub.locale}: public landing missing`);
  rows.push(`<a class="locale-card" href="${esc(publicLocaleHref(source.id,pub.locale))}"><b>${esc(doc.title)}</b><span>${esc(source.source.work)} · ${esc(source.source.locus)} · ${esc(policy.age)} ${source.audience.minAge}+</span><p>${render(doc.tease,doc)}</p></a>`);
  sitemapUrls.push(`${SITE}${publicLocaleHref(source.id,pub.locale)}`);
  sources.set(source.id,source);
  rendered+=1;
}

for (const source of sources.values()) injectEnglish(source);

for (const landing of landings) {
  const p=LANG[landing.locale];
  const rows=shelfRows.get(landing.locale) ?? [];
  const dir=join(DIST,p.language);
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'index.html'),`<!doctype html><html lang="${p.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(p.label)} · Sandhya Katha</title><meta name="description" content="${esc(p.shelfIntro)}"><link rel="canonical" href="${SITE}${landing.path}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:type" content="website"><meta property="og:site_name" content="Sandhya Katha"><meta property="og:title" content="${esc(p.label)} · Sandhya Katha"><meta property="og:description" content="${esc(p.shelfIntro)}"><meta property="og:url" content="${SITE}${landing.path}"><meta name="theme-color" content="#14101c"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Karla:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&family=Tiro+Devanagari+Sanskrit&display=swap"><link rel="stylesheet" href="/locale-preview.css"><link rel="stylesheet" href="/locale-edition-v2.css"></head><body><div class="w"><header class="sitehead"><a class="brand" href="/"><span><b>Sandhya Katha</b><small>Source-linked family stories</small></span></a><a class="englishlink" href="/shelf/">The shelf</a></header><section class="locale-shelf-head"><span class="eyebrow">${esc(p.label)} · ${rows.length} reviewed</span><h1>${esc(p.shelfHeading)}</h1><p>${esc(p.shelfIntro)}</p></section><a class="locale-tonight" href="/?lang=${p.language}"><b>${esc(p.tonightCta)}</b><span>${esc(p.tonightNote)}</span></a>${rows.join('\n')}<a class="locale-back" href="/shelf/">${esc(p.back)}</a></div></body></html>`);
}

addSitemapUrls(sitemapUrls);
console.log(`public locale editions: rendered ${rendered} story page(s) across ${landings.length} locale shelf(s)`);
