#!/usr/bin/env node
/**
 * Harden generated story pages for WhatsApp / Meta link previews.
 *
 * Story pages are prerendered before this runs. We keep the editorial/page
 * generators focused on content and normalize the social-card contract here:
 * every public story has a real 1200x630 JPEG, every story/locale page points
 * at the content-addressed card URL, and crawlers get the full Open Graph image
 * descriptor set in the initial HTML response.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SITE = 'https://sandhyakatha.com';
const readJson = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const errors = [];
const fail = msg => errors.push(msg);

const canon = readJson('content/canon.json').canon ?? [];
const localePublic = readJson('content/locale-public.json');
const publicRows = canon.filter(row => row.status === 'published' && !row.gated);
const localeByStory = new Map();
for (const edition of localePublic.editions ?? []) {
  const rows = localeByStory.get(edition.storyId) ?? [];
  rows.push(edition);
  localeByStory.set(edition.storyId, rows);
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  for (let i = 2; i + 8 < buf.length;) {
    if (buf[i] !== 0xff) { i++; continue; }
    while (i < buf.length && buf[i] === 0xff) i++;
    if (i >= buf.length) break;
    const marker = buf[i++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (i + 1 >= buf.length) break;
    const length = buf.readUInt16BE(i);
    if (length < 2 || i + length > buf.length) break;
    if (sof.has(marker) && i + 7 < buf.length) {
      return { height: buf.readUInt16BE(i + 3), width: buf.readUInt16BE(i + 5) };
    }
    i += length;
  }
  return null;
}

function stripProperty(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`<meta\\s+property=["']${escaped}["'][^>]*>`, 'gi'), '');
}
function stripName(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`<meta\\s+name=["']${escaped}["'][^>]*>`, 'gi'), '');
}
function getProperty(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\s+property=["']${escaped}["']\\s+content=["']([^"']+)["'][^>]*>`, 'i'))?.[1] ?? '';
}

function hardenPage(path, expectedUrl, imageUrl, title) {
  if (!existsSync(path)) { fail(`${path}: generated story page is missing`); return; }
  let html = readFileSync(path, 'utf8');
  const currentUrl = getProperty(html, 'og:url');
  if (currentUrl !== expectedUrl) fail(`${path}: og:url mismatch (${currentUrl || 'missing'})`);

  html = stripProperty(html, 'og:image');
  html = stripProperty(html, 'og:image:secure_url');
  html = stripProperty(html, 'og:image:type');
  html = stripProperty(html, 'og:image:width');
  html = stripProperty(html, 'og:image:height');
  html = stripProperty(html, 'og:image:alt');
  html = stripName(html, 'twitter:image');
  html = stripName(html, 'twitter:image:alt');

  const social = [
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:secure_url" content="${imageUrl}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${title} — Sandhya Katha">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<meta name="twitter:image:alt" content="${title} — Sandhya Katha">`
  ].join('');

  // Replace the existing twitter:card marker so the complete image contract is
  // contiguous and easy for non-JS crawlers to consume and for gates to audit.
  html = stripName(html, 'twitter:card');
  const marker = '<meta name="theme-color" content="#14101c">';
  if (!html.includes(marker)) { fail(`${path}: social metadata insertion marker missing`); return; }
  html = html.replace(marker, `${social}${marker}`);
  writeFileSync(path, html);
}

let pages = 0;
for (const row of publicRows) {
  const card = join(ROOT, 'public', 'og', `${row.id}.jpg`);
  if (!existsSync(card)) { fail(`${row.id}: public story has no dedicated OG card`); continue; }
  const bytes = readFileSync(card);
  const size = jpegSize(bytes);
  if (!size) { fail(`${row.id}: OG card is not a readable JPEG`); continue; }
  if (size.width !== 1200 || size.height !== 630)
    fail(`${row.id}: OG card must be 1200x630, got ${size.width}x${size.height}`);
  if (bytes.length < 10_000) fail(`${row.id}: OG card is suspiciously small (${bytes.length} bytes)`);
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const imageUrl = `${SITE}/og/${row.id}.jpg?og=${digest}`;

  const english = join(DIST, 's', row.id, 'index.html');
  hardenPage(english, `${SITE}/s/${row.id}/`, imageUrl, row.title);
  pages++;

  for (const edition of localeByStory.get(row.id) ?? []) {
    const lang = String(edition.locale).split('-')[0];
    const localized = join(DIST, 's', row.id, lang, 'index.html');
    if (!existsSync(localized)) { fail(`${edition.locale}/${row.id}: public locale page missing`); continue; }
    const localizedHtml = readFileSync(localized, 'utf8');
    const localizedTitle = getProperty(localizedHtml, 'og:title') || row.title;
    // Use a reviewed native-title card when supplied; older editions retain
    // their existing story card. Validate native cards as strictly as English.
    const nativeCard = join(ROOT, 'public', 'og', `${row.id}-${lang}.jpg`);
    let localizedImageUrl = imageUrl;
    if (existsSync(nativeCard)) {
      const nativeBytes = readFileSync(nativeCard);
      const nativeSize = jpegSize(nativeBytes);
      if (!nativeSize || nativeSize.width !== 1200 || nativeSize.height !== 630 || nativeBytes.length < 10_000) {
        fail(`${edition.locale}/${row.id}: native OG card must be a readable 1200x630 JPEG`);
        continue;
      }
      const nativeDigest = createHash('sha256').update(nativeBytes).digest('hex').slice(0, 12);
      localizedImageUrl = `${SITE}/og/${row.id}-${lang}.jpg?og=${nativeDigest}`;
    }
    hardenPage(localized, `${SITE}/s/${row.id}/${lang}/`, localizedImageUrl, localizedTitle);
    pages++;
  }
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL social preview: ${error}`);
  console.error(`social previews: FAILED — ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`social previews: PASS — ${publicRows.length} dedicated 1200x630 card(s), ${pages} public story page(s) hardened`);
