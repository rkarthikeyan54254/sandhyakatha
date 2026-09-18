#!/usr/bin/env node
import {
  existsSync, readFileSync, readdirSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDomAttr } from './lib/browser-card-render.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const errors = [];
const fail = message => errors.push(message);

const pkg = read('package.json');
if (pkg.scripts?.reel !== 'node scripts/reel.mjs')
  fail('package.json must expose exactly scripts/reel.mjs as the reel generator');
if (pkg.scripts?.['reel:check'] !== 'node scripts/reel.mjs --check')
  fail('package.json reel:check must route through scripts/reel.mjs');

const extraReelScripts = Object.keys(pkg.scripts ?? {})
  .filter(key => key.startsWith('reel:') && key !== 'reel:check');
if (extraReelScripts.length)
  fail(`parallel reel npm scripts are forbidden: ${extraReelScripts.join(', ')}`);

if (pkg.scripts?.['verify:reel-workflow'] !== 'node scripts/reel-workflow-gates.mjs')
  fail('verify:reel-workflow script is missing or changed');
if (!String(pkg.scripts?.['validate:strict'] ?? '').includes('scripts/reel-workflow-gates.mjs'))
  fail('validate:strict must include the reel workflow gate');

for (const rel of [
  'scripts/reel-locale.mjs',
  'scripts/language-campaign.mjs',
  'content/social-locale-parity.json'
]) {
  if (existsSync(join(ROOT, rel)))
    fail(`obsolete parallel reel workflow must not exist: ${rel}`);
}

const topLevelReelScripts = readdirSync(join(ROOT, 'scripts'))
  .filter(name => /^reel-.*\.mjs$/.test(name))
  .filter(name => name !== 'reel-workflow-gates.mjs');
if (topLevelReelScripts.length)
  fail(
    'new top-level reel workflows are forbidden; put renderer adapters under ' +
    `scripts/lib/: ${topLevelReelScripts.join(', ')}`
  );

for (const rel of [
  'scripts/reel.mjs',
  'scripts/lib/reel-locale-runner.mjs',
  'scripts/lib/reel-all-check.mjs',
  'scripts/lib/reel-gates.mjs',
  'scripts/lib/browser-card-render.mjs',
  'content/social-locales.json'
]) {
  if (!existsSync(join(ROOT, rel)))
    fail(`unified reel workflow component missing: ${rel}`);
}

// Regression test for the exact DOM-probe bug that previously blocked Hindi.
const probe = '<html data-sk-ready="1" data-sk-lines="2">';
if (readDomAttr(probe, 'data-sk-ready') !== '1' ||
    readDomAttr(probe, 'data-sk-lines') !== '2') {
  fail('browser diagnostic attribute parser regression');
}

const localeConfig = read('content/social-locales.json');
const publicConfig = read('content/locale-public.json');
const publicKeys = new Set(
  (publicConfig.editions ?? []).map(row => `${row.locale}/${row.storyId}`)
);

const allowedStoryKeys = new Set(['hook', 'blocks']);
const allowedHookKeys = new Set(['from', 'mode']);
const allowedSelectorKeys = new Set(['index', 'mode', 'sentence']);
const forbiddenSelectorKeys = new Set([
  'text', 'font', 'fontFamily', 'size', 'color', 'x', 'y',
  'wrapEm', 'wordSpacingEm', 'lineHeight'
]);

for (const [locale, cfg] of Object.entries(localeConfig.locales ?? {})) {
  const cfgKeys = Object.keys(cfg ?? {});
  if (cfgKeys.some(key => key !== 'stories'))
    fail(`${locale}: locale reel config may contain only stories/selectors`);

  for (const [storyId, spec] of Object.entries(cfg?.stories ?? {})) {
    if (!publicKeys.has(`${locale}/${storyId}`))
      fail(`${locale}/${storyId}: reel selector exists for a non-public locale edition`);

    for (const key of Object.keys(spec ?? {})) {
      if (!allowedStoryKeys.has(key))
        fail(`${locale}/${storyId}: unsupported story reel key ${key}`);
    }

    const hook = spec?.hook;
    if (hook) {
      for (const key of Object.keys(hook)) {
        if (!allowedHookKeys.has(key))
          fail(`${locale}/${storyId}: hook key ${key} is forbidden`);
      }
      if (!['title', 'tease'].includes(hook.from))
        fail(`${locale}/${storyId}: hook.from must be title or tease`);
      if (!['full', 'firstSentence'].includes(hook.mode ?? 'full'))
        fail(`${locale}/${storyId}: unsupported hook mode`);
    }

    if (!Array.isArray(spec?.blocks) || spec.blocks.length !== 5)
      fail(`${locale}/${storyId}: exactly five locale body selectors are required`);

    for (const [i, selector] of (spec?.blocks ?? []).entries()) {
      for (const key of Object.keys(selector ?? {})) {
        if (forbiddenSelectorKeys.has(key) || !allowedSelectorKeys.has(key))
          fail(`${locale}/${storyId}: selector ${i + 1} key ${key} is forbidden`);
      }
      if (!Number.isInteger(selector.index) || selector.index < 0)
        fail(`${locale}/${storyId}: selector ${i + 1} index is invalid`);
      if (!['full', 'firstSentence', 'sentence'].includes(selector.mode ?? 'full'))
        fail(`${locale}/${storyId}: selector ${i + 1} mode is invalid`);
      if (selector.mode === 'sentence' &&
          (!Number.isInteger(selector.sentence) || selector.sentence < 1))
        fail(`${locale}/${storyId}: selector ${i + 1} sentence is invalid`);
    }
  }
}

const reelSource = readFileSync(join(ROOT, 'scripts/reel.mjs'), 'utf8');
if (!reelSource.includes("./lib/reel-locale-runner.mjs"))
  fail('scripts/reel.mjs does not own locale reel dispatch');
if (!reelSource.includes("./lib/reel-all-check.mjs"))
  fail('scripts/reel.mjs does not own --all reel checks');

if (errors.length) {
  for (const error of errors)
    console.error(`FAIL reel workflow gate: ${error}`);
  process.exit(1);
}

console.log(
  'reel workflow gate: PASS — one CLI · selector-only locale config · ' +
  'no parallel generators · DOM parser regression covered'
);
