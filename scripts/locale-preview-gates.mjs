#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname; const DIST = join(ROOT,'dist'); const read = p => JSON.parse(readFileSync(join(ROOT,p),'utf8')); const cfg = read('content/locale-previews.json'); const errors=[]; const fail=m=>errors.push(m); let editions=0;
function localeDoc(locale, storyId) {
  const lang = locale.split('-')[0];
  return read(`content/locales/${lang}/${storyId}.json`);
}

for (const p of cfg.previews ?? []) {
  const rootPage=join(DIST,'preview',p.storyId,'index.html');
  if (!existsSync(rootPage)) fail(`${p.storyId}: preview root redirect missing`);
  else {
    const rootHtml=readFileSync(rootPage,'utf8');
    if (/<script(?![^>]+src=)/i.test(rootHtml)) fail(`${p.storyId}: preview root contains inline script, forbidden by CSP`);
    if (!rootHtml.includes('data-locale-preview-root')) fail(`${p.storyId}: preview root is missing external redirect hook`);
  }
  for (const locale of p.locales ?? []) {
    editions += 1; const lang=locale.split('-')[0]; const page=join(DIST,'preview',p.storyId,lang,'index.html'); if (!existsSync(page)) { fail(`${p.storyId}/${lang}: preview page missing`); continue; } const html=readFileSync(page,'utf8');
    if (!html.includes('<meta name="robots" content="noindex,nofollow,noarchive">')) fail(`${p.storyId}/${lang}: preview is indexable`);
    if (!html.includes(`href="/s/${p.storyId}/"`)) fail(`${p.storyId}/${lang}: reviewed English canonical link is missing`);
    const doc = localeDoc(locale, p.storyId);
    if (doc.status === 'approved') {
      if (!html.includes('Reviewed language edition')) fail(`${p.storyId}/${lang}: approved-edition disclosure is missing`);
      if (!html.includes('Human review complete')) fail(`${p.storyId}/${lang}: approved human-review disclosure is missing`);
      if (html.includes('Human language review still in progress') || html.includes('not yet a reviewed Sandhya Katha language edition'))
        fail(`${p.storyId}/${lang}: approved locale still carries in-review copy`);
      if (!html.includes('6 min measured')) fail(`${p.storyId}/${lang}: approved measured read-aloud duration is missing`);
    } else {
      if (!html.includes('Early language edition')) fail(`${p.storyId}/${lang}: preview disclosure is missing`);
      if (!html.includes('Human language review still in progress')) fail(`${p.storyId}/${lang}: human-review disclosure is missing`);
    }
    if (!html.includes('Share this preview')) fail(`${p.storyId}/${lang}: preview-specific share action is missing`);
    if (!html.includes('data-locale-report')) fail(`${p.storyId}/${lang}: locale-aware correction surface is missing`);
    if (!html.includes(`data-locale="${locale}"`)) fail(`${p.storyId}/${lang}: built page carries wrong locale identity`);
    if (!html.includes('Review status for this edition')) fail(`${p.storyId}/${lang}: per-edition review status is missing`);
    for (const forbidden of ['We read this tonight','Tonight is saved.','Tomorrow night']) if (html.includes(forbidden)) fail(`${p.storyId}/${lang}: preview leaked production reader state: "${forbidden}"`);
  }
}
const sitemap=join(DIST,'sitemap.xml'); if (existsSync(sitemap) && readFileSync(sitemap,'utf8').includes('/preview/')) fail('preview URLs leaked into sitemap');
if (errors.length) { for (const e of errors) console.error(`ERROR locale preview gate: ${e}`); console.error(`FAILED — ${errors.length} locale preview error(s)`); process.exit(1); }
console.log(`locale preview gates: PASS — ${editions} edition page(s) are explicit, noindex, feedback-enabled and isolated from Reader state`);
