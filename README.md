# Sandhya Katha · संध्या कथा

**Six minutes at dusk. One story from the Itihāsas and Purāṇas, already chosen, already checked, and set out for a parent to read aloud.**

A chat window is a generator. At 8:40pm a parent does not want a generator — they want the one right story, without composing a prompt, without wondering whether the ending was invented, and with a reason to come back tomorrow.

## What makes this not a chatbot wrapper

1. **Every line has an address.** Work and locus are printed above the story. Where traditions diverge, the page says so — the squirrel on the Setu is not in Vālmīki, and we tell you that on the page.
2. **Written for a voice, not an eye.** Breath lines, printed pause beats, a final line flagged *slow down here*, tap-a-name pronunciation.
3. **It ends with a question, not a moral.** Plus a fallback line, and honest pre-written answers to the follow-ups children actually ask.
4. **It knows what day it is.** Tonight's pick runs against the pañcāṅga and the season.
5. **It remembers the child.** Characters accumulate into a map the child builds by listening, and the app can tell you a year later what you read on this night. Local-first; an optional Google or email-link sign-in keeps it when the browser clears its storage or you pick up another phone. Read PRIVACY.md for exactly what that stores — it is a first name, an age and a list of nights.
6. **Nothing is generated while you wait.** The corpus is drafted, source-checked, reviewed and versioned before it ships — which is why it is instant, works offline, gives the same story twice, and cannot invent a Purāṇa at bedtime.

## Getting started

Copy `.env.example` to `.env` if you want account sync locally; without it the
app runs local-first and the account panel hides itself.

```bash
npm install
npm run validate     # check the corpus
npm run dev          # builds the content index, then serves
npm test             # the night picker's rules
```

`npm run build` runs `validate:strict` first. **A story that fails validation fails the deploy.** That is deliberate.

## Layout

```
content/
  canon.json          every story in the collection, planned or written
  lexicon.json        one entry per name — native script, respelling, IPA, gloss
  values.json         the controlled vocabulary of browsable facets
  content.lock.json   text hashes of published stories; guards silent edits
  stories/<id>.json   the unit of publication
schema/story.schema.json
scripts/
  validate.mjs        the rules that keep us from mistelling a story
  lock.mjs            re-freeze after an approved change
  build-index.mjs     compile content/ into what the app ships
  render-audio.mjs    the TTS contract (script substitution + prosody), vendor-free
studio/PIPELINE.md    the nine stages that produce one story
src/lib/picker.ts     the "why tonight" engine — pure, deterministic, tested
src/lib/panchanga.ts  interface only; wire to NalNaal's ephemeris
src/lib/profile.ts    the family's state — children, nights heard, merge, stats
src/lib/sync.ts       optional account sync; a no-op until the env vars exist
supabase/migrations/  the one table an account needs
```

## Content workflow

One story per pull request, using the story PR template. `npm run validate` must be clean and `npm run lock` committed alongside. `content/stories/` is CODEOWNED — no story reaches `main` without a human who can read the source.

Read **EDITORIAL.md** before writing one. It is short and it is the actual product.

## Deploying

Netlify, `main` branch, `npm run build` → `dist`. Config is in `netlify.toml`, including the CSP and cache headers. Pull requests get deploy previews; a corpus error fails the preview too.

## Licensing

Code: MIT. **Story text: all rights reserved** — it is written, not compiled from anywhere, and it is the whole asset. Source works are out of copyright; the translations and editions consulted are named per story in `source.checkedAgainst` and are used for verification only, never reproduced.
