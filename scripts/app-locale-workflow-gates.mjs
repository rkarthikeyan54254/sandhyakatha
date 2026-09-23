#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const source = rel => readFileSync(join(ROOT, rel), 'utf8');
const read = rel => JSON.parse(source(rel));
const errors = [];
const fail = m => errors.push(m);

for (const rel of [
  'src/lib/app-locale.ts',
  'scripts/build-runtime-locales.mjs',
  'scripts/runtime-locale-gates.mjs',
  'src/App.tsx',
  'src/ui/Chrome.tsx',
  'src/ui/Tonight.tsx',
  'src/ui/Reader.tsx',
  'src/ui/Shelf.tsx',
  'src/ui/Constellation.tsx',
  'src/ui/Why.tsx',
  'src/lib/picker.ts'
]) if (!existsSync(join(ROOT,rel))) fail(`locale-aware app component missing: ${rel}`);

const pkg = read('package.json');
if (!String(pkg.scripts?.content ?? '').includes('build-runtime-locales.mjs') ||
    !String(pkg.scripts?.content ?? '').includes('runtime-locale-gates.mjs'))
  fail('content build must generate and gate runtime locale editions');
if (pkg.scripts?.['verify:app-locale-workflow'] !== 'node scripts/app-locale-workflow-gates.mjs')
  fail('verify:app-locale-workflow script missing');
if (!String(pkg.scripts?.['validate:strict'] ?? '').includes('app-locale-workflow-gates.mjs'))
  fail('validate:strict must include app locale workflow gate');

const app = source('src/App.tsx');
for (const token of [
  'LanguageBar',
  'cardsForAppLocale',
  'locale-catalog.json',
  '/data/l/',
  'allowRepeatFallback',
  "locale: open?.locale ?? 'en'",
  'currentStory',
  'localeStoryMeta(localeCatalog, next, currentStory.id)',
  'locale={appLocale}',
  'availableIds',
  'pathForTab',
  'link[rel="canonical"]',
  'hreflang',
  "setAlternate('hi'",
  "setAlternate('ta'"
]) if (!app.includes(token)) fail(`App locale contract missing: ${token}`);
const chooseStart=app.indexOf('const chooseLocale');
const chooseEnd=app.indexOf('useEffect(() =>',chooseStart);
const chooseBlock=chooseStart>=0&&chooseEnd>chooseStart?app.slice(chooseStart,chooseEnd):'';
if (chooseBlock.includes("setTab('tonight')") || chooseBlock.includes("pushTabPath('tonight')"))
  fail('changing language must preserve the current section instead of returning to Tonight');

// Product parity: locale is a property of the whole app, not only Tonight/Reader.
const localeUi = source('src/lib/app-locale.ts');
for (const stale of ['सभी 5 हिन्दी कहानियाँ','5 தமிழ் கதைகளையும் பார்க்க','5 reviewed stories'])
  if (localeUi.includes(stale)) fail(`stale fixed-size locale shelf copy remains: ${stale}`);
for (const token of ['localizedSourceWork','localizedSourceLocus','localizedPanchanga','localizedCount'])
  if (!localeUi.includes(token)) fail(`native product metadata helper missing: ${token}`);

const shelf = source('src/ui/Shelf.tsx');
for (const token of [
  'locale?: AppLocale','localizedCorpusLabel','localizedTraditionLabel','localizedSourceWork','availableIds',
  'ageFilter','careFilter','forAge','sensitivities',"c.minAge > forAge","c.sensitivity.includes(care)"
]) if (!shelf.includes(token)) fail(`shared Shelf discovery parity missing: ${token}`);
if (shelf.includes('5 reviewed stories')) fail('Shelf must never hard-code locale corpus size');

const map = source('src/ui/Constellation.tsx');
for (const token of ["locale?:AppLocale","'hi-IN'","'ta-IN'","relationLabel","clusterLabel"])
  if (!map.includes(token)) fail(`Constellation native product copy missing: ${token}`);

const why = source('src/ui/Why.tsx');
for (const token of ["locale?: AppLocale","'hi-IN'","'ta-IN'","சாட்பாட்டிடமே","सिर्फ़ चैटबॉट"])
  if (!why.includes(token)) fail(`Why native product copy missing: ${token}`);

const reader = source('src/ui/Reader.tsx');
if (!reader.includes('localizedSourceWork') || !reader.includes('localizedSourceLocus'))
  fail('Reader must render native source metadata while retaining canonical evidence');
for (const token of ['localized ? <>','copy.pronunciation','copy.nameHelp','story.displayNames?.[say.term]'])
  if (!reader.includes(token)) fail(`Reader native help parity missing: ${token}`);
for (const token of ['pronunciation:', 'nameHelp:'])
  if (!localeUi.includes(token)) fail(`Reader locale copy missing: ${token}`);

const chrome = source('src/ui/Chrome.tsx');
for (const token of ["ui.tonightTab","ui.shelfTab","ui.mapTab","ui.whyTab","onTab(k)"])
  if (!chrome.includes(token))
    fail(`Hindi/Tamil navigation must preserve the same four-slot Tonight/Shelf/Map/Why structure: ${token}`);
if (chrome.includes('localeShelfPath'))
  fail('locale Shelf must stay in the shared app; external locale shelf navigation is forbidden');
