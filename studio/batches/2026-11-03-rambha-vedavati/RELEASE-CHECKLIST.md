# Release checklist

Current state: review package prepared; **not published**. User has requested publication in English, Hindi and Tamil. Do not substitute English-only release or count previous approvals as approval of these stories.

1. Review `review.html` for all twelve tellings, including care notes and parent answers. Resolve the Vedavatī witness choice and Rambhā stability classification; revise all affected source maps and notes together.
2. Have a named human Hindi editor and Tamil editor review the rendered prose, titles, names and both lengths. Read each aloud, revise for native cadence and 3/6-minute targets, record real duration separately for each story/language/length. Do not invent identical durations or mark a machine as `languageEditor`.
3. Review and add missing pronunciation entries from `lexicon-candidates.json`; ensure each `«marker»` in English resolves. Check whether existing singular Himalaya or chapter-name lexicon conventions should replace the candidate forms.
4. Approve exact file hashes, ages, care, source fidelity and all changes after review. Regenerate source pins whenever canonical bytes change. Do not regenerate an already approved packet without renewing approval.
5. Prepare non-graphic story hero and three native-script share previews per story; review the assets. Avoid depicting sexual violence, disrobing, self-harm or death by fire. Audio is optional; unreviewed audio must not ship.
6. Register both stories, canon, lexicon, approved locale editions, locale public/runtime/preview registrations, media and social/share data together. Preserve slugs, `gated: true` and age floors. Verify that browse, tonight picks and linked recommendations respect parental opt-in; do not change persisted profiles to accomplish this.
7. Run the repository's current strict validation, native-language, read-aloud, locale parity and full build gates. Create source/locale locks only after approvals. Run appropriate existing tests for any routing or renderer changes. Do not suppress unrelated gate failures or alter established baselines to force release.
8. Inspect final EN/HI/TA public pages and share previews at mobile and desktop widths; check names, line breaks, source notes, parental gating and language switching. Stage/deploy only the reviewed tree using the project's normal release procedure, then verify live pages, crawl metadata and share assets. Save deployment URL/receipt and exact released commit/hashes.

Next exact action: open `review.html`, review the proposed witness choice and source notes, then perform native read-aloud/editing of all four Hindi and all four Tamil tellings. The packet intentionally records pending human gates rather than manufacturing approvals.

## Reproduce candidate checks

From repository root:

```sh
python3 studio/batches/2026-11-03-rambha-vedavati/prepare.py
node studio/batches/2026-11-03-rambha-vedavati/build-review.mjs
```

`prepare.py` rebuilds the English candidates from the originals; `build-review.mjs` builds locale candidates from the language-authored scene data, pins them to English bytes, renders the review and saves draft-only checks. Edit authoring inputs for revisions before approval. Neither script promotes content or changes production registries. The top-level native-language production gate has not been represented as validating this staged directory; the candidate checker directly uses its policy data, with scope explicitly recorded.
