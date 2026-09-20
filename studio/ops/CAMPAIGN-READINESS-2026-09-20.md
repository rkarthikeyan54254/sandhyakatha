# September 20 campaign readiness — Hanuman Tail

Status: **English, Hindi and Tamil packages generated, mechanically checked, and approved by Rama after reviewing the unified page on September 20. Live-channel reconciliation remains before posting. No publication performed.**

## Latest repository checkpoint

- Branch: `main`
- Local and `origin/main`: `3b70559586c5a0d5dbbbf5ff655a2c689bc29743` — `Add bilingual batch 2 and native-language moat`
- Public locale corpus: 22 approved editions — 11 Hindi and 11 Tamil.
- New bilingual batch: `guha-boatman`, `jatayu-last-flight`, `hanuman-tail`, `birds-eye`, and `karna-armour`; `squirrel-setu` was added in the preceding commit.

## Validation

- `npm run validate:locales`: PASS — 22 editions, 22 approved, zero warnings.
- `npm run verify:native-language`: PASS — native-first policy present, known translation regressions absent, approved language editors human.
- `npm run campaign:check -- hanuman-tail`: PASS for `en`, `hi-IN`, and `ta-IN`, including browser-native Hindi/Tamil shaping.
- `npm run build`: PASS — strict validation, runtime generation, typecheck, production bundle, 61 canonical story pages, 22 locale preview pages, 22 public locale pages and all surface/cache gates.
- `npm test`: PASS — 14 files, 137 tests.
- Local and origin heads match; tracked working tree was clean before local ignored campaign generation.

## Campaign package

- Unified review: `social/campaigns/hanuman-tail/review.html`
- Manifest: `social/campaigns/hanuman-tail/manifest.json`
- Posting checklist: `social/campaigns/hanuman-tail/POSTING-CHECKLIST.txt`
- Editions: `en`, `hi-IN`, `ta-IN`
- Each edition contains Instagram reel/cover/carousel/copy, Facebook reel/cover/carousel/copy, YouTube Short/title/description, and WhatsApp reel/share image/copy.
- Each reel is 24.3 seconds, 1080×1920 and silent. Each carousel has nine square slides.

## Visual and tracking review

Agent contact-sheet inspection covered all 27 reel cards and all 27 carousel slides. Text is visible, complex-script shaping is intact, source and CTA cards are legible, and no clipping or overlap was seen. Rama then reviewed the unified campaign page and confirmed that all three editions looked good, satisfying the campaign's human visual/language review gate.

All checked links go directly to the matching public edition:

- English: `/s/hanuman-tail/`
- Hindi: `/s/hanuman-tail/hi/`
- Tamil: `/s/hanuman-tail/ta/`

Platform source/medium and `utm_content` distinguish platform and locale. The production build contains all three landing pages locally. Live production availability remains to be checked in the browser.

## Remaining exact gate

Inspect actual scheduled/live channel content once, verify the three live landing pages, and publish/record one channel at a time when explicitly authorized. Store every public URL, timestamp and tracked destination under `studio/ops/`.
