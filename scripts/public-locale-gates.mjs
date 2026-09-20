#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { localeContentHash } from './lib/locale-content.mjs';
import { localeLanguage, publicLocaleHref } from './lib/locale-paths.mjs';

const ROOT=new URL('..',import.meta.url).pathname;
const DIST=join(ROOT,'dist');
const read=p=>JSON.parse(readFileSync(join(ROOT,p),'utf8'));
const cfg=read('content/locale-public.json');
const lock=read('content/locale.lock.json');
const errors=[];
const fail=m=>errors.push(m);
let checked=0;

if (cfg.schemaVersion!=='1.0') fail('locale-public schemaVersion must remain 1.0');
const landings=cfg.landings ?? (cfg.landing?[cfg.landing]:[]);
if (!landings.length) fail('at least one public locale landing is required');

const landingByLocale=new Map();
for (const landing of landings) {
  if (landingByLocale.has(landing.locale)) fail(`${landing.locale}: duplicate landing`);
  landingByLocale.set(landing.locale,landing);
  const lang=localeLanguage(landing.locale);
  if (landing.path!==`/${lang}/`) fail(`${landing.locale}: landing path must be /${lang}/`);
}

const byStory=new Map();
for (const pub of cfg.editions ?? []) {
  const rows=byStory.get(pub.storyId) ?? [];
  rows.push(pub);
  byStory.set(pub.storyId,rows);
}

const seen=new Set();
for (const pub of cfg.editions ?? []) {
  const key=`${pub.locale}/${pub.storyId}`;
  if (seen.has(key)) { fail(`${key}: duplicate public edition`); continue; }
  seen.add(key);
  if (!landingByLocale.has(pub.locale)) fail(`${key}: no public discovery landing for locale`);
  const lang=localeLanguage(pub.locale);
  const doc=read(`content/locales/${lang}/${pub.storyId}.json`);
  const source=read(`content/stories/${pub.storyId}.json`);
  const locked=lock.locales?.[key];
  const href=publicLocaleHref(pub.storyId,pub.locale);
  const pagePath=join(DIST,'s',pub.storyId,lang,'index.html');
  const enPath=join(DIST,'s',pub.storyId,'index.html');
  const previewPath=join(DIST,'preview',pub.storyId,lang,'index.html');

  if (doc.status!=='approved') fail(`${key}: public edition is not approved`);
  if (!locked||locked.hash!==localeContentHash(doc)) fail(`${key}: public edition is not locked to current reviewed bytes`);
  if (source.status!=='published'||source.audience?.gated) fail(`${key}: source story is not publicly eligible`);
  if (doc.storyId!==source.id) fail(`${key}: locale introduced a second story identity`);
  if (!existsSync(pagePath)) { fail(`${key}: public page missing ${href}`); continue; }
  if (!existsSync(enPath)) fail(`${key}: English source page missing`);
  if (!existsSync(previewPath)) fail(`${key}: old preview handoff missing`);

  const html=readFileSync(pagePath,'utf8');
  const en=existsSync(enPath)?readFileSync(enPath,'utf8'):'';
  const preview=existsSync(previewPath)?readFileSync(previewPath,'utf8'):'';
  if (/[«»]/.test(html))
    fail(`${key}: canonical entity marker leaked into rendered page`);
  const absolute=`https://sandhyakatha.com${href}`;

  if (html.includes('noindex')) fail(`${key}: public page is noindex`);
  if (!html.includes('href="/locale-edition-v2.css"')) fail(`${key}: versioned locale stylesheet missing`);
  if (!html.includes(`<link rel="canonical" href="${absolute}">`)) fail(`${key}: self canonical missing`);
  if (!html.includes('hreflang="en"')) fail(`${key}: English hreflang missing`);

  for (const alt of byStory.get(pub.storyId) ?? []) {
    const altLang=localeLanguage(alt.locale);
    const altHref=publicLocaleHref(pub.storyId,alt.locale);
    if (!html.includes(`hreflang="${altLang}"`) || !html.includes(`href="https://sandhyakatha.com${altHref}"`))
      fail(`${key}: ${altLang} hreflang alternate missing`);
    if (!en.includes(`hreflang="${altLang}"`) || !en.includes(`href="https://sandhyakatha.com${altHref}"`))
      fail(`${key}: English page does not advertise ${altLang} alternate`);
  }

  if (!html.includes(`data-story-id="${source.id}"`)||!html.includes(`data-history-story-id="${source.id}"`))
    fail(`${key}: canonical/history story identity missing`);
  if (!html.includes(`data-locale="${pub.locale}"`)) fail(`${key}: locale identity missing`);
  if (!html.includes('data-reviewed-locale-edition="1"')) fail(`${key}: reviewed-edition disclosure marker missing`);
  if (!html.includes(doc.title)||!html.includes(source.source.work)||!html.includes(source.source.locus))
    fail(`${key}: title/source attribution missing`);
  const closeQuestionMarker=`data-close-question-source="${encodeURIComponent(doc.close.question)}"`;
  if (!html.includes(closeQuestionMarker))
    fail(`${key}: exact reviewed close-question marker missing`);
  if (!html.includes('data-share=')) fail(`${key}: public share action missing`);

  const expectedOg=`https://sandhyakatha.com/og/${pub.storyId}.jpg?v=${source.version}`;
  if (!html.includes(`property="og:image" content="${expectedOg}"`))
    fail(`${key}: locale page is not using same story-specific share card as English`);
  if (!html.includes('property="og:image:width" content="1200"')||!html.includes('property="og:image:height" content="630"'))
    fail(`${key}: share-card dimensions missing`);
  const expectedOgLocale=pub.locale.replace('-','_');
  if (!html.includes(`property="og:locale" content="${expectedOgLocale}"`))
    fail(`${key}: Open Graph locale ${expectedOgLocale} missing`);

  if (!preview.includes('noindex,nofollow,noarchive')) fail(`${key}: old preview handoff is indexable`);
  if (!preview.includes('href="/locale-edition-v2.css"')) fail(`${key}: preview handoff is not on versioned locale stylesheet`);
  if (!preview.includes(`href="${href}"`)) fail(`${key}: old preview does not point to public edition`);
  if (!preview.includes(`<link rel="canonical" href="${absolute}">`)) fail(`${key}: preview canonical does not point to public edition`);
  checked+=1;
}

