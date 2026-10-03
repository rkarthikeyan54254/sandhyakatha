#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CANONICAL_ORIGIN = 'https://sandhyakatha.com';
const CHECK_ORIGIN = (process.env.CRAWL_CHECK_ORIGIN ?? CANONICAL_ORIGIN).replace(/\/$/, '');
const EXPECTED_COMMIT = process.env.EXPECTED_COMMIT ?? '';
const META_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const WHATSAPP_UA = 'WhatsApp/2.23.18.78 i';
const errors = [];
const fail = msg => errors.push(msg);
const readJson = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

const canon = readJson('content/canon.json').canon ?? [];
const localePublic = readJson('content/locale-public.json');
const publicRows = canon.filter(row => row.status === 'published' && !row.gated);
const publicById = new Map(publicRows.map(row => [row.id, row]));
const pages = publicRows.map(row => ({
  id: row.id,
  url: `${CANONICAL_ORIGIN}/s/${row.id}/`
}));
for (const edition of localePublic.editions ?? []) {
  if (!publicById.has(edition.storyId)) continue;
  const lang = String(edition.locale).split('-')[0];
  pages.push({ id: edition.storyId, url: `${CANONICAL_ORIGIN}/s/${edition.storyId}/${lang}/` });
}

function htmlUrl(canonical) {
  return canonical.replace(CANONICAL_ORIGIN, CHECK_ORIGIN);
}
function metaProperty(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, 'i'));
  return (a?.[1] ?? b?.[1] ?? '').trim();
}
function metaName(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, 'i'));
  return (a?.[1] ?? b?.[1] ?? '').trim();
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
    if (sof.has(marker) && i + 7 < buf.length)
      return { height: buf.readUInt16BE(i + 3), width: buf.readUInt16BE(i + 5) };
    i += length;
  }
  return null;
}

async function get(url, userAgent, binary = false) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': userAgent,
        'accept': binary ? 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
      }
    });
    const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    return { res, body };
  } catch (err) {
    fail(`${url}: request failed as ${userAgent}: ${err?.message ?? err}`);
    return null;
  }
}

async function mapLimit(items, limit, fn) {
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
}

if (EXPECTED_COMMIT) {
  const marker = await get(`${CHECK_ORIGIN}/build-info.json`, META_UA);
  let deployed = '';
  if (marker?.res.status === 200) {
    try { deployed = JSON.parse(marker.body).commit ?? ''; } catch {}
  }
  if (deployed !== EXPECTED_COMMIT) {
    console.error(`social preview: deployment not ready — expected ${EXPECTED_COMMIT}, found ${deployed || 'none'}`);
    process.exit(75);
  }
}

const images = new Map();
await mapLimit(pages, 6, async page => {
  const got = await get(htmlUrl(page.url), META_UA);
  if (!got) return;
  const { res, body: html } = got;
  if (res.status !== 200) { fail(`${page.url}: Meta preview crawler returned ${res.status}`); return; }
  const ct = (res.headers.get('content-type') ?? '').toLowerCase();
  if (!ct.includes('text/html')) fail(`${page.url}: expected text/html for Meta crawler, got ${ct || '(none)'}`);
  if (/noindex/i.test(res.headers.get('x-robots-tag') ?? '')) fail(`${page.url}: X-Robots-Tag blocks preview page`);

  const ogUrl = metaProperty(html, 'og:url');
  const ogTitle = metaProperty(html, 'og:title');
  const ogDescription = metaProperty(html, 'og:description');
  const ogImage = metaProperty(html, 'og:image');
  const secure = metaProperty(html, 'og:image:secure_url');
  const type = metaProperty(html, 'og:image:type');
  const width = metaProperty(html, 'og:image:width');
  const height = metaProperty(html, 'og:image:height');
  const alt = metaProperty(html, 'og:image:alt');

  if (metaProperty(html, 'og:type') !== 'article') fail(`${page.url}: og:type must be article`);
  if (!ogTitle) fail(`${page.url}: og:title missing`);
  if (!ogDescription) fail(`${page.url}: og:description missing`);
  if (ogUrl !== page.url) fail(`${page.url}: og:url mismatch (${ogUrl || 'missing'})`);
  if (!ogImage) fail(`${page.url}: og:image missing`);
  if (secure !== ogImage) fail(`${page.url}: og:image:secure_url must match og:image`);
  if (type !== 'image/jpeg') fail(`${page.url}: og:image:type must be image/jpeg`);
  if (width !== '1200' || height !== '630') fail(`${page.url}: OG dimensions must be 1200x630`);
  if (!alt) fail(`${page.url}: og:image:alt missing`);
  if (metaName(html, 'twitter:card') !== 'summary_large_image') fail(`${page.url}: twitter card is not large-image`);
  if (metaName(html, 'twitter:image') !== ogImage) fail(`${page.url}: twitter:image must match og:image`);
  if (!metaName(html, 'twitter:image:alt')) fail(`${page.url}: twitter:image:alt missing`);

  if (ogImage) {
    let parsed;
    try { parsed = new URL(ogImage); } catch { fail(`${page.url}: invalid og:image URL ${ogImage}`); return; }
    if (parsed.origin !== CANONICAL_ORIGIN) fail(`${page.url}: og:image must use canonical HTTPS origin`);
    if (parsed.pathname !== `/og/${page.id}.jpg`) fail(`${page.url}: og:image does not point at this story card`);
    if (!/^[a-f0-9]{12}$/.test(parsed.searchParams.get('og') ?? ''))
      fail(`${page.url}: og:image must be content-addressed for cache busting`);
    images.set(ogImage, page.id);
  }
});

await mapLimit([...images.entries()], 6, async ([image, id]) => {
  const got = await get(image.replace(CANONICAL_ORIGIN, CHECK_ORIGIN), META_UA, true);
  if (!got) return;
  const { res, body } = got;
  if (res.status !== 200) { fail(`${image}: Meta crawler image request returned ${res.status}`); return; }
  const ct = (res.headers.get('content-type') ?? '').toLowerCase();
  if (!ct.startsWith('image/jpeg')) fail(`${image}: expected image/jpeg, got ${ct || '(none)'}`);
  const size = jpegSize(body);
  if (!size) fail(`${image}: response is not a readable JPEG`);
  else if (size.width !== 1200 || size.height !== 630)
    fail(`${image}: live card must be 1200x630, got ${size.width}x${size.height}`);
  if (body.length < 10_000) fail(`${image}: live card is suspiciously small (${body.length} bytes)`);
  if (!id) fail(`${image}: no story id associated with live card`);
});

// WhatsApp itself may identify as WhatsApp rather than facebookexternalhit.
// Probe representative URLs, including the page that exposed this regression.
const whatsappProbeIds = ['rantideva-water', 'yudhisthira-dog', 'squirrel-setu'].filter(id => publicById.has(id));
for (const id of whatsappProbeIds) {
  const url = `${CANONICAL_ORIGIN}/s/${id}/`;
  const got = await get(htmlUrl(url), WHATSAPP_UA);
  if (!got) continue;
  if (got.res.status !== 200) { fail(`${url}: WhatsApp crawler returned ${got.res.status}`); continue; }
  const image = metaProperty(got.body, 'og:image');
  if (!image || !metaProperty(got.body, 'og:image:secure_url')) fail(`${url}: WhatsApp crawler cannot see complete OG image metadata`);
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL social preview: ${error}`);
  console.error(`production social preview: FAILED — ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`production social preview: PASS — ${pages.length} public story page(s) as facebookexternalhit, ${images.size} unique 1200x630 card(s), ${whatsappProbeIds.length} WhatsApp-UA probe(s)`);
