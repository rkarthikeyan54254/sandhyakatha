# Rambhā and Vedavatī — trilingual publication

Text approved by Rama on 3 November 2026 after reviewing the three-language packet. Reported Short 3 minutes and Full 6 minutes; these are user-reported whole-minute timings, not agent stopwatch measurements. Original reviewed bytes and hashes are retained in `approval.json`.

Two style-matched non-graphic illustrations were generated using built-in image_gen with existing Rāvaṇa illustrations as references. Prompts are in `art/prompts.json`; heroes are under `art/<story-id>/hero.png` and `hero.webp`. Six native share-card assets are under `og/`. Agent image QA is recorded honestly and is not a human image approval.

Both canonical stories and four locale siblings are registered, approved and locked. The exact reviewed parent ethical framing is carried into the reader as parent-only asides; narrated blocks remain unchanged. Canonical source-work metadata was normalized to the existing translated-label key; source locus is preserved, pins are rebound. See `promotion-record.json` and `evidence/release-checks.json`.

Strict validation, full build, native-language/locale parity/runtime gates and 22 suites / 198 tests passed. Read-aloud ages remain 15+ for Rambhā and 14+ for Vedavatī. Both remain gated: available through the app after parental opt-in, excluded from public archive, locale previews, public language shelves and sitemap. No persisted family/account code changed.

The original review documents describe the preparation stage and are frozen as evidence; their historical pending labels are superseded by the user approval receipt. `prepare.py` and `build-review.mjs` refuse regeneration over approval. `render-reader.mjs` creates local-only real Reader SSR pages for layout QA; these pages are not checked into public/ and must not be deployed.

Current release/deployment status and next action are recorded in `publication-receipt.json`.
