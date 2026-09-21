#!/usr/bin/env node
/**
 * Durable structural guard for the public story design system.
 *
 * Content is allowed to differ. The shell, shared CSS contract and story
 * component vocabulary are not. This intentionally checks structure rather
 * than byte-for-byte HTML so normal story and locale changes remain possible.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const readJson = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const readText = p => readFileSync(join(ROOT, p), 'utf8');
const fail = msg => { throw new Error(`design parity: ${msg}`); };
const requireText = (html, needle, label) => {
  if (!html.includes(needle)) fail(`${label}: missing ${needle}`);
};
const rejectText = (html, needle, label) => {
  if (html.includes(needle)) fail(`${label}: must not contain ${needle}`);
};

if (!existsSync(DIST)) fail('dist/ is missing; run the production build first');

const canon = readJson('content/canon.json').canon ?? [];
const media = readJson('content/media.json').stories ?? {};
const localePublic = readJson('content/locale-public.json');
const publicRows = canon.filter(row => row.status === 'published' && !row.gated);

const coreSheets = [
  '/design-tokens.css',
  '/story-media.css',
  '/story-system.css',
];
const commonStructure = [
  'class="sk-story-page"',
  'class="w"',
  'class="story-head"',
  'data-locale-switch',
  'class="story-title"',
  'class="attrib"',
  'class="meta"',
  'class="prose"',
  'class="turn"',
  'class="cta"',
  'class="story-footer"',
];

function verifyPage(path, label, locale) {
  if (!existsSync(path)) fail(`${label}: generated page is missing`);
  const html = readFileSync(path, 'utf8');
  for (const sheet of coreSheets) requireText(html, `href="${sheet}"`, label);
  for (const marker of commonStructure) requireText(html, marker, label);
  requireText(html, `data-locale="${locale}"`, label);
  rejectText(html, '<style>', label);
  return html;
}

for (const row of publicRows) {
  const label = `English /s/${row.id}/`;
  const html = verifyPage(join(DIST, 's', row.id, 'index.html'), label, 'en');
  requireText(html, 'class="wrong"', label);
  requireText(html, 'class="send"', label);
  if (media[row.id]?.image?.status === 'approved') {
    requireText(html, 'class="storyart"', label);
    requireText(html, 'class="storyart-frame"', label);
  }
}

const localeCounts = new Map();
for (const edition of localePublic.editions ?? []) {
  const lang = String(edition.locale).split('-')[0];
  const label = `${edition.locale} /s/${edition.storyId}/${lang}/`;
  const html = verifyPage(
    join(DIST, 's', edition.storyId, lang, 'index.html'),
    label,
    edition.locale
  );
  requireText(html, 'data-reviewed-locale-edition="1"', label);
  requireText(html, 'href="/locale-edition-v2.css"', label);
  rejectText(html, 'href="/locale-preview.css"', label);
  if (edition.locale === 'hi-IN') requireText(html, 'Noto+Serif+Devanagari', label);
  if (edition.locale === 'ta-IN') requireText(html, 'Noto+Serif+Tamil', label);
  if (media[edition.storyId]?.image?.status === 'approved') {
    requireText(html, 'class="storyart-frame"', label);
  }
  localeCounts.set(edition.locale, (localeCounts.get(edition.locale) ?? 0) + 1);
}

const tokens = readText('public/design-tokens.css');
const storyCss = readText('public/story-system.css');
const mediaCss = readText('public/story-media.css');
const appCss = readText('src/styles.css');
const appHtml = readText('index.html');

requireText(tokens, '--story-max:620px', 'design tokens');
requireText(tokens, '--display:"Tiro Devanagari Sanskrit"', 'design tokens');
requireText(tokens, '--read:"Gentium Book Plus"', 'design tokens');
requireText(tokens, '--ui:"Karla"', 'design tokens');
requireText(storyCss, 'Noto Serif Devanagari', 'public story system');
requireText(storyCss, 'Noto Serif Tamil', 'public story system');
requireText(mediaCss, 'aspect-ratio:4 / 3', 'story media contract');
requireText(mediaCss, 'object-fit:contain', 'story media contract');
requireText(mediaCss, 'height:100%', 'story media contract');
rejectText(appCss, ':root{', 'app stylesheet');
for (const sheet of ['/design-tokens.css', '/story-media.css']) {
  requireText(appHtml, `href="${sheet}"`, 'app shell');
}

// A shared system must never acquire story-specific selector exceptions.
for (const row of publicRows) {
  if (storyCss.includes(row.id) || mediaCss.includes(row.id)) {
    fail(`shared CSS contains story-specific id ${row.id}`);
  }
}

const requestedRepresentatives = [
  'shabari-berries',
  'sukra-spout',
  'squirrel-setu',
  'hanuman-tail',
  'birds-eye',
  'govardhana',
  'rama-returns',
];
for (const id of requestedRepresentatives) {
  if (!publicRows.some(row => row.id === id)) fail(`representative story ${id} is not public`);
}
for (const corpus of ['upanishad', 'mahabharata', 'ramayana']) {
  if (!publicRows.some(row => row.corpus === corpus)) fail(`no public ${corpus} story available for parity coverage`);
}
if (!publicRows.some(row => /purana/.test(row.corpus))) fail('no public Purāṇa story available for parity coverage');

const localeSummary = [...localeCounts.entries()].map(([k,v]) => `${k}=${v}`).join(', ');
console.log(
  `design parity: PASS — ${publicRows.length} English public story pages + ` +
  `${(localePublic.editions ?? []).length} reviewed locale pages share one story system` +
  (localeSummary ? ` (${localeSummary})` : '')
);
