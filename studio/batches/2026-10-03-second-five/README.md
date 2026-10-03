# Second five trilingual stories — editorial review package

Draft review PR: https://github.com/rkarthikeyan54254/sandhyakatha/pull/28. Review page: [review.html](review.html). It contains all fifteen English, Hindi and Tamil editions, each with short and full tellings, parent notes, source ledgers, and the five candidate illustrations. The page is an offline editorial proof, not a production story route.

Chosen stories: Liṅgodbhava, Bhagīratha and Gaṅgā, Sukanyā, the brāhmaṇa and the pot, and Rāvaṇa lifting Kailāsa. Sēkkiḻār's queued hook was replaced after its key claim could not be grounded in the checked source. Primary witnesses and variant boundaries are recorded in `source-notes/`.

Current state: five English stories are `in-review`; ten staged locale editions are `draft` or `in-review`. Five WebP illustrations are **candidates**. No new edition or image has human approval, measured read-aloud seconds, public-shelf placement, media approval, or publication status. The previous batch's approval does not apply to these stories.

Mechanical evidence: `node studio/batches/2026-10-03-second-five/validate.mjs` passes schema, source hashes, claim maps, markers, draft completeness and the unchanged native-language moat for all ten staged locales. `npm run validate:strict` passes with zero warnings, and `npm test` passes 138/138. `npm run build` passed strict validation, content generation, TypeScript and Vite chunk generation, then stalled in the existing post-Vite PWA step and was stopped; a complete build is **not** claimed. See `validation.json` and `review-data.json` for counts and pending state.

Next exact action: Rama and fluent Hindi/Tamil reviewers read both versions of all five stories in [review.html](review.html), assess the five art candidates, record actual short/full read-aloud seconds, and give source/language approval or corrections. After that, revise, revalidate, promote/lock, create share cards, and merge to production. No timing or human approval may be inferred from word count or this machine validation.
