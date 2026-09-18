#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { CACHE_NAMES, RUNTIME_CACHING } from './lib/cache-policy.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const dist = join(ROOT, 'dist');
const errors = [];
const fail = msg => errors.push(msg);

function routeByCacheName(name) {
  return RUNTIME_CACHING.find(r => r.options?.cacheName === name);
}

function assertNetworkFirst(route, label, expectedCache) {
  if (!route) return fail(`${label}: route is missing`);
  if (route.handler !== 'NetworkFirst')
    fail(`${label}: expected NetworkFirst, found ${route.handler}`);
  if (route.options?.cacheName !== expectedCache)
    fail(`${label}: expected cache ${expectedCache}, found ${route.options?.cacheName}`);
  const timeout = route.options?.networkTimeoutSeconds;
  if (!(Number.isFinite(timeout) && timeout > 0 && timeout <= 5))
    fail(`${label}: networkTimeoutSeconds must be between 1 and 5`);
}

assertNetworkFirst(routeByCacheName(CACHE_NAMES.stories), 'story JSON', CACHE_NAMES.stories);
assertNetworkFirst(routeByCacheName(CACHE_NAMES.corpus), 'index/lexicon JSON', CACHE_NAMES.corpus);

const storyRoute = routeByCacheName(CACHE_NAMES.stories);
if (storyRoute && !String(storyRoute.urlPattern).includes('v=[a-f0-9]{12}'))
  fail('story JSON: route does not recognize content-revision query URLs');

const art = routeByCacheName(CACHE_NAMES.art);
if (!art) fail('story art: route is missing');
else {
  if (art.handler !== 'CacheFirst')
    fail(`story art: expected CacheFirst, found ${art.handler}`);
  if (!String(art.urlPattern).includes('v=[a-f0-9]{12}'))
    fail('story art: route does not recognize content-hash query URLs');
}

const netlify = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
const requiredHeaderBlocks = [
  ['story JSON', 'for = "/data/s/*"', 'Cache-Control = "public, max-age=0, must-revalidate"'],
  ['locale story JSON', 'for = "/data/l/*"', 'Cache-Control = "public, max-age=0, must-revalidate"'],
  ['locale catalog', 'for = "/data/locale-catalog.json"', 'Cache-Control = "public, max-age=0, must-revalidate"'],
  ['index JSON', 'for = "/data/index.json"', 'Cache-Control = "public, max-age=0, must-revalidate"'],
  ['lexicon JSON', 'for = "/data/lexicon.json"', 'Cache-Control = "public, max-age=0, must-revalidate"'],
  ['public story pages', 'for = "/s/*"', 'Cache-Control = "public, max-age=0, must-revalidate"'],
  ['service worker', 'for = "/sw.js"', 'Cache-Control = "no-cache"'],
  ['service worker register', 'for = "/registerSW.js"', 'Cache-Control = "no-cache"']
];

for (const [label, selector, policy] of requiredHeaderBlocks) {
  const at = netlify.indexOf(selector);
  if (at < 0) { fail(`${label}: Netlify header block missing`); continue; }
  const next = netlify.indexOf('[[headers]]', at + selector.length);
  const block = netlify.slice(at, next < 0 ? netlify.length : next);
  if (!block.includes(policy))
    fail(`${label}: expected ${policy}`);
}

if (!existsSync(join(dist, 'sw.js')))
  fail('dist/sw.js missing — run the full build before cache gates');
else {
  const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
  for (const name of [CACHE_NAMES.stories, CACHE_NAMES.corpus, CACHE_NAMES.art]) {
    if (!sw.includes(name)) fail(`generated sw.js does not contain runtime cache ${name}`);
  }
}

const indexPath = join(dist, 'data', 'index.json');
if (!existsSync(indexPath)) fail('dist/data/index.json missing');
else {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  let heroes = 0;

  for (const card of index.stories ?? []) {
    const storyPath = join(dist, 'data', 's', `${card.id}.json`);
    if (!existsSync(storyPath)) {
      fail(`${card.id}: built story JSON missing`);
      continue;
    }

    const storyJson = readFileSync(storyPath, 'utf8');
    const expectedRevision = createHash('sha256').update(storyJson).digest('hex').slice(0, 12);
    if (!/^[a-f0-9]{12}$/.test(card.storyRevision ?? ''))
      fail(`${card.id}: index has invalid storyRevision ${card.storyRevision ?? 'missing'}`);
    else if (card.storyRevision !== expectedRevision)
      fail(`${card.id}: storyRevision does not match built story JSON`);

    if (!card.hero) continue;
    heroes += 1;

    if (!/\/media\/stories\/[^/]+\/hero\.webp\?v=[a-f0-9]{12}$/.test(card.hero))
      fail(`${card.id}: hero is not content-addressed: ${card.hero}`);

    const story = JSON.parse(storyJson);
    if (story.hero !== card.hero)
      fail(`${card.id}: card hero and story hero differ`);

    const raw = card.hero.split('?')[0];
    if (!existsSync(join(dist, raw.replace(/^\/+/, ''))))
      fail(`${card.id}: content-addressed hero points at missing file ${raw}`);
  }

  if (heroes === 0)
    fail('no content-addressed heroes found in built index');
}

const appSource = readFileSync(join(ROOT, 'src', 'App.tsx'), 'utf8');
if (!appSource.includes('card?.storyRevision') || !appSource.includes('.json?v=${card.storyRevision}'))
  fail('App reader does not request content-revisioned story JSON');
for (const retired of ['stories', 'corpus', 'story-art', 'stories-v2', 'corpus-v2']) {
  if (!appSource.includes(`'${retired}'`))
    fail(`App cache migration does not retire ${retired}`);
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR cache gate: ${e}`);
  console.error(`FAILED — ${errors.length} cache correctness error(s)`);
  process.exit(1);
}

console.log(
  `cache gates: PASS — editorial JSON is network-first/revalidated; ` +
  `story JSON is content-revisioned; art is content-addressed; runtime caches are ${CACHE_NAMES.stories}, ${CACHE_NAMES.corpus}, ${CACHE_NAMES.art}`
);
