import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { REEL_STYLE as S } from './reel-style.mjs';

const words = text =>
  String(text).trim() ? String(text).trim().split(/\s+/).length : 0;

export function gatePlan({ root, story, spec, heroUrl, cards }) {
  const errors = [];
  const fail = msg => errors.push(msg);

  if (S.id !== 'sandhya-reel-v1')
    fail(`template id changed: ${S.id}`);

  const requiredFonts = [
    'GentiumBookPlus-Regular.ttf',
    'GentiumBookPlus-Bold.ttf',
    'Karla-var.ttf'
  ];
  for (const f of requiredFonts) {
    if (!existsSync(join(root, 'assets', 'fonts', f)))
      fail(`required brand font missing: assets/fonts/${f}`);
  }

  if (story.status !== 'published')
    fail('story is not published');

  if (!heroUrl)
    fail('published reel requires an approved exact-version hero');

  if (!spec?.blocks?.length)
    fail('no curated reel block selection in content/social.json');
  else if (
    spec.blocks.length < S.minBodyCards ||
    spec.blocks.length > S.maxBodyCards
  ) {
    fail(
      `curated reel needs ${S.minBodyCards}-${S.maxBodyCards} body cards; ` +
      `found ${spec.blocks.length}`
    );
  }

  const coverCards = cards.filter(c => c.role === 'cover');
  const heroCards = cards.filter(c => c.role === 'hero');
  const bodyCards = cards.filter(c => c.role === 'body');
  const sourceCards = cards.filter(c => c.role === 'source');
  const ctaCards = cards.filter(c => c.role === 'cta');

  if (coverCards.length !== 1 || cards[0]?.role !== 'cover')
    fail('exactly one cover is required, and it must be card 1');
  if (heroCards.length !== 1 || cards[1]?.role !== 'hero')
    fail('exactly one clean hero image card is required, and it must be card 2');
  if (bodyCards.length !== spec?.blocks?.length)
    fail('body card count does not match curated source selection');
  if (sourceCards.length !== 1)
    fail('exactly one source card is required');
  if (ctaCards.length !== 1 || cards.at(-1)?.role !== 'cta')
    fail('exactly one CTA is required, and it must be last');

  const seen = new Set();
  for (const [i, c] of cards.entries()) {
    if (c.role === 'cover') {
      if (words(c.text) > S.maxHookWords)
        fail(`card ${i + 1} hook is ${words(c.text)} words; max ${S.maxHookWords}`);
      if (c.lines.length > S.maxLines)
        fail(`card ${i + 1} hook is ${c.lines.length} lines; max ${S.maxLines}`);
    }

    if (c.role === 'hero') {
      if (c.text !== '' || c.lines.length !== 0)
        fail(`card ${i + 1} hero must contain no story text`);
    }

    if (c.role === 'body') {
      if (words(c.text) > S.maxBodyWords)
        fail(`card ${i + 1} body is ${words(c.text)} words; max ${S.maxBodyWords}`);
      if (c.lines.length > S.maxLines)
        fail(`card ${i + 1} body is ${c.lines.length} lines; max ${S.maxLines}`);
      if (seen.has(c.text))
        fail(`card ${i + 1} duplicates an earlier body card`);
      seen.add(c.text);
      if (/[«»_]/.test(c.text))
        fail(`card ${i + 1} leaked story markup`);
    }

    if (c.role === 'source') {
      if (words(c.text) > S.maxSourceWords)
        fail(`source card is ${words(c.text)} words; max ${S.maxSourceWords}`);
      if (c.lines.length > S.maxSourceLines)
        fail(`source card is ${c.lines.length} lines; max ${S.maxSourceLines}`);
    }

    if (c.role === 'cta') {
      if (words(c.text) > S.maxCtaWords)
        fail(`CTA is ${words(c.text)} words; max ${S.maxCtaWords}`);
      if (c.lines.length > S.maxLines)
        fail(`CTA is ${c.lines.length} lines; max ${S.maxLines}`);
    }
  }

  for (const [i, b] of (spec?.blocks ?? []).entries()) {
    if (!Number.isInteger(b.index) || b.index < 0)
      fail(`reel block ${i + 1} has invalid index`);
    if (!['full', 'firstSentence', 'sentence'].includes(b.mode ?? 'full'))
      fail(`reel block ${i + 1} has unsupported mode ${b.mode}`);
    if ((b.mode === 'sentence') && (!Number.isInteger(b.sentence) || b.sentence < 1))
      fail(`reel block ${i + 1} sentence mode needs a 1-based sentence number`);

    for (const forbidden of ['text', 'font', 'fontFamily', 'color', 'x', 'y']) {
      if (Object.prototype.hasOwnProperty.call(b, forbidden))
        fail(`reel block ${i + 1} may not override ${forbidden}`);
    }
  }

  const hook = spec?.hook;
  if (hook) {
    if (!['canon', 'title', 'tease'].includes(hook.from))
      fail(`hook.from must be canon, title or tease; found ${hook.from}`);
    if (!['full', 'firstSentence'].includes(hook.mode ?? 'full'))
      fail(`hook.mode must be full or firstSentence`);
    if (Object.prototype.hasOwnProperty.call(hook, 'text'))
      fail('hook may not contain arbitrary text');
  }

  if (errors.length) {
    for (const e of errors) console.error(`FAIL reel gate: ${e}`);
    throw new Error(`reel gate failed with ${errors.length} error(s)`);
  }

  return [
    'source integrity',
    'approved cover + clean hero image',
    'curated card count',
    'brand typography',
    'brand palette/layout',
    'mobile text density',
    'source card',
    'website CTA'
  ];
}

export function gateRendered(mp4) {
  const probe = JSON.parse(execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4],
    { encoding: 'utf8' }
  ));

  const video = probe.streams.find(s => s.codec_type === 'video');
  const audio = probe.streams.find(s => s.codec_type === 'audio');
  const errors = [];

  if (!video) errors.push('render has no video stream');
  else {
    if (+video.width !== S.width || +video.height !== S.height)
      errors.push(`render is ${video.width}x${video.height}, expected ${S.width}x${S.height}`);
  }
  if (audio) errors.push('reel must be silent; audio stream found');

  const duration = Number(probe.format?.duration ?? 0);
  if (!(duration >= 12 && duration <= 35))
    errors.push(`duration ${duration.toFixed(1)}s is outside 12-35s`);

  if (errors.length) {
    for (const e of errors) console.error(`FAIL rendered reel gate: ${e}`);
    throw new Error(`rendered reel gate failed with ${errors.length} error(s)`);
  }

  return { duration };
}
