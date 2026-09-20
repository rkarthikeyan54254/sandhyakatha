# Editorial standards

Read this before writing a story. Everything here exists because breaking it
would let us mislead a parent or mistell a story, and those are the two
failures this project does not recover from.

## The first rule

**Nothing appears in a story that is not in the source.** No invented
characters, no invented dialogue beyond the ordinary work of retelling, no
detail borrowed from another tradition and presented as this one. If a
beautiful line is not in the text, it does not go in.

Where the recensions disagree, that disagreement is not a problem to smooth
over. It is content: set `stability` and write the `traditionNote`.

## How the gods are spoken about

A god in these stories can be wrong, outwitted, hungry, jealous, embarrassed or
asleep — that is most of the Purāṇas, and flattening it produces a collection
nobody needs. What the narration never does is **belittle them**. No god is
called stupid, silly, foolish or ridiculous, and no aside invites the child to
look down on one.

The distinction is between the story and the voice telling it. *Śiva argued that
food was an illusion and then queued for a meal* is the story, and it is funny,
and it stays. *Śiva was being stupid* is the narrator sneering, and it goes.
Show the position, show what it cost, and let the child draw the conclusion —
which is the same rule as `close.question`, applied to the narration.

Rewrite for the same beat without the judgement: "he was not being stupid"
becomes "he was not speaking carelessly". The validator warns on a small list of
belittling words wherever they appear, because a word list cannot tell who a
sentence is about and a person has to look.

## Stability, and why we print it

| value | means | example |
|---|---|---|
| `stable` | told the same way across the recensions | Govardhana |
| `variant` | the major recensions differ on something that matters | Bhasmāsura |
| `regional` | present in a regional retelling, not in the Sanskrit | Pūsalār; the squirrel |
| `folk` | oral; no text to check against | Hanumān's own Rāmāyaṇa |

Anything but `stable` **requires** a tradition note, enforced by the validator.
Write it plainly and without apology. A parent who learns that the squirrel is
Tamil and not Vālmīki has learned something true, and has learned that we tell
them. That is the entire trust proposition, and it is worth more than the story.

## What we do not adjudicate

Set 2026-09-10, on review: *"never question the belief system — remember this is
faith and not just story. You can say I cannot find a reference, that is fair,
but don't say it did not happen."*

The line is between **our sourcing**, which is ours to report, and **whether it
happened**, which is not ours to settle. We are scrupulous about the first and
silent on the second.

Fine, and the whole trust proposition:

- "Told the same way in every recension."
- "Present in the Tamil retelling and not in the Sanskrit."
- "Carried down rather than written down — we could find no early text for it."
- "The recensions differ here, and this is the one we tell."

Not fine, whatever the hedging:

- "Nobody knows whether it really happened."
- "Did that really happen?" answered with a verdict either way.
- "It is just a story" / "only a legend" / "mythical".
- "Whether that happened the way a thing happens on a Tuesday…" — a soft version
  of the same ruling, and it was in `satyakama-truth` until this rule existed.

A child asking *did a bull really talk?* still deserves an answer. The answer
says what the text says and what the story is doing, and stops there. It does
not hand down a finding.

`scripts/review.mjs` checks for this — a `faith` finding — across the prose, the
tease, the tradition note and every `ifTheyAsk`. A word list cannot judge a
sentence, so it flags and a person decides.

## What this collection is

Set 2026-09-10. This is a collection of Hindu stories. Itihāsa, Purāṇa, Upaniṣad,
the Nāyaṉmārs and Āḻvārs, the sants, and the regional and folk material that
grew around all of it. That is the shelf, and it is deep enough for a lifetime.

Material from other traditions — Jain, Buddhist — does not ship, however old,
however beautiful, however much it rhymes with something we already tell. This
is not a judgement on those traditions. It is what the site is for: a parent
comes here to give a child the stories of their own tradition, in a form they
can trust, and a collection that wanders is no longer that.

`scripts/validate.mjs` enforces this — a canon row whose tradition is `jain` or
`buddhist` fails unless the row is `retired`. The enum keeps those values so the
retired rows stay honest about what they were.

Two things this rule does **not** decide, and a person still has to:

- **Hindu stories about non-Hindus.** Some Nāyaṉmār material is set against
  Jains, and some of it ends badly for them. Being Hindu material puts it in
  scope; it does not put it in the collection. The older test still governs —
  does the story ask a child to admire the harm — and a story whose pleasure is
  a rival community losing is a story a child carries to school the next day.
- **Figures both traditions claim.** Kabīr is the live case: he sits in the
  bhakti canon and is sung in Hindu households, and he was raised in a Muslim
  weaver's family, and the story we had planned for him is precisely the one
  where both crowds come for his body. `kabir-shroud` (canon row 43) is
  unresolved and stays `draft` until it is decided deliberately.

## Vālmīki is the Rāmāyaṇa

