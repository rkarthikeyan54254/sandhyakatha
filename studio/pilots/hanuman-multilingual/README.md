# One-story language pilot: Hanumān, reminded

**Editorial draft, not approved for publication.** English is the exact published short rendition of `hanuman-reminded`, version 1. Hindi and Tamil are AI-authored oral adaptations for native-reader evaluation, not certified native-speaker work. No audio, new story, automatic translation service, language setting, profile field, or production routing has been added.

## Why this story / this length

The complete short telling has a beginning, turn and landing. It tests whether quiet encouragement survives adaptation without becoming a motivational lecture. It also tests our sourcing promise: the scene must not silently acquire an explicit curse-lifting event from a different textual tradition. Start with this complete short telling before commissioning three full-length editions.

The English edition is labelled three minutes in the approved source. **Hindi and Tamil duration is unmeasured.** English words-per-minute arithmetic is not a multilingual timing model, particularly for agglutinative Tamil. Time an actual parent reading each draft; never pad it to match English word count. A full edition still needs its own six-minute read-aloud gate.

## Voice brief

- Audience: a parent reading to a child aged six or older. Warm, unhurried, not baby talk or a sermon.
- Hindi: accessible standard Hindi. Consistent respectful plural narration for Hanumān; Jāmbavān addresses him as `तुम`. Avoid imported English abstractions and excessive Sanskrit compounds. `योजन` and `वज्र` remain, with a parent note for the former and clear injury wording for the latter.
- Tamil: accessible written Tamil that can be comfortably spoken, not a transcript of a particular regional dialect. Use familiar Tamil name forms (`அனுமன்`, `சீதை`, `அங்கதன்`). Narration uses respectful `அவர்`; the elder's direct address uses `நீ`. Keep grammatical suffixes outside the name marker, e.g. `«சீதை»யை`; don't translate through Hindi.
- Preserve the emotional progression: measured limits → silence → personal reminder → call to rise → strength and promise. Do not manufacture tears, smiles, gestures, inner thoughts or dialogue to make it feel “native.”
- Recompose breath groups. English's repeated one-line sentences need not be copied mechanically. Keep pauses at the two real turns and one final slow landing. Retold speech stays marked with underscores.

## Three editorial choices worth listening to

| Beat | English baseline | Hindi adaptation | Tamil adaptation |
|---|---|---|---|
| Return uncertainty | “but he was not sure he could return” | “लेकिन लौट भी पाएँगे या नहीं, इसका भरोसा नहीं था।” | “ஆனால் திரும்பி வர முடியுமா? அதுதான் அவருக்கு உறுதியாகத் தெரியவில்லை.” |
| Personal reminder | “telling Hanumān about Hanumān” | “हनुमान को उन्हीं की कहानी सुनाने लगे।” | “அனுமனுக்கே அனுமனின் கதையைச் சொல்லத் தொடங்கினார்.” |
| Elder's invitation | “This is your time.” | “अब तुम्हारी बारी है।” | “இப்போது நீ செய்ய வேண்டிய நேரம் வந்துவிட்டது.” |

These are proposed voice decisions, not proof of native quality. In particular, listen for whether the Tamil invitation is too long and whether the Hindi closing question feels natural to a six-year-old. Revise from actual reader feedback, not a model's self-score.

## Source-fidelity boundary

The pilot derives only from the approved story's short rendition, claim ledger and follow-up answers. It is **not a fresh independent verification of the Critical Edition**. Printed attribution: Vālmīki Rāmāyaṇa, Kiṣkindhākāṇḍa 4.63–66; Uttarakāṇḍa 7.36 is background to the separately labelled curse tradition.

The localized parent notes explicitly retain this distinction. No curse is narrated as lifting at the shore. No ocean crossing, discovery of Sītā, or later adventure is appended: this story ends with readiness to leap. The closing question remains open, and the seed is only for a child who does not answer.

Scene IDs in the draft keep editorial tracing possible without forcing one-to-one sentences:

| Scene IDs | Approved claim locations |
|---|---|
| shore, limits, angada | 4.63–64: task, leaping ranges, uncertainty about return |
| silence, reminder | 4.64.35; 4.65.1–7 |
| childhood | 4.65.8–29 |
| call, growth | 4.65.30–36 |
| declaration, promise, relief, mountain | 4.66.1–44 |
| landing | Recapitulates the short rendition's promise; no new event |

The localized injury note is for the adult, not additional spoken narration. Do not silently change the live story's age/sensitivity metadata. The pilot-local name map resolves to canonical lexicon keys without editing the shared lexicon, which has user changes in progress.

## Review gate — deliberately not yet passed

For **each language**, ask a fluent native-speaking parent to read the entire telling aloud without seeing the other languages first. Have a second native editor review syntax, respectful address and idiom. A fluent editor must also compare it against the claim/variant ledger. Record reviewers and actual dates; do not inherit Rama's English approval as Hindi/Tamil approval.

1. Record exact phrases where the reader stumbles, spontaneously substitutes a word, or needs to reread to find the subject. Revise and reread the whole telling.
2. Ask the listener what happened—not “what moral did you learn?” Check who could go but might not return, who was silent, and what changed after Jāmbavān spoke.
3. Ask whether any sentence sounds translated, textbook-like, preachy, excessively formal or regionally unnatural. Collect the reader's preferred wording.
4. Check names, suffixes, gender/number agreement, honorific consistency, pauses, closing question and follow-ups separately.
5. Verify every revision against the source ledger. Warmth is not permission to invent.
6. Time narration only (excluding parent/source notes). Publication requires recorded native read-aloud approval and editorial/source approval, not merely a structural validator pass.

| Language | Native read-aloud | Second language editor | Source fidelity | Measured duration | Publish |
|---|---|---|---|---|---|
| English baseline | Existing approval in source | Unchanged | Existing approval | Existing label: 3 min | Already published baseline |
| Hindi | Pending | Pending | Draft checked against approved English ledger; human review pending | Pending | No |
| Tamil | Pending | Pending | Draft checked against approved English ledger; human review pending | Pending | No |

## Preview and technical boundary

Run `node studio/pilots/hanuman-multilingual/preview.mjs /absolute/path/to/preview.html` to produce a self-contained, offline reader with language tabs, comparison view, source notes and parent follow-ups. No analytics, network calls, external fonts or browser speech synthesis. Names remain linked to the canonical keys in the draft metadata; production pronunciation cards are outside this pilot.

English is loaded directly from its source JSON; never maintain a second English copy. The preview validates status/version, script presence, known name markers, scene coverage and the single final landing. These are mechanical checks, **not grammar or source certification**.

If the pilot passes: use one story identity with independently reviewed locale editions and source-version linkage. Switching language must never change which child/story owns reading history. Design that persisted-state interaction separately under `docs/PERSISTED-STATE-SAFETY.md`. Don't add a global automatic translation fallback, silently serve unreviewed languages, or publish mass-localized versions.
