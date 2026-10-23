import { describe, it, expect } from 'vitest';
import { renditionParityErrors } from '../scripts/lib/rendition-parity.mjs';
import { gitBlobSha1, localeContentHash } from '../scripts/lib/locale-content.mjs';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const gate = () => ({ status: 'approved', reviewer: 'Human reviewer', reviewedOn: '2026-10-14' });
function fixture() {
  const source = { lengths: { short: { minutes: 3 }, full: { minutes: 6 } },
    close: { ifTheyAsk: [{}, {}] } };
  const doc = { lengths: Object.fromEntries(['short', 'full'].map(key => [key, {
    measuredSeconds: key === 'short' ? 180 : 360,
    blocks: [{ t: 'p', text: `Native ${key} story text` }, { t: 'slow', text: 'Landing' }]
  }])), review: { nativeReadAloud: { short: gate(), full: gate() } }, close: { ifTheyAsk: [{}, {}] } };
  return { source, doc };
}
describe('published rendition parity', () => {
  it('accepts independently reviewed short and full tellings', () => {
    const { source, doc } = fixture();
    expect(renditionParityErrors(source, doc)).toEqual([]);
  });
  it('rejects the current short-only locale contract', () => {
    const { source, doc } = fixture();
    delete doc.lengths.full; delete doc.review.nativeReadAloud.full;
    expect(renditionParityErrors(source, doc).join('\n')).toContain('must match canonical full,short');
  });
  it('rejects relabeling short text as a full telling', () => {
    const { source, doc } = fixture(); doc.lengths.full.measuredSeconds = 180;
    expect(renditionParityErrors(source, doc).join('\n')).toContain('canonical promises 6 min');
  });
  it('rejects missing full review, timing, and spoken text', () => {
    const { source, doc } = fixture();
    doc.review.nativeReadAloud.full.status = 'pending';
    doc.lengths.full.measuredSeconds = null;
    doc.lengths.full.blocks = [{ t: 'aside', text: 'Parent note' }];
    expect(renditionParityErrors(source, doc)).toHaveLength(3);
  });
  it('rejects extra lengths and missing follow-ups', () => {
    const { source, doc } = fixture(); doc.lengths.extra = doc.lengths.short;
    doc.close.ifTheyAsk.pop();
    expect(renditionParityErrors(source, doc)).toHaveLength(2);
  });
  it('rejects copying short into full and fabricating a machine read-aloud review', () => {
    const { source, doc } = fixture();
    doc.lengths.full.blocks = doc.lengths.short.blocks;
    doc.review.nativeReadAloud.full.reviewer = 'Codex';
    const errors = renditionParityErrors(source, doc);
    expect(errors).toContain('full: native read-aloud lacks human approval');
    expect(errors.join('\n')).toContain('not identical spoken text');
  });
});

describe('release parity gate integration', () => {
  function run(shortOnly) {
    const root = mkdtempSync(join(tmpdir(), 'sk-parity-'));
    try {
      for (const path of ['scripts/lib', 'content/stories', 'content/locales/hi', 'content/locales/ta'])
        mkdirSync(join(root, path), { recursive: true });
      for (const path of ['scripts/locale-parity-gates.mjs', 'scripts/lib/rendition-parity.mjs', 'scripts/lib/release-rendition-parity.mjs', 'scripts/lib/legacy-parity-seal.mjs', 'scripts/lib/locale-content.mjs'])
        copyFileSync(new URL(`../${path}`, import.meta.url), join(root, path));
      const { source, doc } = fixture();
      Object.assign(source, { id: 'example', status: 'published', version: 1 });
      const sourceText = JSON.stringify(source);
      writeFileSync(join(root, 'content/stories/example.json'), sourceText);
      const locales = {}, editions = [];
      for (const language of ['hi', 'ta']) {
        const edition = structuredClone(doc);
        if (shortOnly && language === 'ta') {
          delete edition.lengths.full; delete edition.review.nativeReadAloud.full;
        }
        Object.assign(edition, { storyId: 'example', locale: `${language}-IN`, language,
          sourceVersion: 1, sourceBlobSha1: gitBlobSha1(sourceText), status: 'approved' });
        edition.review.languageEditor = gate(); edition.review.sourceFidelity = gate();
        writeFileSync(join(root, `content/locales/${language}/example.json`), JSON.stringify(edition));
        locales[`${language}-IN/example`] = { hash: localeContentHash(edition), sourceVersion: 1 };
        editions.push({ locale: `${language}-IN`, storyId: 'example' });
      }
      writeFileSync(join(root, 'content/locale.lock.json'), JSON.stringify({ locales }));
      writeFileSync(join(root, 'content/locale-public.json'), JSON.stringify({ editions }));
      return spawnSync(process.execPath, [join(root, 'scripts/locale-parity-gates.mjs')], { encoding: 'utf8' });
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  it('passes complete approved and locked siblings', () => {
    const result = run(false); expect(result.stderr).toBe(''); expect(result.status).toBe(0);
  });
  it('blocks even an approved and correctly locked short-only Tamil sibling', () => {
    const result = run(true); expect(result.status).toBe(1);
    expect(result.stderr).toContain('ta-IN/example: rendition keys short must match canonical full,short');
  });
});