Other Rāmāyaṇas exist, and scholars are right that there are hundreds. This site
is not the place a child meets them for the first time.

A regional *addition* is welcome: the squirrel, Śabarī's tasted berries, the line
Lakṣmaṇa drew. These add a scene to a story the child already holds, and the
tradition note tells the parent where it came from. That is widening.

A telling that *reverses* the Rāmāyaṇa is not. A Rāvaṇa who is a good king, a
Sītā who is Rāvaṇa's daughter, a Rāma who is not the one who kills — a child who
is being raised on Vālmīki does not hear these as a second tradition. They hear
them as the story being wrong, or as us saying their family has it wrong. The
adult pleasure of *look how many Rāmāyaṇas there are* costs the child the one
they have. We do not spend it.

So: additions to Vālmīki, yes, marked. Contradictions of Vālmīki, no — however
old, however well attested, however interesting. `jain-ravana` was written and
shelved under this rule; the draft is in `content/shelved/` with the reason on it.

This rule is about the Rāmāyaṇa specifically. Elsewhere — the Purāṇas above all —
tellings genuinely do disagree, everyone knows it, and `variant` with an honest
note is the right answer.

## Native-language moat

Set 2026-09-20 after the Hindi/Tamil parity review. **The canonical/English
edition supplies meaning, source identity and claim boundaries. It is never the
syntactic, rhetorical or titling template for another language.** A locale is
finished only when it reads as though the story was conceived and narrated in
that language.

A localized title is not a translation field. Keep the same canonical event and
truth, but formulate the title independently in the target language. Do not
translate the English title first and polish it later; that preserves English
editorial instincts even when every target-language word is grammatical.

The same rule applies below the title. Reject sentences that reveal the English
sentence underneath them: English-shaped possessives, connective phrases,
word-order, explanatory framing, honorific rhythm or idiom are translation debt.
Grammatical correctness is necessary and insufficient.

For every locale edition:

- begin from the canonical claims, scenes and tradition boundaries, not from the
  English sentences;
- choose the title, sentence rhythm, idiom, honorifics and transitions in the
  target language itself;
- read the complete edition aloud and rewrite anything that sounds translated;
- use native publications only to calibrate register, title instinct and prose
  rhythm — never as evidence for story facts;
- keep `sourceMap`, canonical entity markers and source-fidelity review exactly
  as strict as the English edition; native voice is not permission to invent;
- require a human native-language editor before `status: approved`.

For Tamil, the baseline is family read-aloud Tamil: natural, contemporary and
publication-quality without becoming either textbook prose or stage oratory.
`dinamalar.com` and `akilakarthikeyan.com` are useful style-calibration examples
for headline instinct and native prose rhythm. They are not SandhyaKatha source
witnesses. The canonical source ledger remains authoritative.

**AI self-review can never satisfy the `languageEditor` gate.** An AI or coding
agent may draft, compare against native publications, flag translation-shaped
phrases and revise. The approval itself must name a human reviewer. A machine
cannot promote its own locale prose to public status.

The machine-enforced half of this contract lives in
`content/native-language-moat.json` and `scripts/native-language-gates.mjs`.
That gate blocks known translation regressions, Latin-script leakage in
Hindi/Tamil reader text, machine identities in the human language-editor gate,
and removal of this policy. Passing it does not prove beautiful prose; the
human review is deliberately non-automatable.

## Writing for a voice

- **`p` is a breath line.** One thought. At most three sentences.
- **`beat` is a printed pause.** The reader stops. Use it before a turn, not as punctuation.
- **`slow` is the landing.** Exactly one per rendition, always last.
- **`aside` is a note to you, not to the child.** Anything that tells the reader
  *how to read* — slow down here, keep this short, do not let it sound
  admirable — is an aside. It is printed on the page marked *for you, not
  aloud*, the voice renderer skips it, and it does not count towards the
  minutes, so a six-minute telling is six minutes of actual speech. Never first,
  never last.

  The test is simple. If the sentence speaks to the child about the story, it is
  narration and stays a `p` — *"That is the part the text spends its time on"*
  reads aloud fine. If it instructs the person holding the phone, it is an
  aside — *"which is the part of this story I would slow down for"* puts an
  editorial "I" in a parent's mouth that is not theirs.
- Speech is marked `_like this_`, never with quotation marks.
- Every name is wrapped `«Like This»` and must exist in the lexicon with native
  script, respelling and gloss. A parent must never have to guess how to say a
  name in front of their child.
- **Each length is written, not truncated.** The short rendition is a different
  telling with its own turn and its own last line — not the long one with
  paragraphs deleted.
