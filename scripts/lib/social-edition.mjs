import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { audienceText } from './lexicon-display.mjs';
import { gitBlobSha1, localeContentHash } from './locale-content.mjs';
import { socialLocalePolicy } from './social-locale-policy.mjs';

const read = (root, rel) =>
  JSON.parse(readFileSync(join(root, rel), 'utf8'));

function localePlain(value, localeDoc) {
  return String(value ?? '')
    .replace(/«([^»]+)»/g, (_m, key) => localeDoc.displayNames?.[key] ?? key)
    .replace(/_/g, '')
    .trim();
}

function firstSentence(text, separator) {
  const parts = String(text ?? '')
    .split(separator)
    .map(value => value.trim())
    .filter(Boolean);
  return parts[0] ?? String(text ?? '').trim();
}

function choose(text, selector, plain, separator) {
  const value = plain(text);
  const parts = value.split(separator).map(x => x.trim()).filter(Boolean);
  const mode = selector?.mode ?? 'full';
  if (mode === 'full') return value;
  if (mode === 'firstSentence') return parts[0] ?? value;
  if (mode === 'sentence') {
    const n = selector?.sentence;
    if (!Number.isInteger(n) || n < 1 || !parts[n - 1])
      throw new Error(`requested sentence ${n} does not exist`);
    return parts[n - 1];
  }
  throw new Error(`unsupported selector mode: ${mode}`);
}

function assertPublishedStory(story) {
  if (story.status !== 'published')
    throw new Error(`${story.id}: story is not published`);
  if (story.audience?.gated)
    throw new Error(`${story.id}: gated story may not enter public campaign output`);
}

function englishEdition({ root, id }) {
  const story = read(root, `content/stories/${id}.json`);
  assertPublishedStory(story);
  const lex = read(root, 'content/lexicon.json');
  const canon = read(root, 'content/canon.json').canon ?? [];
  const social = read(root, 'content/social.json').stories ?? {};
  const spec = social[id]?.reel;
  if (!spec?.blocks?.length)
    throw new Error(`${id}: no curated English reel selectors in content/social.json`);

  const policy = socialLocalePolicy('en');
  const plain = value => audienceText(String(value ?? ''), lex).trim();
  const canonRow = canon.find(row => row.id === id);
  const hookSpec = spec.hook ?? { from:'canon', mode:'firstSentence' };
  let rawHook;
  if (hookSpec.from === 'title') rawHook = story.title;
  else if (hookSpec.from === 'tease') rawHook = story.tease;
  else rawHook = canonRow?.hook || story.tease;
  const hook = choose(rawHook, hookSpec, plain, policy.sentenceSeparator);

  const narrative = story.lengths.short.blocks.filter(
    block => block.t === 'p' || block.t === 'slow'
  );
  const bodies = spec.blocks.map((selector, i) => {
    const block = narrative[selector.index];
    if (!block)
      throw new Error(`${id}: English selector ${i + 1} index ${selector.index} missing`);
    return {
      text: choose(block.text, selector, plain, policy.sentenceSeparator),
      selector,
      scene: block.scene ?? null
    };
  });

  return {
    id,
    locale: 'en',
    language: 'en',
    publicPath: `/s/${id}/`,
    story,
    localeDoc: null,
    policy,
    title: plain(story.title),
    tease: plain(story.tease),
    hook,
    bodies,
    closeQuestion: plain(story.close.question),
    sourceWork: story.source.work,
    sourceLocus: story.source.locus,
    sourceNote: firstSentence(
      plain(story.source.traditionNote ?? ''),
      policy.sentenceSeparator
    ),
    selectorSpec: spec,
    provenance: {
      kind: 'canonical',
      storyVersion: story.version
    }
  };
}