for (const token of ['aria-label={homeLabel}','aria-label={ui.readIn}','aria-label={navLabel}'])
  if (!chrome.includes(token)) fail(`shared chrome native accessibility label missing: ${token}`);

const tonight = source('src/ui/Tonight.tsx');
if (!tonight.includes('pan: Panchanga') || !tonight.includes('localeReason(pick.reason, locale)'))
  fail('locale Tonight must preserve date/panchanga and Why-tonight structure');
for (const token of ['localizedPanchanga','localizedSourceWork','localizedSourceLocus','onShelf'])
  if (!tonight.includes(token)) fail(`locale Tonight parity missing: ${token}`);
if (tonight.includes('localeShelfPath(locale)'))
  fail('locale Tonight must not leave the app to reach Shelf');

const styles = source('src/styles.css');
if (!styles.includes('"brand main" "language main" "nav main"') ||
    !styles.includes('.languagebar{grid-area:language'))
  fail('desktop language selector must have a real sidebar grid area');
for (const token of [
  '--locale-reader-title-size','--locale-reader-title-leading','--locale-reader-body-size',
  '--locale-reader-body-leading','--locale-reader-measure','--locale-ui-tracking',
  '.app[data-locale="hi-IN"]','.app[data-locale="ta-IN"]'
]) if (!styles.includes(token)) fail(`script-aware typography token missing: ${token}`);
for (const token of ['overflow:hidden','min-width:0;max-width:100%','.sky text.cl{display:none}','@media(max-width:480px)'])
  if (!styles.includes(token)) fail(`mobile constellation fit contract missing: ${token}`);
if (!map.includes('className="constellation-svg"') || !map.includes('preserveAspectRatio="xMidYMid meet"'))
  fail('Constellation SVG must scale to the phone viewport');
if (styles.includes('.tabs.locale-tabs a'))
  fail('locale navigation must not retain a separate link-only Shelf chrome contract');

// CSS source order is part of the desktop locale contract. The generic
// languagebar rule is intentionally mobile-first and appears late in this
// stylesheet. A desktop repair therefore must appear after it; otherwise its
// sticky/flex declarations visually displace the selector over locale nav.
const genericLanguageBar = styles.lastIndexOf('.languagebar{display:flex');
const desktopLanguageRepair = styles.lastIndexOf('/* ---------- locale desktop language-bar parity ---------- */');
if (genericLanguageBar === -1 || desktopLanguageRepair === -1 ||
    desktopLanguageRepair <= genericLanguageBar) {
  fail('desktop language-bar repair must appear after generic/mobile languagebar styles');
} else {
  const repair = styles.slice(desktopLanguageRepair);
  for (const token of [
    '@media (min-width:900px)',
    'position:static',
    'top:auto',
    'z-index:auto',
    'display:grid',
    'grid-template-columns:repeat(3,minmax(0,1fr))',
    'width:100%',
    'background:none',
    'backdrop-filter:none',
    '.languagebar>span{',
    'display:block',
    'min-width:0'
  ]) if (!repair.includes(token))
    fail(`desktop language-bar repair missing: ${token}`);
}


const picker = source('src/lib/picker.ts');
if (!picker.includes('allowRepeatFallback'))
  fail('Tonight picker has no small-reviewed-shelf repeat fallback');
if (picker.includes('pickHindi') || picker.includes('pickTamil'))
  fail('language-specific picker fork is forbidden');

if (!reader.includes('story.publicPath') || !reader.includes('story.displayNames'))
  fail('Reader must preserve locale public route and localized display names');

for (const name of readdirSync(join(ROOT,'src/ui')))
  if (/^(Hindi|Tamil).*(Tonight|Reader)/i.test(name))
    fail(`parallel locale UI is forbidden: src/ui/${name}`);

const publicCfg = read('content/locale-public.json');
const locales = new Set((publicCfg.landings ?? []).map(x => x.locale));
for (const locale of ['hi-IN','ta-IN'])
  if (!locales.has(locale)) fail(`${locale}: public landing missing`);

const prerender = source('scripts/prerender-public-locales.mjs');
if (!prerender.includes('/?lang=${p.language}'))
  fail('public Hindi/Tamil shelves must offer a Tonight entry into the locale-aware app');
if (!prerender.includes("location.replace('/shelf/?lang=${p.language}')"))
  fail('legacy /hi/ and /ta/ shelves must hand interactive users to the shared app Shelf');
if (!prerender.includes('canonicalSourceLabel') || !prerender.includes('nativeSourceLine'))
  fail('public locale story pages must show native source chrome');
for (const token of ['canonicalStory','reviewedIllustration','englishSource','shareEdition','shelfAlternates'])
  if (!prerender.includes(token)) fail(`public locale reader/SEO parity missing: ${token}`);

const index = source('index.html');
if (!index.includes('document.documentElement.lang'))
  fail('app shell must set selected document language before first paint');
for (const lang of ['hi','ta'])
  if (!index.includes(`hreflang="${lang}"`))
    fail(`root HTML missing ${lang} hreflang discovery`);

if (errors.length) {
  for (const e of errors) console.error(`FAIL app locale workflow gate: ${e}`);
  process.exit(1);
}
console.log('app locale workflow gate: PASS — one Tonight picker · one Reader · reviewed public locale runtime only · Hindi/Tamil discovery from home');
