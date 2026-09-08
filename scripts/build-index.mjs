#!/usr/bin/env node
/** Compiles content/ into what the app actually ships:
 *    public/data/index.json    every story's card data, no bodies (small, always cached)
 *    public/data/s/<id>.json   one story with its bodies, fetched on demand
 *    public/data/lexicon.json  pronunciation and glosses
 *  Gated stories are included but flagged; the client decides whether to show them. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
mkdirSync(join(ROOT, 'public/data/s'), { recursive: true });

const canon = read('content/canon.json').canon;
const index = [];
for (const f of readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json')).sort()) {
  const s = read(`content/stories/${f}`);
  if (s.status !== 'published') continue;
  writeFileSync(join(ROOT, `public/data/s/${s.id}.json`), JSON.stringify(s));
  index.push({
    id: s.id, title: s.title, tease: s.tease, version: s.version,
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
console.log(`index: ${index.length} published of ${canon.length} planned`);
