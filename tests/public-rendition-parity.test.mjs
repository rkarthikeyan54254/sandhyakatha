import { describe, expect, it } from 'vitest';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { publicRenditionErrors, publicRenditionSection } from '../scripts/lib/public-renditions.mjs';
import { gitBlobSha1, localeContentHash } from '../scripts/lib/locale-content.mjs';

const lengths = {
  full: { minutes: 6, blocks: [{ t: 'p', text: 'Full first scene' }, { t: 'beat' },
    { t: 'aside', text: 'Parent context' }, { t: 'slow', text: 'Full landing' }] },
  short: { minutes: 3, blocks: [{ t: 'p', text: 'Short turn' }, { t: 'slow', text: 'Short landing' }] }
};
const html = `<!-- rendition:full:start --><details data-rendition="full" data-minutes="6" open><summary>Full · 6 min</summary><div class="prose"><p>Full first scene</p><div class="beat">pause</div><aside class="note">Parent context</aside><p class="slow">Full landing</p></div></details><!-- rendition:full:end -->
<!-- rendition:short:start --><details data-rendition="short" data-minutes="3"><summary>Short · 3 min</summary><div class="prose"><p>Short turn</p><p class="slow">Short landing</p></div></details><!-- rendition:short:end -->`;
describe('public rendition evidence', () => {
  it('accepts both complete tellings with full open by default', () => {
    expect(publicRenditionErrors(html, lengths, x => x)).toEqual([]);
  });
  it('rejects short-only pages despite complete source metadata', () => {
    const shortOnly = html.slice(html.indexOf('<!-- rendition:short:start -->'));
    expect(publicRenditionErrors(shortOnly, lengths, x => x).join('\n')).toContain('full: public rendition section missing');
  });
  it('rejects omitted, replaced, and reordered text within the correct wrapper', () => {
    for (const changed of [html.replace('Full first scene</p>', 'Short turn</p>'),
      html.replace('Full first scene</p>', 'Full landing</p>').replace('Full landing</p></div>', 'Full first scene</p></div>')])
      expect(publicRenditionErrors(changed, lengths, x => x).join('\n')).toContain('missing or out of order');
  });
  it('rejects hiding full by default and a misleading duration', () => {
    const errors = publicRenditionErrors(html.replace(' open>', '>').replace('data-minutes="6"', 'data-minutes="3"'), lengths, x => x);
    expect(errors).toContain('full: public duration mismatch');
    expect(errors).toContain('full: public telling must be open by default');
  });
});

describe('real reviewed locale runtime and public rendering', () => {
  function fixture() {
    const root = mkdtempSync(join(tmpdir(), 'sk-render-parity-'));
    const id = 'appar-spade';
    const files = ['scripts/build-runtime-locales.mjs', 'scripts/runtime-locale-gates.mjs',
      'scripts/prerender-public-locales.mjs', 'scripts/public-locale-gates.mjs',
      'scripts/lib/media.mjs', 'scripts/lib/locale-content.mjs', 'scripts/lib/locale-paths.mjs',
      'scripts/lib/rendition-parity.mjs', 'scripts/lib/release-rendition-parity.mjs', 'scripts/lib/legacy-parity-seal.mjs', 'scripts/lib/public-renditions.mjs',
      'scripts/lib/runtime-locale-editions.mjs',
      'content/locale.lock.json', `content/stories/${id}.json`,
      `content/locales/hi/${id}.json`, `content/locales/ta/${id}.json`, `public/og/${id}.jpg`];
    for (const file of files) {
      mkdirSync(join(root, file, '..'), { recursive: true });
      copyFileSync(new URL(`../${file}`, import.meta.url), join(root, file));
    }
    const cfg = JSON.parse(readFileSync(new URL('../content/locale-public.json', import.meta.url)));
    cfg.editions = cfg.editions.filter(row => row.storyId === id);
    writeFileSync(join(root, 'content/locale-public.json'), JSON.stringify(cfg));
    writeFileSync(join(root, 'content/media.json'), JSON.stringify({ stories: {} }));
    mkdirSync(join(root, 'dist/s', id), { recursive: true });
    writeFileSync(join(root, `dist/s/${id}/index.html`), '<html><head></head><body><nav class="locale-public-switch" data-locale-switch></nav></body></html>');
    writeFileSync(join(root, 'dist/sitemap.xml'), '<urlset></urlset>');
    return { root, id, run: script => spawnSync(process.execPath, [join(root, `scripts/${script}.mjs`)], { encoding: 'utf8' }),
      read: file => JSON.parse(readFileSync(join(root, file), 'utf8')) };
  }
  it('preserves both reviewed tellings through generation, catalog, static pages, and gates', () => {
    const f = fixture();
    try {
      for (const script of ['build-runtime-locales', 'runtime-locale-gates', 'prerender-public-locales', 'public-locale-gates']) {
        const result = f.run(script); expect(result.stderr).toBe(''); expect(result.status).toBe(0);
      }
      for (const language of ['hi', 'ta']) {
        const doc = f.read(`content/locales/${language}/${f.id}.json`);
        const runtime = f.read(`public/data/l/${language}/${f.id}.json`);
        expect(Object.keys(runtime.lengths).sort()).toEqual(['full', 'short']);
        for (const length of ['full', 'short']) expect(runtime.lengths[length].blocks).toEqual(doc.lengths[length].blocks);
        const rendered = readFileSync(join(f.root, `dist/s/${f.id}/${language}/index.html`), 'utf8');
        expect(publicRenditionSection(rendered, 'full')).toContain(' open>');
        expect(publicRenditionSection(rendered, 'short')).toContain('data-minutes="3"');
      }
      const path = join(f.root, `dist/s/${f.id}/ta/index.html`);
      const rendered = readFileSync(path, 'utf8');
      writeFileSync(path, rendered.replace(/<!-- rendition:full:start -->[\s\S]*?<!-- rendition:full:end -->/, ''));
      const rejected = f.run('public-locale-gates');
      expect(rejected.status).toBe(1); expect(rejected.stderr).toContain('full: public rendition section missing');
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
  it('includes reviewed gated stories in runtime without publishing static locale pages', () => {
    const f = fixture();
    try {
      const source = f.read(`content/stories/${f.id}.json`);
      source.audience.gated = true;
      const raw = JSON.stringify(source);
      writeFileSync(join(f.root, `content/stories/${f.id}.json`), raw);
      const lock = f.read('content/locale.lock.json');
      for (const language of ['hi', 'ta']) {
        const doc = f.read(`content/locales/${language}/${f.id}.json`);
        doc.sourceBlobSha1 = gitBlobSha1(raw);
        writeFileSync(join(f.root, `content/locales/${language}/${f.id}.json`), JSON.stringify(doc));
        lock.locales[`${language}-IN/${f.id}`].hash = localeContentHash(doc);
      }
      writeFileSync(join(f.root, 'content/locale.lock.json'), JSON.stringify(lock));
      const cfg = f.read('content/locale-public.json'); cfg.editions = [];
      writeFileSync(join(f.root, 'content/locale-public.json'), JSON.stringify(cfg));
      for (const script of ['build-runtime-locales', 'runtime-locale-gates', 'prerender-public-locales']) {
        const result = f.run(script); expect(result.stderr).toBe(''); expect(result.status).toBe(0);
      }
      for (const language of ['hi', 'ta']) {
        expect(f.read(`public/data/l/${language}/${f.id}.json`).audience.gated).toBe(true);
        expect(existsSync(join(f.root, `dist/s/${f.id}/${language}/index.html`))).toBe(false);
      }
    } finally { rmSync(f.root, { recursive: true, force: true }); }
  });
});
