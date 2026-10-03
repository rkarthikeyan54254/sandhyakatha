# Hindi staged-locale QA — 2026-10-03

All five draft files are complete under this directory. Each is `in-review`, uses native-script display names, has both independent renditions and a canonical-claim `sourceMap`, and leaves `measuredSeconds: null`. Every language-editor, native read-aloud and source-fidelity review gate remains `pending` with no reviewer or approval date.

| Story | Short words | Full words | Automated staged-file checks |
|---|---:|---:|---|
| `lingodbhava-pillar` | 322 | 669 | PASS |
| `bhagiratha-ganga` | 305 | 654 | PASS |
| `sukanya-anthill` | 310 | 668 | PASS |
| `brahmin-and-the-pot` | 313 | 680 | PASS |
| `ravana-lifts-kailasa` | 300 | 651 | PASS |

Automated checks run on all five: locale JSON schema, canonical Git blob SHA-1 linkage (including the revised English Bhagīratha file), source version, source-claim reference bounds, scene coverage, one final `slow` block in each rendition, short/full whitespace-word bands, rendered Devanagari without Latin leakage, lexicon keys for all display names, null timing and pending human-review state. These word counts are drafting targets, **not measured read-aloud durations**.

Native-first titles: “फूल की गवाही”, “नदी के पीछे चलता राजा”, “सुकन्या का दूसरा चुनाव”, “जौ के सत्तू से शुरू हुआ सपना”, and “कैलास हिला, रावण रुक गया”. The Hindi prose was drafted from the source claims and scene sequence; it still requires rendered-page review by a human Hindi editor, a human source-fidelity review, and actual timed read-aloud review before any locale approval or public promotion. The Brahmin story especially needs an editorial check that its long version’s 680 words remain engaging without repetition. No publication, manifest edit or lock is part of this checkpoint.
