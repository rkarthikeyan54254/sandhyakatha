#!/usr/bin/env node
/**
 * Bharat observance validator.
 *
 * Structural truth lives in schema/observance.schema.json.
 * Cross-field/editorial truth lives here so the schema stays readable.
 *
 * This validator does not resolve dates and does not map observances to stories.
 * It only guarantees that research records are shaped well enough to trust.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = new URL('..', import.meta.url).pathname;
const STRICT = process.argv.includes('--strict');
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

const schema = read('schema/observance.schema.json');
const vocab = read('content/observance-vocabulary.json');
const dir = join(ROOT, 'content/observances');
const files = existsSync(dir)
  ? readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort()
  : [];

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const ajv = addFormats(new Ajv({ allErrors:true, strict:false }));
const validate = ajv.compile(schema);

const setOf = key => new Set(vocab[key] ?? []);
const kinds = setOf('kinds');
const traditions = setOf('traditions');
const regions = setOf('regions');
const tiers = setOf('importanceTiers');
const windows = setOf('decisionWindows');
const sourceTypes = setOf('sourceTypes');
const months = setOf('lunarMonths');
const tithis = setOf('tithis');
const nakshatras = setOf('nakshatras');
const solarCalendars = setOf('solarCalendars');

for (const [key, set] of Object.entries({
  kinds, traditions, regions, tiers, windows, sourceTypes, months, tithis,
  nakshatras, solarCalendars
})) if (!set.size) err('observance-vocabulary.json', `${key} vocabulary is empty`);

const seenIds = new Set();

function requireFields(where, obj, fields, ruleType) {
  for (const field of fields)
    if (obj[field] === undefined || obj[field] === null || obj[field] === '')
      err(where, `rule ${ruleType} requires ${field}`);
}

function forbidFields(where, obj, fields, ruleType) {
  for (const field of fields)
    if (obj[field] !== undefined)
      err(where, `rule ${ruleType} must not carry ${field}`);
}

function validateRule(where, r) {
  if (r.decisionWindow && !windows.has(r.decisionWindow))
    err(where, `decisionWindow "${r.decisionWindow}" is not in observance-vocabulary.json`);
  if (r.month && !months.has(r.month))
    err(where, `month "${r.month}" is not in lunarMonths vocabulary`);
  if (r.tithi && !tithis.has(r.tithi))
    err(where, `tithi "${r.tithi}" is not in tithis vocabulary`);
  if (r.nakshatra && !nakshatras.has(r.nakshatra))
    err(where, `nakshatra "${r.nakshatra}" is not in nakshatras vocabulary`);
  if (r.solarCalendar && !solarCalendars.has(r.solarCalendar))
    err(where, `solarCalendar "${r.solarCalendar}" is not controlled`);

  switch (r.type) {
    case 'lunar-tithi':
      requireFields(where, r, ['monthSystem','month','paksha','tithi','decisionWindow'], r.type);
      forbidFields(where, r, ['nakshatra','solarCalendar','solarDay','anchorObservanceId',
        'offsetDays','gregorianMonth','gregorianDay','datesByYear'], r.type);
      break;
    case 'lunar-nakshatra':
      requireFields(where, r, ['monthSystem','month','nakshatra','decisionWindow'], r.type);
      forbidFields(where, r, ['tithi','solarCalendar','solarDay','anchorObservanceId',
        'offsetDays','gregorianMonth','gregorianDay','datesByYear'], r.type);
      break;
    case 'solar-nakshatra':
      requireFields(where, r, ['solarCalendar','month','nakshatra','decisionWindow'], r.type);
      forbidFields(where, r, ['paksha','tithi','solarDay','anchorObservanceId',
        'offsetDays','gregorianMonth','gregorianDay','datesByYear'], r.type);
      break;
    case 'solar-day':
      requireFields(where, r, ['solarCalendar','month','solarDay'], r.type);
      forbidFields(where, r, ['paksha','tithi','nakshatra','anchorObservanceId',
        'offsetDays','gregorianMonth','gregorianDay','datesByYear'], r.type);
      break;
    case 'recurring-tithi':
      requireFields(where, r, ['paksha','tithi','decisionWindow'], r.type);
      forbidFields(where, r, ['month','nakshatra','solarCalendar','solarDay',
        'anchorObservanceId','offsetDays','gregorianMonth','gregorianDay','datesByYear'], r.type);
      break;
    case 'relative':
      requireFields(where, r, ['anchorObservanceId','offsetDays'], r.type);
      forbidFields(where, r, ['month','paksha','tithi','nakshatra','solarCalendar',
        'solarDay','gregorianMonth','gregorianDay','datesByYear'], r.type);
      break;
    case 'gregorian-fixed':
      requireFields(where, r, ['gregorianMonth','gregorianDay'], r.type);
      forbidFields(where, r, ['month','paksha','tithi','nakshatra','solarCalendar',
        'solarDay','anchorObservanceId','offsetDays','datesByYear'], r.type);
      break;
    case 'yearly-explicit':
      requireFields(where, r, ['datesByYear'], r.type);
      forbidFields(where, r, ['month','paksha','tithi','nakshatra','solarCalendar',
        'solarDay','anchorObservanceId','offsetDays','gregorianMonth','gregorianDay'], r.type);
      break;
    case 'multi-day':
      requireFields(where, r, ['durationDays'], r.type);
      if (!(r.anchorObservanceId || (r.month && r.paksha && r.tithi)))
        err(where, 'multi-day requires either anchorObservanceId or month+paksha+tithi anchor');
      break;
    default:
      err(where, `unsupported rule type "${r.type}"`);
  }
}

for (const file of files) {
  const at = `observances/${file}`;
  let o;
  try { o = read(`content/observances/${file}`); }
  catch (e) { err(at, `invalid JSON — ${e.message}`); continue; }

  if (!validate(o)) {
    for (const e of validate.errors ?? [])
      err(at, `${e.instancePath || '/'} ${e.message}`);
    continue;
  }

  if (o.id !== basename(file, '.json'))
    err(at, `id "${o.id}" does not match filename`);
  if (seenIds.has(o.id)) err(at, `duplicate id "${o.id}"`);
  seenIds.add(o.id);

  if (!kinds.has(o.kind)) err(at, `kind "${o.kind}" is not controlled`);
  for (const t of o.scope.traditions)
    if (!traditions.has(t)) err(at, `tradition "${t}" is not controlled`);
  for (const r of o.scope.regions)
    if (!regions.has(r)) err(at, `region "${r}" is not controlled`);
  if (!tiers.has(o.importance.tier))
    err(at, `importance tier "${o.importance.tier}" is not controlled`);

  validateRule(at, o.rule);

  const sourceIds = new Set();
  const support = new Set();
  for (const src of o.provenance.sources) {
    if (sourceIds.has(src.id)) err(at, `duplicate source id "${src.id}"`);
    sourceIds.add(src.id);
    if (!sourceTypes.has(src.type))
      err(at, `source "${src.id}" type "${src.type}" is not controlled`);
    for (const s of src.supports) support.add(s);
    if (src.url && !src.accessedOn)
      warn(at, `web source "${src.id}" has URL but no accessedOn date`);
  }

  if (['sourced','in-review','approved'].includes(o.status)) {
    for (const needed of ['identity','rule','scope'])
      if (!support.has(needed))
        err(at, `${o.status} record has no source explicitly supporting ${needed}`);
  }

  if (o.status === 'approved') {
    if (!o.provenance.reviewedBy) err(at, 'approved without provenance.reviewedBy');
    if (!o.provenance.reviewedOn) err(at, 'approved without provenance.reviewedOn');
    if (o.confidence === 'provisional')
      err(at, 'approved record cannot have provisional confidence');
    if (o.rule.type === 'yearly-explicit')
      warn(at, 'approved yearly-explicit rule should be exceptional; prefer a reusable sourced rule when possible');
  }

  if (o.scope.breadth === 'pan-india' && !o.scope.regions.includes('all-india'))
    err(at, 'pan-india breadth must include all-india region');
  if (o.scope.breadth !== 'pan-india' && o.scope.regions.includes('all-india'))
    warn(at, `breadth is ${o.scope.breadth} but region includes all-india — verify the scope`);
  if (o.scope.breadth === 'sampradaya' && o.scope.traditions.includes('general-hindu'))
    err(at, 'sampradaya breadth cannot use only general-hindu tradition');

  if (o.importance.tier === 'principal' && o.importance.score < 80)
    warn(at, 'principal importance score is below 80');
  if (o.importance.tier === 'local' && o.importance.score > 60)
    warn(at, 'local importance score is above 60');

  if (o.variants?.length && !support.has('variant') && ['in-review','approved'].includes(o.status))
    err(at, `${o.status} record lists variants but no source supports variant`);
}

const c = { r:'\x1b[31m', y:'\x1b[33m', g:'\x1b[32m', d:'\x1b[2m', x:'\x1b[0m' };
for (const w of warnings) console.log(`${c.y}warn${c.x}  ${w}`);
for (const e of errors) console.log(`${c.r}ERROR${c.x} ${e}`);
console.log(`${c.d}—${c.x}`);
console.log(`${files.length} observance record(s)`);
const fail = errors.length || (STRICT && warnings.length);
console.log(fail
  ? `${c.r}FAILED${c.x} — ${errors.length} error(s), ${warnings.length} warning(s)`
  : `${c.g}OK${c.x} — ${warnings.length} warning(s)`);
process.exit(fail ? 1 : 0);
