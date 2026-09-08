# The studio — how one story gets written

Nine stages. Seven are machine work, two are yours. The point of writing the
prompts down is that the chain is versioned and repeatable rather than a fresh
conversation every time — so a story written in March is written to the same
standard as one written in September.

Throughput is 8–12 stories per session through stages 1–7. **Stage 8 is the
bottleneck: you can only approve as fast as you can read aloud.** Plan the
launch around the corpus, not the code.

Expect stage 2 to take roughly twice as long on Tamil and bhakti material. The
Sanskrit corpus has printed critical editions; the Periya Purāṇam has good ones;
the sant stories are largely oral and will land as `folk` with a tradition note.

---

## 1 · Choose the night, not the story

> Here is `content/canon.json` and the stories already written. Find the gaps:
> a calendar slot with no candidate, an age band that is thin, a tradition that
> is under-represented, a value that appears too often. Propose the next five
> stories to write and say which gap each one fills. Do not propose favourites.

Writing to a gap is what keeps the shelf balanced. Left alone, any collection
drifts toward the writer's favourite epic and the seven-to-nine age band.

## 2 · Source it

> For `<story>`: pull the actual passages. Name the edition and the exact locus.
> Compare the recensions and any regional retellings. Output a citation block
> and a plain factual summary of what the text says — sequence of events, who is
> present, what is actually said. **No prose, no retelling, no atmosphere.**
> If the recensions disagree, say exactly how, and draft the tradition note.

The sourcing block is the only thing stages 3 and 4 are allowed to draw from.
That constraint is what keeps invention out.

## 3 · Draft the full length

> Write the six-minute telling **from the sourcing block only**. Breath lines —
> one thought each, at most three sentences. Printed pause beats before the
> turns. Exactly one `slow` block, last, and it is the landing. Speech in
> `_underscores_`. Every name in `«guillemets»`.
> Anything not in the sourcing block cannot appear. If you want a detail that
> is not there, say so instead of writing it.

## 4 · Draft the short length separately

> Now write the three-minute telling. **Not a trim.** Go back to the sourcing
> block, not to the long draft, and re-tell it in three minutes with its own
> shape and its own last line. It may land somewhere different, and that is fine.

## 5 · Age and care pass

> Set the age floor by asking: would I read this, tonight, to a child of exactly
> that age? Flag every sensitivity. Write the care note to the parent, saying
> what is actually coming in plain words. Decide `gated`.
> Then check the opposite failure: has anything been sanitised into
> meaninglessness? Ekalavya keeps his thumb loss. Say what was softened and why.

## 6 · Read-aloud pass

> Read both lengths out loud. Rewrite every sentence a parent would stumble on.
> Move pauses to where a voice needs them, not where a paragraph ends. Add every
> name to `content/lexicon.json` with native script (`deva`, and `taml` for
> Tamil names), respelling, IPA, kind and gloss. Flag anything you are not
> confident transcribing.

## 7 · Write the close

> One open question the child cannot get right or wrong, and that asks them
> about themselves — never "what did we learn". One seed line: the moral, said
> plainly, for when they shrug. Then two or three follow-ups children actually
> ask, answered honestly and at length, including the uncomfortable one.

This is the hardest stage and the most valuable. It is the section a chat window
will never produce unprompted, and it is the only material a voice agent is
permitted to answer from.

## 8 · Approve — you

Read it aloud, once, all the way through, to an actual child if one is
available. Approve or send it back with a note. Set `status: "published"`,
`reviewedBy`, `reviewedOn`, and make sure `checkedAgainst` names a real edition.
Run `npm run validate` and `npm run lock`. Open the PR with the story template
and work the checklist honestly.

**Nothing reaches `published` without this stage.** It is the whole difference
between this and a generator.

## 9 · Render and listen — you

`npm run ssml <id>` shows exactly what the engine will receive, with the native
script substituted and the pauses in place. Render, then **listen to the whole
track**. One mispronounced name undoes every citation above it. Set
`audio[].approved` only after you have heard it end to end.
