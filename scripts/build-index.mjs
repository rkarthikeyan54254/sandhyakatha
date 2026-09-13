#!/usr/bin/env node
/** Compiles content/ into what the app actually ships:
 *    public/data/index.json    every story's card data, no bodies (small, always cached)
 *    public/data/s/<id>.json   one story with its bodies, fetched on demand
 *    public/data/lexicon.json  pronunciation and glosses
 *  Gated stories are included but flagged; the client decides whether to show them. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
mkdirSync(join(ROOT, 'public/data/s'), { recursive: true });

const canon = read('content/canon.json').canon;
const media = read('content/media.json').stories ?? {};

function approvedHero(s) {
  const m = media[s.id];
  if (!m || m.image?.status !== 'approved') return null;
  if (m.storyVersion !== s.version) {
    console.warn(`media: ${s.id} hero approved for v${m.storyVersion ?? 'none'}, story is v${s.version}; omitting image`);
    return null;
  }
  const file = m.image.file;
  if (typeof file !== 'string' || !file.startsWith('/media/stories/')) {
    console.warn(`media: ${s.id} has an invalid hero path; omitting image`);
    return null;
  }
  if (!existsSync(join(ROOT, 'public', file.replace(/^\//, '')))) {
    console.warn(`media: ${s.id} approved hero file is missing; omitting image`);
    return null;
  }
  return file;
}

const index = [];
for (const f of readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json')).sort()) {
  const s = read(`content/stories/${f}`);
  if (s.status !== 'published') continue;
  const hero = approvedHero(s);
  writeFileSync(join(ROOT, `public/data/s/${s.id}.json`), JSON.stringify({
    ...s, ...(hero ? { hero } : {})
  }));
  index.push({
    id: s.id, title: s.title, tease: s.tease, version: s.version, ...(hero ? { hero } : {}),
    corpus: s.source.corpus, tradition: s.source.tradition, work: s.source.work,
    locus: s.source.locus, stability: s.source.stability,
    minAge: s.audience.minAge, sensitivity: s.audience.sensitivity ?? [],
    gated: !!s.audience.gated, careNote: s.audience.careNote ?? null,
    values: s.values, calendar: s.calendar ?? {},
    characters: s.characters.filter(c => c.role !== 'mentioned').map(c => c.ref),
    minutes: Object.fromEntries(Object.entries(s.lengths).map(([k, v]) => [k, v.minutes])),
    linked: s.linked ?? null
  });
}
writeFileSync(join(ROOT, 'public/data/index.json'), JSON.stringify({
  built: new Date().toISOString(), published: index.length, planned: canon.length, stories: index
}));
writeFileSync(join(ROOT, 'public/data/lexicon.json'), JSON.stringify(read('content/lexicon.json')));
// The shelf shows the whole collection, written or not — a parent should be able
// to see what is coming, and an honest empty shelf is worse than an honest plan.
writeFileSync(join(ROOT, 'public/data/canon.json'), JSON.stringify(read('content/canon.json').canon));
writeFileSync(join(ROOT, 'public/data/relations.json'), JSON.stringify(read('content/relations.json')));
// The pañcāṅga table — generated offline by scripts/panchanga.py, shipped whole
// so the picker never waits on an ephemeris and still works offline.
writeFileSync(join(ROOT, 'public/data/panchanga.json'), JSON.stringify(read('content/panchanga.json')));
console.log(`index: ${index.length} published of ${canon.length} planned`);
