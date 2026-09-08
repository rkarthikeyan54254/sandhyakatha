#!/usr/bin/env node
/**
 * Speech rendering — the contract, not the vendor.
 *
 * Deliberately written before a TTS engine is chosen, because the two things
 * that are expensive to change later are both decided here:
 *   1. native-script substitution (Latin IAST is mispronounced by every Indic engine)
 *   2. how a `beat` and a `slow` block become silence and pace
 *
 * Swap `synthesize()` for Sarvam, ElevenLabs or anything else and nothing above it moves.
 *
 *   node scripts/render-audio.mjs <story-id> --lang ta --dry
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const SCRIPT_FOR = { hi: 'deva', mr: 'deva', sa: 'deva', ta: 'taml', en: 'deva' };
export const PROSODY = { beatMs: 900, slowRate: 0.85, paraGapMs: 400, baseRate: 0.95 };

/** Replace «Term» with the term in the script the voice actually reads correctly. */
export function forSpeech(text, lexicon, lang = 'en') {
  const want = SCRIPT_FOR[lang] ?? 'deva';
  return text
    .replace(/«([^»]+)»/g, (_, term) => {
      const e = lexicon[term];
      if (!e) throw new Error(`«${term}» missing from the lexicon — refusing to render`);
      return e.native?.[want] ?? e.native?.deva ?? term;
    })
    .replace(/_([^_]+)_/g, '$1');
}

export function toSSML(rendition, lexicon, lang = 'en') {
  const body = rendition.blocks.map(b => {
    if (b.t === 'beat') return `<break time="${PROSODY.beatMs}ms"/>`;
    const said = forSpeech(b.text, lexicon, lang);
    return b.t === 'slow'
      ? `<prosody rate="${PROSODY.slowRate}">${said}</prosody><break time="${PROSODY.beatMs}ms"/>`
      : `<s>${said}</s><break time="${PROSODY.paraGapMs}ms"/>`;
  }).join('\n');
  return `<speak><prosody rate="${PROSODY.baseRate}">\n${body}\n</prosody></speak>`;
}

async function synthesize() {
  throw new Error('No TTS engine wired up yet. Implement synthesize() and set the engine name in audio[].engine.');
}

const [id] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (id) {
  const lang = (process.argv[process.argv.indexOf('--lang') + 1] ?? 'en').replace(/^--.*/, 'en');
  const story = read(`content/stories/${id}.json`);
  const lex = read('content/lexicon.json');
  for (const [len, r] of Object.entries(story.lengths)) {
    console.log(`\n--- ${id} [${len}] lang=${lang} ---\n${toSSML(r, lex, lang)}`);
  }
  if (!process.argv.includes('--dry')) await synthesize();
}
