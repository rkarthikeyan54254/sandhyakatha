#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CANONICAL_ORIGIN = 'https://sandhyakatha.com';
const CHECK_ORIGIN = (process.env.CRAWL_CHECK_ORIGIN ?? CANONICAL_ORIGIN).replace(/\/$/, '');
const UA = 'PerplexityBot';
const errors = [];
const fail = msg => errors.push(msg);
const readJson = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

const canon = readJson('content/canon.json').canon ?? [];
const localePublic = readJson('content/locale-public.json');
const publicStories = canon.filter(x => x.status === 'published' && !x.gated);
const expectedStoryUrls = new Set(publicStories.map(x => `${CANONICAL_ORIGIN}/s/${x.id}/`));
for (const row of localePublic.editions ?? []) {
  const lang = String(row.locale).split('-')[0];
  expectedStoryUrls.add(`${CANONICAL_ORIGIN}/s/${row.storyId}/${lang}/`);
}

function decodeXml(s) {
  return String(s)
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&apos;/g,"'");
}
function stripHtml(s) {
  return String(s)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
    .replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"')
    .replace(/\s+/g,' ').trim();
}
function meta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const a = html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,'i'));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`,'i'));
  return (a?.[1] ?? b?.[1] ?? '').trim();
}
function canonical(html) {
  return (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1]
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i)?.[1]
    ?? '').trim();
}
function parseSitemap(xml) {
  if (!/^<\?xml\s+version=["']1\.0["']\s+encoding=["']UTF-8["']\?>/i.test(xml.trim()))
    fail('sitemap.xml: XML declaration is missing or malformed');
  if (!/<urlset\s+xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']\s*>/i.test(xml))
    fail('sitemap.xml: required sitemap namespace is missing');
  const opens = (xml.match(/<url>/g) ?? []).length;
  const closes = (xml.match(/<\/url>/g) ?? []).length;
  const locOpens = (xml.match(/<loc>/g) ?? []).length;
  const locCloses = (xml.match(/<\/loc>/g) ?? []).length;
  if (opens !== closes || locOpens !== locCloses || opens !== locOpens)
    fail('sitemap.xml: url/loc elements are not balanced');
  if (!/<\/urlset>\s*$/i.test(xml.trim())) fail('sitemap.xml: closing urlset is missing');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decodeXml(m[1].trim()));
}

async function get(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': UA,
        'accept': 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8'
      }
    });
    const body = await res.text();
    return { res, body };
  } catch (err) {
    fail(`${url}: request failed: ${err?.message ?? err}`);
    return null;
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker()));
  return results;
}

const robotsUrl = `${CHECK_ORIGIN}/robots.txt`;
const robots = await get(robotsUrl);
const expectedRobots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  'Disallow: /preview/',
  '',
  'Sitemap: https://sandhyakatha.com/sitemap.xml'
].join('\n');
if (robots) {
  if (robots.res.status !== 200) fail(`robots.txt: expected 200, got ${robots.res.status}`);
  const ct = robots.res.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().startsWith('text/plain')) fail(`robots.txt: expected text/plain, got ${ct || '(none)'}`);
  if (robots.body.trim() !== expectedRobots.trim()) fail('robots.txt: production contents differ from policy');
  if (/Disallow:\s*\/s\//i.test(robots.body) || /Disallow:\s*\/\s*$/mi.test(robots.body))
    fail('robots.txt: public story crawling is blocked');
  if (/PerplexityBot/i.test(robots.body) && /Disallow/i.test(robots.body))
    fail('robots.txt: Perplexity-specific blocking is present');
}

const sitemapUrl = `${CHECK_ORIGIN}/sitemap.xml`;
const sitemap = await get(sitemapUrl);
let locs = [];
if (sitemap) {
  if (sitemap.res.status !== 200) fail(`sitemap.xml: expected 200, got ${sitemap.res.status}`);
  const ct = (sitemap.res.headers.get('content-type') ?? '').toLowerCase();
  if (!/(application|text)\/xml/.test(ct)) fail(`sitemap.xml: expected XML content type, got ${ct || '(none)'}`);
  locs = parseSitemap(sitemap.body);
  if (!locs.length) fail('sitemap.xml: contains no URLs');
  const seen = new Set();
  for (const loc of locs) {
    if (seen.has(loc)) fail(`sitemap.xml: duplicate URL ${loc}`);
    seen.add(loc);
    let u;
    try { u = new URL(loc); } catch { fail(`sitemap.xml: invalid URL ${loc}`); continue; }
    if (u.origin !== CANONICAL_ORIGIN || u.protocol !== 'https:')
      fail(`sitemap.xml: non-canonical origin ${loc}`);
    if (u.search || u.hash) fail(`sitemap.xml: canonical URL contains query/fragment ${loc}`);
    if (/\/api\/|\/preview\/|\/admin(?:\/|$)|\/draft(?:\/|$)|\/staging(?:\/|$)|localhost|netlify\.app/i.test(loc))
      fail(`sitemap.xml: forbidden public URL ${loc}`);
  }
  if (!seen.has(`${CANONICAL_ORIGIN}/`)) fail('sitemap.xml: homepage missing');
  if (!seen.has(`${CANONICAL_ORIGIN}/stories/`)) fail('sitemap.xml: /stories/ archive missing');
  for (const expected of expectedStoryUrls)
    if (!seen.has(expected)) fail(`sitemap.xml: published story missing ${expected}`);
}

const fetched = new Map();
if (locs.length) {
  await mapLimit(locs, 6, async loc => {
    const checkUrl = loc.replace(CANONICAL_ORIGIN, CHECK_ORIGIN);
    const got = await get(checkUrl);
    if (!got) return;
    fetched.set(loc, got);
    if (got.res.status !== 200) fail(`${loc}: expected 200, got ${got.res.status}`);
    const final = new URL(got.res.url);
    if (final.hostname.includes('netlify.app') || final.pathname.startsWith('/preview/'))
      fail(`${loc}: redirected to preview/staging URL ${got.res.url}`);
  });
}

for (const loc of expectedStoryUrls) {
  const got = fetched.get(loc) ?? await get(loc.replace(CANONICAL_ORIGIN,CHECK_ORIGIN));
  if (!got) continue;
  const {res, body:html}=got;
  if (res.status !== 200) { fail(`${loc}: PerplexityBot story request returned ${res.status}`); continue; }
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
  if (!title) fail(`${loc}: non-empty title missing`);
  if (!meta(html,'description')) fail(`${loc}: meta description missing`);
  if (canonical(html) !== loc) fail(`${loc}: self-canonical missing or incorrect (${canonical(html) || 'none'})`);
  if (!/<h1\b[^>]*>[^<]+<\/h1>/i.test(html)) fail(`${loc}: H1 missing`);
  const prose = html.match(/<(main|div) class=["']prose["'][^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? '';
  if (stripHtml(prose).length < 300) fail(`${loc}: meaningful story text is missing from initial HTML`);
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))
    fail(`${loc}: accidental meta noindex`);
  if (/noindex/i.test(res.headers.get('x-robots-tag') ?? ''))
    fail(`${loc}: accidental X-Robots-Tag noindex`);
  if (!html.includes('"@type":"ShortStory"')) fail(`${loc}: ShortStory JSON-LD missing`);
}

const badStory = await get(`${CHECK_ORIGIN}/s/__crawler-404-check__/`);
if (badStory && badStory.res.status !== 404)
  fail(`invalid story route: expected 404, got ${badStory.res.status}`);

if (errors.length) {
  for (const e of errors) console.error(`FAIL production crawl: ${e}`);
  console.error(`production crawl: FAILED — ${errors.length} problem(s)`);
  process.exit(1);
}

console.log(`production crawl: PASS — robots + sitemap + ${locs.length} sitemap URL(s) + ${expectedStoryUrls.size} story page(s) checked as ${UA}`);