- **Target lengths.** A parent reading slowly to a child runs about 110 words a
  minute, and each printed beat is a real silence. Working backwards from the
  validator's own arithmetic — `words/110 + beats × 0.05`, rounded — the bands
  that actually produce the labels we print are **`short` 300–360 words
  (3 minutes)** and **`full` 650–680 words (6 minutes — the ceiling drops as you add beats, since each is 0.05 of a minute)**. The older numbers
  here said 330–390 and 650–720; both top ends round up to the next minute, and
  the public story page promises "the three-minute telling". The validator recomputes
  `minutes` from the actual text and will not let a label lie — if your full
  telling comes out at 4 minutes, the telling is short, not the label wrong.
  **The whole product promises six minutes. A `full` rendition that does not
  reach 6 is not finished.** Do not pad it to get there: add a scene, a
  consequence, an aftermath — the thing the clipped version left out. The
  eighth day, when Indra runs out of rain, was missing from Govardhana for
  exactly this reason, and the story is better for having it.
- Read it out loud, all the way through, before you approve it. Every sentence
  you stumble on gets rewritten. This is not optional and there is no substitute.

## Locale editions are authored, not translated

Set 2026-09-19, after the Squirrel Hindi/Tamil review. A locale edition is not
an English story with its words exchanged. **It must sound as though a parent
who speaks that language wrote it in that language first.** Grammatical
correctness is not enough. A sentence that carries English word order, English
rhythm or transliterated names is a failed locale edition even when every fact
is correct.

**Parity is semantic, not syntactic.** Preserve the sourced events, causal
sequence, turn, emotional weight and landing. Do not preserve English sentence
boundaries, idioms, repetitions or clause order merely because they are present
in the canonical English telling. Hindi gets Hindi cadence. Tamil gets Tamil
cadence.

**Native script must survive all the way to the glass.** Canonical markers such
as \`«Rāma»\` are internal identity keys. They are allowed in locale JSON only
because the renderer resolves them through \`displayNames\`. A Hindi or Tamil
reader, public page, preview, reel or campaign card must never expose \`Rāma\`,
\`Laṅkā\`, \`Hanumān\` or another romanized canonical key where the native-script
name belongs. Review the rendered surface, not only the JSON.

**Morphology outranks token substitution.** Never assume that appending a Tamil
case suffix to \`«Name»\` will remain grammatical after the marker is replaced by
its display name. \`«Rāma»வின்\` can become the bad form \`ராமர்வின்\` when
\`displayNames.Rāma\` is \`ராமர்\`. Rewrite the sentence so the rendered name fits
naturally, or add an explicit inflection mechanism before using that form.

The \`languageEditor\` approval gate therefore means all of the following:

- a fluent speaker has reviewed the **rendered** edition, not just the source JSON;
- it reads like native family storytelling, not translated copy;
- names and religious/cultural terms appear in the script and form a speaker
  would naturally use;
- sentence shape, repetition and pacing belong to the target language;
- the locale preserves source meaning without importing English phrasing.

If any one of those is false, the gate is \`changes-requested\`, not \`approved\`.
\`scripts/validate-locales.mjs\` catches Latin-script leakage that software can
prove; the native-voice judgement remains human because pretending software can
certify idiomatic prose would weaken the gate.

## The close

- **The question is open.** It cannot be answered right or wrong, and it is
  never "what did we learn". It asks the child about themselves.
- **The seed is the moral.** Said once, plainly, and only if the child shrugs.
- **`ifTheyAsk` is where the honesty lives.** Two or three real follow-ups,
  answered properly and at length. "Was Indra bad, then?" gets a real answer.
  This is also the only material a voice agent is permitted to answer from.

## Age and care

Set the age floor by asking whether you would read this, tonight, to a child of
exactly that age. Not whether it is famous, and not what age you first heard it.

Flag every sensitivity. Write the `careNote` to the parent, not about the child,
and say what is actually coming — "he takes out his own eye", not "contains
mature themes". A parent must never be ambushed at bedtime.

## The difficult stories

**Nothing is cut from the collection.** The Periya Purāṇam is magnificent and in
places brutal; the Mahābhārata is a war. Sanitising them produces a collection
nobody needs.

Instead, the hardest stories are **gated**: `audience.gated: true` keeps a story
out of tonight's pick and out of browse until the parent switches on *Include
the difficult ones*, and shows the care note before the first line. The parent
decides when their child is ready, which is the only person who can.

When you write one, resist two temptations equally: do not soften it, and do not
supply a tidy moral it does not have. Siṟuttoṇḍar's vow was monstrous and was
honoured anyway; that ambiguity is why the story survived a thousand years, and
flattening it does it no favours. Put the argument in `ifTheyAsk` and let the
family have it.

## Where the stories come from

Prefer what is not already in every children's collection. A parent can get
Rāma and the golden deer anywhere. They cannot easily get Pūsalār building a
temple in his head, or the three Āḻvārs in the doorway, or the Rāmāyaṇa in
which Rāvaṇa is a good king. The famous stories earn trust; the unfamiliar ones
earn the subscription.

Keep the traditions balanced and keep them *labelled*. Tamil Śaiva, Tamil
Vaiṣṇava, North bhakti, Jain and folk material each reach us differently, and
that difference is often the most interesting thing in the story.