for (const landing of landings) {
  const lang=localeLanguage(landing.locale);
  const path=join(DIST,lang,'index.html');
  if (!existsSync(path)) { fail(`${landing.path}: discovery shelf missing`); continue; }
  const html=readFileSync(path,'utf8');
  if (html.includes('noindex')) fail(`${landing.path}: discovery shelf is noindex`);
  if (!html.includes('href="/locale-edition-v2.css"')) fail(`${landing.path}: discovery shelf is not on versioned locale stylesheet`);
  if (!html.includes(`href="/?lang=${lang}"`)) fail(`${landing.path}: locale-aware Tonight entry missing`);
  for (const pub of (cfg.editions ?? []).filter(x=>x.locale===landing.locale))
    if (!html.includes(publicLocaleHref(pub.storyId,pub.locale))) fail(`${landing.path}: missing ${pub.storyId}`);
}

const sitemapPath=join(DIST,'sitemap.xml');
if (!existsSync(sitemapPath)) fail('sitemap missing');
else {
  const xml=readFileSync(sitemapPath,'utf8');
  for (const landing of landings)
    if (!xml.includes(`<loc>https://sandhyakatha.com${landing.path}</loc>`))
      fail(`sitemap missing ${landing.path}`);
  for (const pub of cfg.editions ?? []) {
    const url=`https://sandhyakatha.com${publicLocaleHref(pub.storyId,pub.locale)}`;
    if (!xml.includes(`<loc>${url}</loc>`)) fail(`sitemap missing ${url}`);
  }
  if (xml.includes('/preview/')) fail('preview URL leaked into sitemap');
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR public locale gate: ${e}`);
  console.error(`FAILED — ${errors.length} public locale error(s)`);
  process.exit(1);
}
console.log(`public locale gates: PASS — ${checked} approved /s locale edition(s) across ${landings.length} shelf(s); canonical story identity preserved`);
