# Hindi Multilingual Parity Backlog

Status: deferred after the first five-story public Hindi shelf.
Resume this document before treating Hindi as a first-class in-app language.

## Product principle

**Language is an edition of a story, not a different story.**

A story heard in Hindi and the same story heard in English must keep one canonical
story identity for family history, favourites, constellation progress, analytics,
source provenance, and account sync.

Hindi coverage is intentionally smaller than English coverage. Do not create
superficial parity by machine-translating the rest of the corpus. A locale edition
becomes public only after independent read-aloud, language, and source-fidelity
review, and explicit publication.

## Current foundation

- Five reviewed Hindi editions are public-shelf candidates:
  - `rama-returns`
  - `govardhana`
  - `ganesha-circles`
  - `durga-mahishasura`
  - `hanuman-reminded`
- Public Hindi discovery is intentionally a small shelf at `/hi/`.
- Public Hindi story routes use `/s/<story>/hi/`.
- English and Hindi editions retain the same canonical story ID.
- Locale editions are source-byte pinned, human-reviewed, locked, and explicitly
  allowlisted before publication.
- Preview URLs remain noindex handoffs after promotion.
- English/Hindi public story pages have reciprocal hreflang metadata.
- Brand/logo treatment is aligned across app, locale preview, and public locale
  surfaces.
- Hindi WhatsApp/Open Graph sharing uses the same story-specific share-card
  quality as English, with localized title/description/share text.
- The English Shelf exposes Hindi as a separate **Language editions** doorway,
  explicitly labelled as **5 reviewed stories**, rather than implying full corpus
  parity.

## Parity backlog

| Area | Current state | Parity target |
| --- | --- | --- |
| Public story page | Strong | Preserve source, age guidance, care notes, close, `ifTheyAsk`, art, language switch, and canonical story ID |
| Brand / logo | Aligned | Keep one Sandhya Katha diya/wordmark identity everywhere |
| WhatsApp / OG sharing | Structurally aligned | Same story-specific card quality; localized title, description, and share text |
| Shelf discovery | Intentional non-parity | English remains full shelf; Hindi remains explicit reviewed subset until coverage is large enough |
| Story identity | Foundation exists | Never create locale-specific story history IDs |
| Lexicon / tappable names | Not at parity | Hindi names should open the same canonical pronunciation/gloss experience; decide whether gloss is Hindi or bilingual |
| Pronunciation | Needs review | Reuse canonical pronunciation data unless an explicitly reviewed locale-specific presentation is needed |
| Tonight's story | Not integrated | If Hindi is chosen, Tonight must select only approved Hindi editions; never translate at runtime |
| Language preference | Not designed | Decide family-level vs session-level preference, persistence, and fallback behavior |
| In-app Reader | Not integrated | Hindi should eventually use the same Reader flow, not only static public pages |
| Short / full / one-more modes | Partial | Decide which reading modes receive independently reviewed Hindi editions |
| Reading history | Not connected from static pages | Hearing Hindi `govardhana` must mark canonical `govardhana` heard |
| Again / favourites | Not connected | Operate on canonical story identity across languages |
| Child age filtering | Not connected | Reuse canonical min-age and sensitivity rules across languages |
| Account sync | Not connected | Language must not alter history ownership; language preference, if stored, should be separate |
| Constellation / Map | Canonical graph reusable | Preserve curated edges; decide localized entity-label and gloss behavior |
| Entity display names | Partial | Define consistent Rāma/राम-style rules across Reader, Map, Shelf, share, and lexicon |
| Close question / follow-ups | Present on public pages | Preserve equivalent behavior if Hindi moves into Reader |
| Source attribution | Strong | Work, locus, regional/recension distinctions, and source claims must remain source-identical |
| Corrections / reporting | Needs decision | Decide whether public Hindi gets the same correction-reporting path as English |
| Analytics | Deliberately minimal | Keep existing event contract; add language only if needed without multiplying story identity |
| Offline / PWA | Not at parity | Define locale asset/data caching before claiming full offline Reader support |
| Search / indexing | Public SEO covered | Decide whether app discovery treats language as an attribute or separate search dimension |
| SEO / hreflang | Good foundation | Keep self-canonicals, reciprocal alternates, and preview exclusion |
| Festival pages | English-only | Surface Hindi editions later only when there is enough reviewed coverage |
| Corpus landing pages | English-only | Avoid thin localized corpus pages until coverage justifies them |
| RSS / feeds | English-only | Defer until locale publishing strategy is mature |
| Accessibility | Partial | Verify screen-reader language switching, focus order, Devanagari labels, and accessible language-switch names |
| Typography / spacing | Visually good so far | Test long Hindi titles, notes, buttons, follow-ups, and share surfaces on small phones |
| Fallback behavior | Must be specified | Never silently auto-translate; clearly offer English or another approved Hindi story |
| Review / lock discipline | Strong | Keep human review, source-byte pinning, locale locks, and explicit publication allowlists |
| Future Tamil parity | Architecture candidate | Reuse the same locale contract; avoid Hindi-specific product logic |

## Highest-priority work if Hindi becomes a first-class app language

1. **Tonight** — language-aware selection restricted to approved locale editions.
2. **Reader + history identity** — one canonical story across languages, including
   heard state, Again, favourites, and account sync.
3. **Lexicon** — canonical entity identity with reviewed localized display/gloss
   behavior.

## Intentional asymmetry

Five Hindi stories versus the larger English corpus is acceptable.

Do not hide the count, and do not apologize for it. The product should say what
exists today: **5 reviewed Hindi stories**. More should appear only after review.
