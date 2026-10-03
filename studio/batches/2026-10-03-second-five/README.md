# Second five trilingual stories — approved publication package

Draft PR: https://github.com/rkarthikeyan54254/sandhyakatha/pull/28. The [review proof](review.html) is the exact page Rama read before approval; it intentionally retains its pre-approval labels. `approval.json` records the October 3 approval, 180/360-second short/full readings in all three languages, exact reviewed commit, unchanged prose hashes, and the five approved image hashes.

The five stories are Liṅgodbhava, Bhagīratha and Gaṅgā, Sukanyā, the brāhmaṇa and the pot, and Rāvaṇa lifting Kailāsa. Sēkkiḻār's queued hook was replaced after its key claim could not be grounded in the checked source. Primary witnesses and variant boundaries are in `source-notes/`.

Publication state on this branch: five English stories and ten Hindi/Tamil editions are marked published/approved and locked. Five approved WebP heroes and five 1200×630 JPEG share cards are checked in. Four non-gated stories enter the Hindi/Tamil public and preview allowlists. Sukanyā stays age gated, with approved/locked locales available only through the gated reader. Curated campaign selectors are source-exact, without new marketing prose.

Preflight: strict repository validation PASS with zero warnings, 138/138 tests PASS, five OG cards decode at 1200×630 and 132–168 KB, manual post-Vite prerender/public/social/design/surface gates PASS. The local full `npm run build` reaches Vite chunk generation but stalls in the PWA service-worker step; `dist/sw.js` is absent, so the local cache gate is not claimed as passing. The final-head CI/deploy preview must demonstrate a complete build before merge. See `publication-preflight.txt`.

Next exact action: push this approved head, inspect final CI and deploy preview, merge PR #28 only after they pass, then verify live English and Hindi/Tamil pages, images and WhatsApp OG metadata. The observance mapping for Liṅgodbhava remains a separate proposal, not automatically approved by story publication.
