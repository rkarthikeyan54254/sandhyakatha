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

## Writing for a voice

- **`p` is a breath line.** One thought. At most three sentences.
- **`beat` is a printed pause.** The reader stops. Use it before a turn, not as punctuation.
- **`slow` is the landing.** Exactly one per rendition, always last.
- Speech is marked `_like this_`, never with quotation marks.
- Every name is wrapped `«Like This»` and must exist in the lexicon with native
  script, respelling and gloss. A parent must never have to guess how to say a
  name in front of their child.
- **Each length is written, not truncated.** The short rendition is a different
  telling with its own turn and its own last line — not the long one with
  paragraphs deleted.
- **Target lengths.** A parent reading slowly to a child runs about 110 words a
  minute, and each printed beat is a real silence. So `short` is 330–390 words
  (3 minutes) and `full` is 650–720 words (6 minutes). The validator recomputes
  `minutes` from the actual text and will not let a label lie — if your full
  telling comes out at 4 minutes, the telling is short, not the label wrong.
  **The whole product promises six minutes. A `full` rendition that does not
  reach 6 is not finished.** Do not pad it to get there: add a scene, a
  consequence, an aftermath — the thing the clipped version left out. The
  eighth day, when Indra runs out of rain, was missing from Govardhana for
  exactly this reason, and the story is better for having it.
- Read it out loud, all the way through, before you approve it. Every sentence
  you stumble on gets rewritten. This is not optional and there is no substitute.

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
