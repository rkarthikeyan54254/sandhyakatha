#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const out = read('public/data/observances.json');
const policy = read('content/observance-runtime-policy.json');
const errors = [];
const fail = msg => errors.push(msg);

if (out.schemaVersion !== '1.0') fail('runtime observance schemaVersion must be 1.0');
if (out.meta.sourceObservances !== 196)
  fail(`expected 196-source corpus, found ${out.meta.sourceObservances}`);
if (out.meta.runtimeStoryMappings !== policy.selectionMappings.length)
  fail('runtime mapping count must exactly match explicit policy allowlist');

for (const [date, list] of Object.entries(out.dates ?? {})) {
  if (!/^202[6-9]-\d\d-\d\d$/.test(date)) fail(`unexpected runtime date ${date}`);
  for (const o of list) {
    if (!o.source?.authority || !String(o.source.url ?? '').startsWith('https://'))
      fail(`${date}/${o.id}: source metadata missing`);
    for (const m of o.stories ?? []) {
      const allowed = policy.selectionMappings.some(x =>
        x.observanceId === o.id && x.storyId === m.storyId
      );
      if (!allowed) fail(`${date}/${o.id}/${m.storyId}: mapping escaped allowlist`);
      if (!policy.allowedRelevance.includes(m.relevance))
        fail(`${date}/${o.id}/${m.storyId}: relevance ${m.relevance} not runtime-eligible`);
    }
  }
}

const radha = (out.dates['2026-09-19'] ?? []).find(x => x.id === 'radha-ashtami');
if (!radha) fail('2026-09-19 must expose the cross-checked Radha Ashtami context');
else if ((radha.stories ?? []).length !== 0)
  fail('Radha Ashtami must remain an honest no-story gap in the pilot');

const vamana = (out.dates['2026-09-23'] ?? []).find(x => x.id === 'vamana-jayanti');
if (!vamana) fail('2026-09-23 must expose Vamana Jayanti');
else if (!(vamana.stories ?? []).some(x => x.storyId === 'vamana-three-steps'))
  fail('Vamana Jayanti must map to the published Vamana story');

for (const list of Object.values(out.dates ?? {}))
  for (const o of list)
    if ((o.stories ?? []).some(m => m.storyId === 'butter-rope'))
      fail('draft Janmashtami story leaked into runtime');

if ((out.dates['2026-11-10'] ?? []).some(x => x.id === 'govardhan-puja'))
  fail('known 2026 Govardhan source conflict must not leak into runtime context');

if (errors.length) {
  for (const e of errors) console.error(`FAIL runtime observance gate: ${e}`);
  process.exit(1);
}

console.log(
  `runtime observance gate: PASS — ${out.meta.agreedDateInstances} cross-checked date instances · ` +
  `${out.meta.runtimeStoryMappings} allowlisted story mappings · disputed dates excluded`
);
