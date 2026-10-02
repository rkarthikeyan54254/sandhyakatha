# SandhyaKatha corpus expansion — checkpoint 5 of 10

Branch: `corpus-expansion-10-trilingual-20261002`  
Checkpoint date: 2026-10-02

## Durable scope in this checkpoint

Five story packages are staged, each with independent English short/full tellings and native Hindi/Tamil review editions:

1. `amarniti-scales`
2. `sundarar-court`
3. `appar-spade`
4. `thirumangai-ring`
5. `kulasekhara-march`

That is **15 review editions**: 5 English + 5 Hindi + 5 Tamil.

The files live under this batch directory so this checkpoint cannot break the production corpus while the remaining global promotion work (`content/canon.json`, `content/lexicon.json`, `content/media.json`, locks/manifests) is still pending. The exact English bytes here are the source bytes to promote unchanged; Hindi/Tamil `sourceBlobSha1` values pin those bytes.

## Editorial/source decisions

| Story | Primary evidence used | Boundary kept explicit |
|---|---|---|
| `amarniti-scales` | *Periya Purāṇam*, Amar-Nīti Nāyaṉār Purāṇam, vv. 502–549 | Tamil Śaiva saint-life; weighing miracle is hagiographic, not presented as earlier Sanskrit scripture |
| `sundarar-court` | *Periya Purāṇam* Lord's Intercession episode + Sundarar Tevaram 7.001 | Court/deed drama is later hagiography; Tiruvennainallur, `piththā`, and service language are also present in Sundarar's own hymn |
| `appar-spade` | *Periya Purāṇam*, Tirunāvukkaracar Nāyaṉār Purāṇam, especially vv. 1681–1683 | Gold/gems episode is later saint-life; Appar's own hymns are a separate earlier evidence layer |
| `thirumangai-ring` | Śrīvaiṣṇava guruparamparā / Tirumaṅgai vaibhavam + *Periya Tirumoḻi* opening decad | Wedding party/ring/bundle are later hagiography; own poems support remembered wrongdoing/transformation but not those scene details; bride/bridegroom ring variant is disclosed |
| `kulasekhara-march` | Śrīvaiṣṇava Kulaśēkhara hagiography + *Perumāḷ Tirumoḻi* + modern source-lineage discussion | Army-march episodes are later saint-biography; Kulaśēkhara's own poems establish Rāma devotion but do not narrate those events |

## English read-aloud structural check

| Story | Short words | Full words |
|---|---:|---:|
| `amarniti-scales` | 334 | 680 |
| `sundarar-court` | 336 | 680 |
| `appar-spade` | 322 | 680 |
| `thirumangai-ring` | 352 | 659 |
| `kulasekhara-march` | 360 | 679 |

All five are inside the repository's hard English bands: short 300–360, full 650–680. Each rendition has exactly one final `slow` landing and short/full text is independently written.

## Hindi/Tamil review state

- `status: in-review`
- `measuredSeconds: null`
- `nativeReadAloud`: pending
- `languageEditor`: pending
- `sourceFidelity`: pending
- claim-level `sourceMap` present for tease, every scene, parent note, tradition note, and follow-ups
- local structural scan: no Latin-script reader prose outside canonical entity markers
- no human approval has been invented

## Hero/OG assets

| Story | Supplied source image |
|---|---|
| `amarniti-scales` | `ChatGPT Image 2 Oct 2026, 20_02_00-1.png` |
| `sundarar-court` | `ChatGPT Image 2 Oct 2026, 20_02_22-2.png` |
| `appar-spade` | `ChatGPT Image 2 Oct 2026, 20_02_32-3.png` |
| `thirumangai-ring` | `ChatGPT Image 2 Oct 2026, 20_02_45-4.png` |
| `kulasekhara-march` | `ChatGPT Image 2 Oct 2026, 20_02_56-5.png` |

The five supplied source images are mapped in `media-candidates.json`, and the local checkpoint workspace has processed `hero.webp` plus 1200×630 OG derivatives ready for promotion. The binary assets are not asserted as human-approved.

## Machine checks run for this checkpoint

A local batch-only structural check passed for:
- English hard word bands
- final/unique slow landing
- claim-reference bounds
- complete locale scene/source maps
- Hindi/Tamil Latin-leak scan outside entity markers
- `measuredSeconds` remaining null
- all human review gates remaining pending

Full repository `npm run validate:strict`, tests and build are intentionally deferred until promotion into the production content lanes, because this checkpoint is designed first to make the work durable without weakening or tripping existing production gates.

## Remaining 5

- `lingodbhava-pillar`
- `bhagiratha-ganga`
- `sukanya-anthill`
- `brahmin-and-the-pot`
- `sekkizhar-first-word`

## Resume rule

On any interruption, resume from this branch and this directory. Do **not** repeat broad research for the five completed packages. Promote these exact reviewed source bytes only after the global canon/lexicon/media/lock updates are ready.
