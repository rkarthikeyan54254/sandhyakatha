# Panchanga V2 — Bharat Observance Architecture

Status: architecture baseline
Scope: Sandhya Katha daily-story selection
Shared astronomy: Nal Naal / Swiss Ephemeris
Editorial principle: astronomical fact, observance tradition, and story relevance are separate data layers.

## Why V2 exists

Sandhya Katha's current `content/panchanga.json` is a useful astronomical table,
but its festival layer is intentionally small. The current picker can match a
story against a festival slug, tithi, lunar month, or season. That was enough
for the first version of Tonight, but not for the product thesis:

> Sandhya Katha tells a family the right source-checked story for tonight,
> rooted in the calendar and traditions that make the story matter.

The calendar must therefore be broader than the story corpus. We first curate
what is observed; only then do we ask whether Sandhya Katha has a direct or
related story.

A missing story is a corpus gap, not a reason to omit an observance.

## Non-goals

V2 is not:

- one supposedly universal "Indian Panchanga";
- a Tamil-only calendar;
- a list reverse-engineered from stories we already have;
- a rule that assigns a deity to every nakshatra and treats that association as
  an annual observance;
- a runtime translation or AI-generated festival layer;
- a replacement for documented regional or sampradaya differences.

## The four layers

### 1. Ephemeris — astronomical facts

This remains generated offline with Swiss Ephemeris and Lahiri ayanamsa.

The existing Sandhya Katha generator already records:

- amanta lunar month;
- purnimanta month name for the dark fortnight;
- paksha;
- tithi;
- nakshatra;
- Tamil solar month/day;
- season;
- adhika month;
- repaired kshaya-tithi cases.

V2 should evolve from a single 06:00 sample to time-aware transitions where
they are needed:

- sunrise and sunset;
- tithi start/end;
- nakshatra start/end;
- optionally moon/sun longitudes used to derive them.

The 06:00 row may remain as a convenient daily summary, but annual observance
resolution must be able to apply sunrise, madhyahna, pradosha, nishita/midnight,
and similar rules without hand-entering Gregorian dates whenever the rule is
known.

This layer is shared conceptually with Nal Naal. It contains no Sandhya Katha
story ranking.

### 2. Observance corpus — cultural/editorial truth

A separate curated corpus defines annual observances independently of our story
inventory.

Examples include:

- major deity and avatara jayantis;
- annual vratas and tithi observances;
- Navaratri and other multi-day sequences;
- Alvar tirunakshatrams;
- Nayanmar gurupujas;
- acharya and saint observances;
- regional festival systems;
- documented temple/sampradaya observances when relevant to the corpus.

Every record carries provenance, scope, and confidence.

The corpus distinguishes:

- broadly attested / pan-Indian;
- tradition-specific;
- regional;
- temple-specific;
- disputed or variant.

We do not flatten these into one claim.

### 3. Annual resolver — "what is observed today?"

The resolver combines the ephemeris with observance rules and produces all
matching observances for a date/location/convention.

A day may have zero, one, or many observances.

The output preserves every eligible match; it does not discard lower-priority
observances merely because a higher-priority one exists.

Priority answers:

> Which observance is most prominent for Tonight?

It does not answer:

> Which observance is true?

Where traditions produce different observance dates, both may exist with
explicit scopes.

### 4. Story mapping + Tonight ranking

Stories do not define the calendar.

A separate editorial mapping connects an observance to zero or more canonical
stories.

A mapping is classified as:

- `direct` — the story narrates or centrally explains the observance;
- `strong-related` — the same deity/person/event is strongly connected, but
  this is not the defining narrative;
- `related` — useful on the day, but should never be presented as the origin or
  defining story.

The picker ranks only after today's observances have been resolved.

A future Tonight score can combine:

- observance importance;
- story-observance relevance;
- child-age fit;
- recency;
- family repeat request;
- reviewed language availability;
- stable date/story jitter for deterministic tie-breaking.

The observance layer is never reweighted merely because Sandhya Katha happens
to own a story.

## Rule families V2 must support

The resolver should be designed for at least:

1. lunar month + paksha + tithi;
2. lunar month + nakshatra;
3. solar month + nakshatra;
4. solar month + solar day;
5. weekday inside a month/window;
6. tithi-only recurring vrata;
7. nakshatra-only recurring observance where genuinely documented;
8. multi-day ranges such as Navaratri;
9. relative rules such as "day after X";
10. explicit yearly override when the general rule cannot yet resolve a
    documented exception;
11. tradition/region-specific variants of the same observance identity.

