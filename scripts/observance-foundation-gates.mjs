#!/usr/bin/env node
/**
 * Contract gate for the observance foundation. Prevents a later refactor from
 * silently weakening the separation between observance truth and story choice.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const text = rel => readFileSync(join(ROOT, rel), 'utf8');
const read = rel => JSON.parse(text(rel));
const errors = [];
const fail = msg => errors.push(msg);

const schema = read('schema/observance.schema.json');
const vocab = read('content/observance-vocabulary.json');
const validator = text('scripts/validate-observances.mjs');
const architecture = text('PANCHANGA-V2.md');
const pkg = read('package.json');

for (const field of ['scope','rule','importance','confidence','provenance'])
  if (!schema.properties?.[field]) fail(`schema missing ${field}`);

for (const key of ['kinds','traditions','regions','importanceTiers','decisionWindows','sourceTypes'])
  if (!Array.isArray(vocab[key]) || !vocab[key].length) fail(`vocabulary missing ${key}`);

for (const token of [
  "approved record cannot have provisional confidence",
  "has no source explicitly supporting",
  "pan-india breadth must include all-india region",
  "validateRule(at, o.rule)"
]) if (!validator.includes(token)) fail(`validator hard gate missing: ${token}`);

if (!architecture.includes('Stories do not define the calendar'))
  fail('PANCHANGA-V2.md lost the observance/story separation');
if (!schema.properties?.rule?.properties?.solarMonth ||
    !schema.properties?.rule?.properties?.type?.enum?.includes('solar-month-lunar-tithi'))
  fail('schema 1.1 must support solarMonth and hybrid solar-month/lunar-tithi rules');
if (!vocab.solarMonths?.tamil?.includes('margazhi') || !vocab.solarMonths?.malayalam?.includes('chingam'))
  fail('solar-month vocabularies for Tamil and Malayalam are missing');

if (!String(pkg.scripts?.['validate:observances'] ?? '').includes('validate-observances.mjs'))
  fail('package script validate:observances missing');
if (!String(pkg.scripts?.['validate:strict'] ?? '').includes('validate-observances.mjs'))
  fail('validate:strict does not include observance validation');

if (errors.length) {
  for (const e of errors) console.error(`FAIL observance foundation gate: ${e}`);
  process.exit(1);
}
console.log('observance foundation gate: PASS — sourced scope/rule/provenance contract protected');
