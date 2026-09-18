import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { localeContentHash } from './locale-content.mjs';
import { reelCardStructureErrors } from './reel-gates.mjs';
import { socialLocalePolicy } from './social-locale-policy.mjs';

const countWords = text =>
  String(text).trim() ? String(text).trim().split(/\s+/u).length : 0;

export function gateLocalePlan({
  root, story, localeDoc, lock, spec, heroUrl, cards
}) {
  const errors = [];
  const fail = message => errors.push(message);
  const key = `${localeDoc.locale}/${story.id}`;
  const policy = socialLocalePolicy(localeDoc.locale);

  for (const font of [
    policy.fontFile,
    'GentiumBookPlus-Regular.ttf',
    'Karla-var.ttf'
  ].filter(Boolean)) {
    if (!existsSync(join(root, 'assets', 'fonts', font)))
      fail(`required font missing: assets/fonts/${font}`);
  }

  if (story.status !== 'published')
    fail('canonical story is not published');
  if (localeDoc.status !== 'approved')
    fail(`${key}: locale is not approved`);
  if (localeDoc.sourceVersion !== story.version)
    fail(`${key}: source version mismatch`);

  const locked = lock.locales?.[key];
  if (!locked || locked.hash !== localeContentHash(localeDoc))
    fail(`${key}: locale is not locked to reviewed bytes`);

  if (!heroUrl)
    fail('approved canonical hero is missing');

  if (!spec || !Array.isArray(spec.blocks) || spec.blocks.length !== 5)
    fail('locale reel requires exactly five curated body selectors');

  for (const error of reelCardStructureErrors({
    cards,
    expectedBodyCount:spec?.blocks?.length ?? 0
  })) fail(error);

  for (const [i, selector] of (spec?.blocks ?? []).entries()) {
    if (!Number.isInteger(selector.index) || selector.index < 0)
      fail(`selector ${i + 1}: invalid narrative index`);
    if (!['full', 'firstSentence', 'sentence'].includes(selector.mode ?? 'full'))
      fail(`selector ${i + 1}: unsupported mode`);
    for (const forbidden of ['text', 'font', 'fontFamily', 'x', 'y', 'color']) {
      if (Object.prototype.hasOwnProperty.call(selector, forbidden))
        fail(`selector ${i + 1}: may not override ${forbidden}`);
    }
  }

  for (const [i, card] of cards.entries()) {
    if (card.role === 'hero') {
      if (card.text !== '')
        fail(`card ${i + 1}: hero must remain clean`);
      continue;
    }

    if (card.role === 'body' && countWords(card.text) > 18)
      fail(`card ${i + 1}: too dense (${countWords(card.text)} words)`);

    if (card.sourcePlain != null && card.sourcePlain !== card.text)
      fail(`card ${i + 1}: selected reviewed text was altered`);

    const d = card.diagnostics;
    if (!d) {
      fail(`card ${i + 1}: browser diagnostics missing`);
      continue;
    }

    if (d.engine !== 'chromium-block-layout-v1')
      fail(`card ${i + 1}: wrong layout engine`);
    if (!d.fontLoaded)
      fail(`card ${i + 1}: approved font did not load`);
    if (d.overflowX || d.overflowY)
      fail(`card ${i + 1}: rendered text overflow`);
    if (d.lineCount > card.maxLines)
      fail(`card ${i + 1}: ${d.lineCount} lines exceeds ${card.maxLines}`);
    if (d.lineCount > 1 && d.minLineRatio < 0.22)
      fail(`card ${i + 1}: tiny orphan-like line (${d.minLineRatio.toFixed(2)})`);
    if (d.sourceLength !== card.text.length)
      fail(`card ${i + 1}: browser text length differs from source`);
  }

  if (errors.length) {
    for (const error of errors)
      console.error(`FAIL locale reel gate: ${error}`);
    throw new Error(`locale reel gate failed with ${errors.length} error(s)`);
  }

  return [
    'approved + locked locale bytes',
    'reviewed text unchanged',
    'cover + clean hero + bodyx5 + source + CTA',
    'Chromium native shaping',
    'native word spacing + line breaking',
    'no custom word positioning',
    'safe width + height',
    'no tiny orphan-like line',
    'approved font loaded',
    'English reel path untouched',
    'display URL only: sandhyakatha.com'
  ];
}
