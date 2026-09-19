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
  "locale: open?.locale ?? 'en'"
]) if (!app.includes(token)) fail(`App locale contract missing: ${token}`);

const chrome = source('src/ui/Chrome.tsx');
if (!chrome.includes("ui.mapTab") || !chrome.includes("onTab('map')"))
  fail('Hindi/Tamil navigation must preserve the four-slot Tonight/Shelf/Map/Why structure');

const tonight = source('src/ui/Tonight.tsx');
if (!tonight.includes('pan: Panchanga') || !tonight.includes('localeReason(pick.reason, locale)'))
  fail('locale Tonight must preserve date/panchanga and Why-tonight structure');

const styles = source('src/styles.css');
if (!styles.includes('"brand main" "language main" "nav main"') ||
    !styles.includes('.languagebar{grid-area:language'))
  fail('desktop language selector must have a real sidebar grid area');

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

const reader = source('src/ui/Reader.tsx');
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

const index = source('index.html');
for (const lang of ['hi','ta'])
  if (!index.includes(`hreflang="${lang}"`))
    fail(`root HTML missing ${lang} hreflang discovery`);

if (errors.length) {
  for (const e of errors) console.error(`FAIL app locale workflow gate: ${e}`);
  process.exit(1);
}
console.log('app locale workflow gate: PASS — one Tonight picker · one Reader · reviewed public locale runtime only · Hindi/Tamil discovery from home');
