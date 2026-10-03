# SandhyaKatha corpus expansion — first-five durable checkpoint

Branch: `corpus-expansion-10-trilingual-20261002`  
Checkpoint date: 2026-10-02  
Story-package head before checkpoint metadata: `481179e3cf8abdd49feea3e55aa36cfb9b75818a`

## Completed and committed

The requested first-five tranche is now durable on GitHub: **5 English canonical candidates + 5 Hindi editions + 5 Tamil editions = 15 editions**.

| Story | English | Hindi | Tamil | Source boundary |
|---|---|---|---|---|
| `amarniti-scales` | complete | complete | complete | *Periya Purāṇam*, Amar-Nīti Nāyaṉār Purāṇam; weighing miracle explicitly treated as Tamil Śaiva hagiography |
| `sundarar-court` | complete | complete | complete | *Periya Purāṇam* courtroom episode kept distinct from the earlier Tēvāram 7.1 hymn witness |
| `appar-spade` | complete | complete | complete | *Periya Purāṇam* Tirunāvukkaracar/Tiruppukalūr service-test sequence; jewel test treated as later saint-life material |
| `thirumangai-ring` | complete | complete | complete | later Śrīvaiṣṇava Guruparamparā conversion story kept distinct from *Periya Tirumoḻi* 1.1; ring-holder variation disclosed |
| `kulasekhara-march` | complete | complete | complete | later Śrīvaiṣṇava army-order hagiography kept distinct from the earlier Rāma-centred *Perumāḷ Tirumoḻi* witness; Khara/Laṅkā variation disclosed |

## Locale integrity state

All ten non-English editions are intentionally still `in-review`.

- no human language-editor approval is claimed
- no source-fidelity approval is claimed
- native read-aloud reviews remain pending
- `measuredSeconds` remains `null`
- locale source maps are tied to each English claim ledger
- no fake human approvals or measured timings were introduced

The Sundarar locale files were repaired in this checkpoint so their `sourceBlobSha1` now points to the committed English source bytes rather than the earlier temporary zero placeholder.

## Media checkpoint

The five user-supplied hero-image mappings are recorded in `media-candidates.json` for:

- `amarniti-scales`
- `sundarar-court`
- `appar-spade`
- `thirumangai-ring`
- `kulasekhara-march`

No human image approval is asserted at this staged checkpoint. Hero/OG binary promotion belongs to the later content-promotion pass.

## What this checkpoint deliberately does not claim

These files are staged review packages under `studio/batches/.../checkpoint-5`; they have **not yet been promoted into the live `content/stories` / `content/locales` corpus**. Therefore the full corpus/build/SEO/cache/lock gate pass is not claimed here. Those gates must run after promotion, not be weakened to make staged material appear published.

## Next five

Resume from this branch and work only on:

1. `lingodbhava-pillar`
2. `bhagiratha-ganga`
3. `sukanya-anthill`
4. `brahmin-and-the-pot`
5. `sekkizhar-first-word`

Do not recreate the first five and do not repeat broad research. The repository checkpoint, not chat state, is now the resume source of truth.

## 2026-10-03 publication reconciliation

The five exact WebPs supplied by Rama now replace the earlier binaries in
`public/media/stories/<id>/hero.webp`. Their SHA-256 hashes match the handoff,
and all five decode with `dwebp`. Rama approved the images and confirmed human
read-aloud approval for the Hindi and Tamil editions.

The **actual measured seconds for each Hindi/Tamil short and full reading have
not yet been supplied**. The current `locale-parity-gates.mjs` requires those
measurements, approved native reviews and public locale locks for *every*
published English story. Accordingly, these fifteen editions remain staged;
none of the five English stories is yet public. The one-shot GitHub promotion
workflow was removed, the production locale validator restored, and the
promotion script now checks all twenty measured values before any content
write. Existing 70-story corpus strict validation passes.

Next exact action: record the five stories' Hindi and Tamil short/full measured
seconds in `read-aloud-timings.json` as `{ "story-id": { "hi": {
"short": 180, "full": 360 }, "ta": { "short": 180, "full": 360 } } }`
using the **actual readings**, then run the guarded promotion, generate OG
cards/locks, complete the full gates, and merge PR #23. The numbers above show
the file shape only; they are not claimed measurements.
