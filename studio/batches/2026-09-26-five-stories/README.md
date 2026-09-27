# Five new stories — publication checkpoint, 27 September 2026

Scope: butter-rope, last-grain, banyan-seed, blue-jackal, mice-ate-the-scales; English, Hindi and Tamil, each with short and full tellings.

Rama reviewed and approved all fifteen editions in both lengths and authorized merging on 27 September. The exact statement and illustration provenance are saved in `approval.json`. Language-editor and source-fidelity approval are recorded in all ten staged locale files. Five supplied illustrations are now optimized WebP assets under `public/media/stories`, with story-version-specific approval in `content/media.json`. Prose is unchanged from the reviewed commit `8f952aa`.

Publication remains pending one factual detail: whether the three/six-minute labels represent actual timed read-aloud readings. The pending chat question asks this explicitly. Do not copy word-count estimates into `measuredSeconds`. Native read-aloud gates remain pending and all five canonical stories remain in-review until the complete batch can pass publication gates.

Latest origin/main was fetched on 27 September and remains `63c97f2d8cd5f516ba401730ea8f9390efc75dfa`; the batch branch is based on it with no divergence.

`review.html` contains all fifteen editions and source ledgers. Regenerate/check with `node studio/batches/2026-09-26-five-stories/review.mjs`. `validation.json` records successful schema, source-hash, claim, native-language and word-count checks. Full tellings have 650–674 spoken words; six minutes is a planning estimate, not a measurement. Browser automation could not open the local proof; Rama's review is recorded, and production visual QA remains outstanding.

Full `npm run build` passed on 27 September with all strict editorial, locale, design, surface and cache gates; evidence: `publication-preflight.txt`. This validates the staged checkpoint, not publication of the five new stories.

## Next exact action

1. Record Rama's answer about actual measured short/full Hindi/Tamil timings (per edition if different); retain nulls until confirmed.
2. Publish the canonical stories with the approval workflow, update canon/media/observance metadata, move the approved locales into `content/locales/{hi,ta}`, recompute canonical blob hashes, update locks and appropriate public locale lists. Preserve age gates for blue-jackal and mice-ate-the-scales.
3. Adapt the proof validator for final approved/runtime editions, run the full strict build, then push, create and merge the PR. Merge and production deployment are already authorized; no repeated deployment approval is needed.
4. Verify the matching live deploy and save its URL/commit evidence.

## Illustration provenance

The five images were supplied with Rama's approval at the link in `approval.json`. They map in order to butter-rope, last-grain, banyan-seed, blue-jackal and mice-ate-the-scales. Conversion preserves dimensions/composition; hashes identify source and output. They are illustrative compositions, not additional source evidence. Story source ledgers remain authoritative.

## Self-audit notes

- Source editions were opened during drafting. Public-domain Ganguli, Müller and Ryder translations were used; the Bhāgavata factual ledger was checked against the Sanskrit verses, with commentary kept out of the narration.
- Banyan: retains the unseen essence and tat tvam asi; does not equate absence of visible detail with biological emptiness. Full telling includes 6.1 before 6.12 and acknowledges intervening examples.
- Rice: preserves vegetable as well as rice, departure of guests, Bhīma's search and the family's remaining anxiety. Does not invent a replenished pot.
- Jackal: Indra's appointment is explicitly the jackal's lie; death remains non-graphic and is not applauded. Hindi wording distinguishes striking/driving away the other jackals from killing them.
- Scales: retains pawning, confinement, age fifteen, magistrates and both restorations. Closing material does not endorse coercing a child.
- Machine review's quantity flags (one howl/morsel, two returning travellers) and prey/distribution lexical mismatch are advisory matches, not extra events. Human comparison remains required. The unwrapped Vedas finding was corrected.

Primary editions being checked: Bhāgavata Purāṇa 10.9 (Sanskrit verses); Ganguli's Mahābhārata, Vana 261; Max Müller's Chāndogya Upaniṣad 6.1 and 6.12; Arthur Ryder's 1925 Pañcatantra, Book I, The Blue Jackal and The Mice That Ate Iron. Exact source links and claim boundaries accompany the story files.
