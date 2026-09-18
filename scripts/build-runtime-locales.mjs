#!/usr/bin/env node
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { approvedHeroUrl } from './lib/media.mjs';
import { gitBlobSha1, localeContentHash } from './lib/locale-content.mjs';
import { localeLanguage, publicLocaleHref } from './lib/locale-paths.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const raw = rel => readFileSync(join(ROOT, rel), 'utf8');

const cfg = read('content/locale-public.json');
const lock = read('content/locale.lock.json');
const media = read('content/media.json').stories ?? {};
const landings = cfg.landings ?? (cfg.landing ? [cfg.landing] : []);
const OUT = join(ROOT, 'public', 'data', 'l');

rmSync(OUT, { recursive:true, force:true });
mkdirSync(OUT, { recursive:true });

const catalog = { schemaVersion:'1.0', locales:{} };

for (const landing of landings) {
  catalog.locales[landing.locale] = {
    locale:landing.locale,
    language:landing.language ?? localeLanguage(landing.locale),
    label:landing.label,
    path:landing.path,
    stories:[]
  };
}

for (const pub of cfg.editions ?? []) {
  const lang = localeLanguage(pub.locale);
  const key = `${pub.locale}/${pub.storyId}`;
  const storyRel = `content/stories/${pub.storyId}.json`;
  const localeRel = `content/locales/${lang}/${pub.storyId}.json`;
  const storyText = raw(storyRel);
  const story = JSON.parse(storyText);
  const doc = read(localeRel);
  const locked = lock.locales?.[key];
  const landing = catalog.locales[pub.locale];

  if (!landing) throw new Error(`${key}: public locale has no discovery landing`);
  if (story.status !== 'published' || story.audience?.gated)
    throw new Error(`${key}: canonical story is not public-runtime eligible`);
  if (doc.status !== 'approved')
    throw new Error(`${key}: locale is not approved`);
  if (doc.storyId !== story.id || doc.locale !== pub.locale)
    throw new Error(`${key}: locale identity mismatch`);
  if (doc.sourceVersion !== story.version)
    throw new Error(`${key}: source version mismatch`);
  if (doc.sourceBlobSha1 !== gitBlobSha1(storyText))
    throw new Error(`${key}: locale is not pinned to current canonical bytes`);
  if (!locked || locked.status !== 'approved' || locked.hash !== localeContentHash(doc))
    throw new Error(`${key}: locale lock does not match reviewed bytes`);

  const reviews = [
    doc.review?.nativeReadAloud?.short,
    doc.review?.languageEditor,
    doc.review?.sourceFidelity
  ];
  if (reviews.some(r => r?.status !== 'approved' || !r.reviewer || !r.reviewedOn))
    throw new Error(`${key}: human review gates are incomplete`);
  const measuredSeconds = doc.lengths?.short?.measuredSeconds;
  if (!Number.isInteger(measuredSeconds) || measuredSeconds <= 0)
    throw new Error(`${key}: measured read-aloud seconds missing`);

  const hero = approvedHeroUrl({ root:ROOT, story, media });
  const minutes = Math.max(1, Math.round(measuredSeconds / 60));
  const publicPath = publicLocaleHref(story.id, pub.locale);

  const builtStory = {
    ...story,
    title:doc.title,
    tease:doc.tease,
    locale:doc.locale,
    language:doc.language,
    publicPath,
    displayNames:doc.displayNames,
    source:{ ...story.source, traditionNote:doc.traditionNote },
    audience:{ ...story.audience, careNote:doc.parentNote },
    lengths:{
      short:{
        minutes,
        measuredSeconds,
        blocks:doc.lengths.short.blocks
      }
    },
    close:doc.close,
    ...(hero ? { hero } : {})
  };

  const builtJson = JSON.stringify(builtStory);
  const storyRevision = createHash('sha256').update(builtJson).digest('hex').slice(0,12);
  const dir = join(OUT, lang);
  mkdirSync(dir, { recursive:true });
  writeFileSync(join(dir, `${story.id}.json`), builtJson);

  landing.stories.push({
    id:story.id,
    title:doc.title,
    tease:doc.tease,
    minutes,
    storyRevision,
    publicPath
  });
}

writeFileSync(join(ROOT, 'public', 'data', 'locale-catalog.json'), JSON.stringify(catalog));
const total = Object.values(catalog.locales).reduce((sum, locale) => sum + locale.stories.length, 0);
console.log(`runtime locales: ${total} reviewed public edition(s) across ${Object.keys(catalog.locales).length} language shelf(s)`);
