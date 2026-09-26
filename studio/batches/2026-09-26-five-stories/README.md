# Five new stories — 26 September 2026

Base: `63c97f2d8cd5f516ba401730ea8f9390efc75dfa`, fetched from origin/main on 26 September 2026.

Scope: butter-rope, last-grain, banyan-seed, blue-jackal, mice-ate-the-scales. Five new canonical stories, each with English short/full and independently composed Hindi/Tamil editions. Existing published content and product design are not being rewritten.

Publication is authorized by Rama in this chat. This is not evidence of a completed human reading of these new editions. Human source review, native language editing, measured read-aloud review, and story-version-specific illustration approval remain required by EDITORIAL.md and studio/PIPELINE.md.

Status: all five English short/full pairs and all ten Hindi/Tamil short editions are written, in review, and mechanically validated. Hindi/Tamil full renditions are not included in this batch. Native timings are deliberately null until measured by a reader. All human review gates remain pending. No new story is published.

Open `review.html` for all fifteen editions, parent notes, questions and source ledgers. The page uses the existing product reader CSS, including Hindi/Tamil typography, without modifying production components. Its layout is an editorial proof, not a certified production preview. Run `node studio/batches/2026-09-26-five-stories/review.mjs` from the repository root to regenerate it and check the staged editions.

Canonical drafts are in `content/stories`. Locale drafts stay in this directory until their canonical stories are eligible; runtime validation correctly refuses locales attached to unpublished stories. No runtime gate was weakened. Canon planning rows now agree with the drafts, including care notes and age floors. Existing published stories, profiles, authentication, history, runtime locale allowlists and production assets were not edited.

`validation.json` records schema, source-blob, claim-reference, marker and unchanged native-language-gate checks. A machine pass does not approve prose quality or prove the source ledger correct.

`npm run build` passed on 26 September 2026; the complete output is in `build-validation.txt`. The initial build correctly flagged the old butter-rope observance proposal as stale; its proposal metadata was updated to in-review while leaving its approval pending, then the full build passed. All existing production language/design/surface/cache gates passed. The new drafts remain excluded from public output.

Visual QA is unverified: browser security policy blocked automated navigation to the local file URL. No alternate browser route was attempted. Open the saved `review.html` manually for visual and editorial review. The proof page's reuse of reader CSS does not substitute for production visual checks after approved art is added.

## Human review required before publication

1. Read both English lengths against the linked editions and record the actual source/editorial reviewer and date. Read them aloud; do not substitute the estimated English minute labels for a human reading.
2. Have native Hindi and Tamil editors read the ten staged short editions. Review title, register, pronunciation, every scene's claim mapping and parent material. Record actual read-aloud seconds and named reviewers for languageEditor, sourceFidelity and nativeReadAloud. Correct prose before approving it.
3. Commission or generate the five illustrations below and review each against story version 1. No illustration has been generated or approved for these stories. Do not create an approved media entry before that review.
4. Once genuine reviews are available, use the repository approval workflow, update matching canon/media versions, move eligible locale files to `content/locales/{hi,ta}`, maintain exact canonical blob hashes and locks, and run the full strict build and design/locale gates. Publication changes can change the canonical blob hash even without changing prose.
5. Fetch origin/main again, reconcile newer work, then merge and verify the matching production deploy at sandhyakatha.com. Rama has already authorized that merge; the missing item is review evidence, not a second deployment-permission request.

## Illustration briefs, pending production

- **butter-rope:** Yaśodā trying to join a rope around child Kṛṣṇa beside the wooden mortar; a visible two-finger gap, warm domestic setting. No beating, no extra child, no freed trees (different chapter).
- **last-grain:** Draupadī presenting the vessel as Kṛṣṇa notices its rim; a very small rice-and-vegetable morsel, restrained forest dwelling. No overflowing feast, no ten thousand seated diners (they never return for dinner).
- **banyan-seed:** Uddālaka teaching his adult son Śvetaketu with a banyan fruit and tiny seed. Śvetaketu is twenty-four, not a small child. No glowing embryo-tree presented as visible inside the seed.
- **blue-jackal:** Indigo-coated jackal among attentive forest animals, with a hint of the howl/exposure. No graphic killing, no divine coronation, no implication that Indra actually appointed him.
- **mice-ate-the-scales:** Two merchants before magistrates with the heavy iron balance-beam and the returned adolescent son. No actual hawk carrying a child, no literal iron-eating mice, no celebratory depiction of confinement.

## Self-audit notes

- Source editions were opened during drafting. Public-domain Ganguli, Müller and Ryder translations were used; the Bhāgavata factual ledger was checked against the Sanskrit verses, with commentary kept out of the narration.
- Banyan: retains the unseen essence and tat tvam asi; does not equate absence of visible detail with biological emptiness. Full telling includes 6.1 before 6.12 and acknowledges intervening examples.
- Rice: preserves vegetable as well as rice, departure of guests, Bhīma's search and the family's remaining anxiety. Does not invent a replenished pot.
- Jackal: Indra's appointment is explicitly the jackal's lie; death remains non-graphic and is not applauded. Hindi wording distinguishes striking/driving away the other jackals from killing them.
- Scales: retains pawning, confinement, age fifteen, magistrates and both restorations. Closing material does not endorse coercing a child.
- Machine review's quantity flags (one howl/morsel, two returning travellers) and prey/distribution lexical mismatch are advisory matches, not extra events. Human comparison remains required. The unwrapped Vedas finding was corrected.

Primary editions being checked: Bhāgavata Purāṇa 10.9 (Sanskrit verses); Ganguli's Mahābhārata, Vana 261; Max Müller's Chāndogya Upaniṣad 6.1 and 6.12; Arthur Ryder's 1925 Pañcatantra, Book I, The Blue Jackal and The Mice That Ate Iron. Exact source links and claim boundaries accompany the story files.