function localeEdition({ root, id, locale }) {
  const policy = socialLocalePolicy(locale);
  const storyRel = `content/stories/${id}.json`;
  const storyPath = join(root, storyRel);
  if (!existsSync(storyPath)) throw new Error(`${id}: canonical story missing`);
  const storyRaw = readFileSync(storyPath, 'utf8');
  const story = JSON.parse(storyRaw);
  assertPublishedStory(story);

  const localeRel = `content/locales/${policy.language}/${id}.json`;
  if (!existsSync(join(root, localeRel)))
    throw new Error(`${locale}/${id}: locale document missing`);
  const localeDoc = read(root, localeRel);
  const lock = read(root, 'content/locale.lock.json');
  const publicConfig = read(root, 'content/locale-public.json');
  const socialLocales = read(root, 'content/social-locales.json');
  const spec = socialLocales.locales?.[locale]?.stories?.[id];

  if (!spec?.blocks?.length)
    throw new Error(`${locale}/${id}: no curated locale social selectors`);
  if (localeDoc.status !== 'approved')
    throw new Error(`${locale}/${id}: locale is not approved`);
  if (localeDoc.sourceVersion !== story.version)
    throw new Error(`${locale}/${id}: locale sourceVersion mismatch`);
  if (localeDoc.sourceBlobSha1 !== gitBlobSha1(storyRaw))
    throw new Error(`${locale}/${id}: locale is not pinned to current canonical source bytes`);
  const lockKey = `${locale}/${id}`;
  const locked = lock.locales?.[lockKey];
  if (!locked || locked.hash !== localeContentHash(localeDoc))
    throw new Error(`${lockKey}: locale lock does not match reviewed bytes`);
  if (!(publicConfig.editions ?? []).some(
    row => row.locale === locale && row.storyId === id
  )) throw new Error(`${lockKey}: locale is not on the public allowlist`);

  const reviewChecks = [
    localeDoc.review?.nativeReadAloud?.short?.status,
    localeDoc.review?.languageEditor?.status,
    localeDoc.review?.sourceFidelity?.status
  ];
  if (reviewChecks.some(status => status !== 'approved'))
    throw new Error(`${lockKey}: all human review gates must be approved`);

  const plain = value => localePlain(value, localeDoc);
  const hookSpec = spec.hook ?? { from:'tease', mode:'firstSentence' };
  if (!['title', 'tease'].includes(hookSpec.from))
    throw new Error(`${lockKey}: locale hook may come only from title or tease`);
  const rawHook = hookSpec.from === 'title' ? localeDoc.title : localeDoc.tease;
  const hook = choose(rawHook, hookSpec, plain, policy.sentenceSeparator);

  const narrative = localeDoc.lengths.short.blocks.filter(
    block => block.t === 'p' || block.t === 'slow'
  );
  const bodies = spec.blocks.map((selector, i) => {
    const block = narrative[selector.index];
    if (!block)
      throw new Error(`${lockKey}: selector ${i + 1} index ${selector.index} missing`);
    return {
      text: choose(block.text, selector, plain, policy.sentenceSeparator),
      selector,
      scene: block.scene ?? null
    };
  });

  return {
    id,
    locale,
    language: policy.language,
    publicPath: `/s/${id}/${policy.language}/`,
    story,
    localeDoc,
    policy,
    title: plain(localeDoc.title),
    tease: plain(localeDoc.tease),
    hook,
    bodies,
    closeQuestion: plain(localeDoc.close.question),
    sourceWork: story.source.work,
    sourceLocus: story.source.locus,
    sourceNote: firstSentence(
      plain(localeDoc.traditionNote ?? ''),
      policy.sentenceSeparator
    ),
    selectorSpec: spec,
    provenance: {
      kind: 'reviewed-locale',
      storyVersion: story.version,
      sourceVersion: localeDoc.sourceVersion,
      sourceBlobSha1: localeDoc.sourceBlobSha1,
      localeHash: locked.hash
    }
  };
}

export function resolveSocialEdition({ root, id, locale = 'en' }) {
  const normalized = locale === 'en-US' ? 'en' : locale;
  return normalized === 'en'
    ? englishEdition({ root, id })
    : localeEdition({ root, id, locale: normalized });
}

export function campaignLocalesForStory({ root, id, requestedLocale = null }) {
  if (requestedLocale) return [requestedLocale === 'en-US' ? 'en' : requestedLocale];
  const publicConfig = read(root, 'content/locale-public.json');
  const locales = (publicConfig.editions ?? [])
    .filter(row => row.storyId === id)
    .map(row => row.locale)
    .sort();
  return ['en', ...new Set(locales)];
}
