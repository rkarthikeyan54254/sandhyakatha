# Five lesser-heard stories — complete review package

Date: 2026-10-04. Branch: `codex/deep-five-2026-10-04`. Draft PR: [#31](https://github.com/rkarthikeyan54254/sandhyakatha/pull/31).

The single [review page](review.html) presents five source-grounded stories in English, Hindi and Tamil: 15 editions, each with short and full read-aloud drafts, parent notes and source links. It also displays five story-specific hero candidates and five dedicated 1200×630 OG review cards. `review-data.json` records hashes for the exact reviewed text and images. These are review candidates, not published content.

| Story | Primary witness | English short/full words | Care focus |
| --- | --- | ---: | --- |
| Nṛga in the well | *Bhāgavata Purāṇa* 10.64 | 308 / 650 | No invented curse or easy verdict; caste-specific warning explained to parents |
| Indra and Virocana | *Chāndogya Upaniṣad* 8.7–12 | 322 / 657 | Four teaching stages; bodily change is not human worth |
| Dharma-vyādha | *Mahābhārata*, Vana Parva | 300 / 651 | Meat trade and inherited work retained without endorsing hierarchy |
| Maināka's welcome | Vālmīki *Rāmāyaṇa*, Sundara Kāṇḍa 5.1.87–143 | 300 / 655 | Midflight encounter; Hanumān touches the mountain and continues |
| The Devī and the messenger | *Devī Māhātmya* 5–6 | 324 / 662 | Her reply is the episode; no invented wedding or later battle |

The claim ledgers are in `source-notes/`. English drafts are in `en/`; native-language drafts are in `locales/hi/` and `locales/ta/`. `ENGLISH-SOURCE-EDITORIAL-QA.md` and `SOURCE-PARITY-QA.md` record source, care and cross-language audits. `ART-SOCIAL-QA.md` and the manifests record selected and rejected art, dimensions, hashes and OG checks. The OG cards say “editorial review / not live”; they must be remade as public cards after approval. The selected images and cards were visually inspected individually. The full local review page was structurally validated but an automated browser opening of its `file://` URL was blocked by browser policy.

Run `node review.mjs && node preflight.mjs` in this directory to regenerate the proof and its mechanical report. The current `validation.json` records **116 checks and zero failures**. Counts are planning signals, not measured read-aloud durations. Rama clarified that prior 3/6-minute approval did not cover these newly written editions; he will review the complete package together. Human read-aloud timing and approval of these exact English/Hindi/Tamil editions, native-language editor approval, and image/card approval remain pending. The production story JSON, locale locks/public shelves, hero/OG paths, social selectors, strict release gates, deploy and live verification must follow that review. PR #31 must remain draft until then.