The rule engine should be extended only when a sourced observance requires a new
rule family.

## Geography and convention

Sandhya Katha is Bharat-wide.

We should model one astronomical day plus documented observance interpretations,
not pretend that every Panchanga convention is identical.

Important dimensions include:

- amanta versus purnimanta lunar month naming;
- Tamil and other solar calendars;
- location-dependent sunrise and day boundaries;
- festival-specific decision windows;
- regional practice;
- sampradaya calendars.

The location used for astronomical resolution is an input. Tradition and region
are observance metadata.

## Relationship to Nal Naal

Nal Naal remains a useful reference implementation for:

- Swiss Ephemeris / Lahiri astronomy;
- Tamil solar month/day;
- sunrise/sunset;
- tithi and nakshatra;
- override discipline;
- explicit source/confidence on hand corrections.

We deliberately do not copy into Sandhya Katha:

- Tamil-only festival coverage as the complete observance universe;
- daily nakshatra-deity blessings as if they were annual observances;
- image/audio/temple presentation fields inside the core calendar truth;
- fixed Gregorian dates where a reusable sourced recurrence rule can be
  represented.

## Observance research waves

The corpus will be built independently of story availability.

### Wave A — major Bharat-wide observances
Major deity/avatar jayantis, principal festivals, major annual vratas, and
important multi-day sequences.

### Wave B — Vaishnava
Alvar tirunakshatrams, principal acharyas, and major Vaishnava observances.

### Wave C — Shaiva
63 Nayanmar gurupujas / principal Shaiva observances and acharyas.

### Wave D — Shakta / Devi
Major Devi observances and documented regional variants.

### Wave E — regional calendars
Tamil, Kerala, Karnataka, Andhra/Telangana, Maharashtra, Gujarat,
Bengal/Odisha, North Indian and other major systems relevant to the corpus.

### Wave F — other saints / philosophical lineages
Only with explicit source and tradition scope.

## Coverage is a first-class metric

Once the observance corpus exists, Sandhya Katha can report:

```text
total curated observances
major/high-priority observances
observances with direct published story coverage
observances with related-only coverage
observances with draft-only coverage
observances with no story
coverage percentage overall
coverage percentage for major observances
```

This is an editorial planning metric, not a user-facing score.

## Product behavior when coverage is missing

The system must be able to say, internally and eventually in product copy:

> Today has an important observance for which we do not yet have a
> source-checked story.

That is preferable to inventing a weak relationship.

Tonight may then select:

1. another directly mapped observance on the same date;
2. a strong-related story if editorially permitted;
3. an age-appropriate evergreen story.

The explanation must reflect what actually happened.

## "Why tonight" contract

The future explanation should be derived from the resolved observance and
mapping, for example:

> Today is Vamana Jayanti. This story directly tells the Vamana avatara.

or:

> Today is Sundarar's gurupuja in the Tamil Shaiva calendar. This telling comes
> from his life.

If an evergreen fallback is chosen, the product must not imply a calendar
connection that does not exist.

## Editorial gates

An observance cannot enter production Tonight matching until:

- identity is sourced;
- recurrence rule/date basis is sourced;
- tradition/region scope is explicit;
- each source supports the field it is cited for;
- confidence/review status passes;
- generated dates validate;
- known cross-calendar disagreements are recorded rather than hidden.

A story mapping cannot enter production until:

- canonical story exists;
- relationship is manually curated;
- relevance class is explicit;
- explanation is human-readable;
- direct/related claims do not contradict the story's own source notes.

No relationship is inferred from shared names alone.

## Data products

V2 is expected to produce these independently:

```text
content/observances/...
schema/observance.schema.json
content/observance-story-map.json
public/data/observances.json
reports/observance-coverage.json
```

## Migration

Do not delete the current story `calendar` fields immediately.

Migration sequence:

1. build and validate observance corpus;
2. generate annual dates;
3. create explicit observance-story mappings;
4. compare V2 results against current picker behavior;
5. switch Tonight to V2 behind gates;
6. retain legacy calendar metadata until equivalence/regression checks are green;
7. remove/reduce legacy fields only in a separate cleanup.

## Success criteria

Panchanga V2 is successful when:

- today's observances are richer than the current small festival table;
- important observances may exist even without a Sandhya Katha story;
- multiple same-day observances are preserved;
- regional/sampradaya differences are explicit;
- the picker can explain exactly why a selected story belongs tonight;
- observance coverage produces a concrete editorial backlog;
- no generated or weakly inferred relationship compromises source trust.
