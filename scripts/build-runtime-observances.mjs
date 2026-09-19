#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

const policy = read('content/observance-runtime-policy.json');
const mapDoc = read('content/observance-story-map.json');
const resolvedDoc = read('reports/observances-2026-2029.json');
const canon = read('content/canon.json').canon;
const panchanga = read('content/panchanga.json');

const observances = new Map(
  readdirSync(join(ROOT, 'content/observances'))
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => {
      const o = read(`content/observances/${f}`);
      return [o.id, o];
    })
);

if (observances.size !== resolvedDoc.observances)
  throw new Error(`runtime observance build: corpus/report drift (${observances.size} source vs ${resolvedDoc.observances} resolved)`);

const publishedStories = new Set(
  canon.filter(x => x.status === 'published').map(x => x.id)
);
const mappings = new Map(
  (mapDoc.mappings ?? []).map(m => [`${m.observanceId}|${m.storyId}`, m])
);
const resolvedById = new Map(
  (resolvedDoc.resolved ?? []).map(x => [x.id, x])
);

const allowed = new Map();
for (const pair of policy.selectionMappings ?? []) {
  const key = `${pair.observanceId}|${pair.storyId}`;
  const m = mappings.get(key);
  if (!m) throw new Error(`runtime observance policy references missing mapping ${key}`);
  if (!policy.allowedRelevance.includes(m.relevance))
    throw new Error(`runtime observance mapping ${key} has disallowed relevance ${m.relevance}`);
  if (!publishedStories.has(pair.storyId))
    throw new Error(`runtime observance mapping ${key} points to non-published story`);
  if (!['proposed','approved'].includes(m.status))
    throw new Error(`runtime observance mapping ${key} is ${m.status}`);
  if (!allowed.has(pair.observanceId)) allowed.set(pair.observanceId, []);
  allowed.get(pair.observanceId).push({
    storyId: pair.storyId,
    relevance: m.relevance,
    reason: m.reason
  });
}

function bestSource(o) {
  const s = (o.provenance?.sources ?? []).find(x => (x.supports ?? []).includes('rule'))
         ?? o.provenance?.sources?.[0];
  if (!s?.authority || !s?.url || !s?.citation)
    throw new Error(`${o.id}: runtime context needs authority + URL + citation`);
  return { authority: s.authority, url: s.url, citation: s.citation };
}

function legacyDateFor(slug, year) {
  const dates = [];
  for (const [date, row] of Object.entries(panchanga.days ?? {})) {
    if (!date.startsWith(`${year}-`)) continue;
    if ((row.festivals ?? []).includes(slug)) dates.push(date);
  }
  return dates;
}

const dates = {};
let agreed = 0;
let excludedDisagreements = 0;
let legacyConflicts = 0;

for (const [id, r] of resolvedById) {
  const o = observances.get(id);
  if (!o || !['sourced','approved'].includes(o.status)) continue;

  for (const check of r.crossChecks ?? []) {
    if (check.status !== 'agree') {
      excludedDisagreements += 1;
      continue;
    }

    const legacySlug = policy.legacyConsistency?.[id];
    if (legacySlug) {
      const legacy = legacyDateFor(legacySlug, check.year);
      if (legacy.length && !legacy.includes(check.verified)) {
        legacyConflicts += 1;
        continue;
      }
    }

    const date = check.verified;
    const item = {
      id,
      names: o.names,
      kind: o.kind,
      scope: o.scope,
      importance: o.importance,
      source: bestSource(o),
      stories: allowed.get(id) ?? []
    };
    if (!dates[date]) dates[date] = [];
    dates[date].push(item);
    agreed += 1;
  }
}

for (const list of Object.values(dates)) {
  list.sort((a,b) =>
    b.importance.score - a.importance.score ||
    a.names.en.localeCompare(b.names.en)
  );
}

const runtimeStoryMappings = [...allowed.values()].reduce((n, xs) => n + xs.length, 0);
const out = {
  schemaVersion: '1.0',
  meta: {
    generated: new Date().toISOString(),
    sourceObservances: observances.size,
    agreedDateInstances: agreed,
    excludedDateDisagreements: excludedDisagreements,
    legacyConflicts,
    runtimeStoryMappings
  },
  dates
};

mkdirSync(join(ROOT, 'public/data'), { recursive: true });
writeFileSync(join(ROOT, 'public/data/observances.json'), JSON.stringify(out));

console.log(`runtime observances: ${observances.size} source · ${agreed} agreed date instances`);
console.log(`runtime mappings: ${runtimeStoryMappings}`);
console.log(`excluded disputed instances: ${excludedDisagreements}`);
console.log(`excluded legacy conflicts: ${legacyConflicts}`);
