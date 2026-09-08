# Building the remaining 73

Written after producing three stories end to end, which changed what I thought
this document should say.

## What "faithfully" costs, concretely

Three stories took one working session including sourcing, both renditions,
the close, the lexicon entries and the fixes the validator demanded. Not eight
to twelve. **Three is the honest rate for a six-minute telling**, and the earlier
estimate was written before anything had actually been written.

73 remaining ÷ 3 ≈ **25 drafting sessions**, plus your reading-aloud time.
That is the real number. Plan the launch around it.

## The order: write to the calendar, not to the list

Sort what is unwritten by the next date its festival falls, and write toward
that date with four weeks of clearance so the page is indexed before people
search. `npm run next` prints the queue.

Everything with no festival attached is filler between deadlines — take those
in age order, filling the thinnest band first (currently 13–15, which has one
story in the whole collection).

## The six-minute rule, and how to meet it

A `full` rendition that reads in four minutes is not finished. **Do not pad it.**
Every one of the three I wrote came in short on the first pass, and in every
case what was missing was the same kind of thing:

- **the work itself** — how the bridge actually got built, Nala's rule about
  big stones then small then sand
- **the aftermath** — the eighth day, when Indra runs out of rain and starts
  to work out what he has done
- **the interior middle** — Gaṇeśa sitting there long enough that his mother
  asks if he is unwell; Pūsalār checking a wall that isn't there, in the dark,
  for years

Clipped tellings skip these first. They are also the parts children remember.
If the draft is at four minutes, ask what happened *next*, and what it was
*like*, before you touch a sentence you already have.

## Sourcing, and where it gets harder

Stage 2 of the pipeline is the only defence against inventing scripture, and it
is not evenly difficult:

| Material | Difficulty | What to cite |
|---|---|---|
| Sanskrit epics and Purāṇas | Straightforward | Critical editions (Baroda for Vālmīki, Gita Press / Motilal for the Purāṇas) |
| Periya Purāṇam, Divya Prabandham | Moderate | Good Tamil editions exist; Vanmikanathan's translation for cross-checking |
| Sant material | Hard | Largely oral. Expect `stability: folk` and a tradition note. Do not manufacture a locus. |
| Regional Rāmāyaṇas | Hard | Name the recension explicitly; the differences are the content |

**If you cannot name an edition, the story is not `published`.** The validator
enforces this and should not be argued with.

## The batch shape that works

Write in threes, sharing a cluster of characters. The three today shared none
and each needed its own lexicon research; a batch of three Nāyaṉmār stories
would amortise that. Group by:

- the same festival (so one page fills at once)
- the same cluster in `relations.json` (so the constellation lights in a
  connected patch rather than as scattered dots)
- the same source work (so one edition is open on the desk)

## Approval, and why nothing here is published

Stories written without you are committed as `status: "in-review"`. They do not
reach the app — `build-index.mjs` ships only `published` — so the shelf never
claims something you have not read aloud. To approve one:

1. Read both renditions out loud, all the way through.
2. Confirm `checkedAgainst` names an edition you would defend.
3. Set `status: "published"`, add `reviewedBy` and `reviewedOn`, and set the
   same status in `content/canon.json`.
4. `npm run lock && npm run validate:strict`

That gate is the product. It is also the bottleneck, and it should be.
