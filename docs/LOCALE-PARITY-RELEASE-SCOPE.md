# Locale parity release scope

New and changed published stories must have reviewed, separately authored Short
and Full tellings in English, Hindi and Tamil, matching durations and parent
material. Existing source, human language/read-aloud, source-pin, approval and
lock gates apply to every shipped edition.

On 2026-10-23 the owner authorized releasing the approved `ravana-last-rites`
story while unchanged legacy gaps are repaired separately. The initial
`content/locale-parity-baseline.json` records 404 mechanical findings in 134
legacy editions:124 missing Full tellings,124 missing Full review keys,124
mismatched Short timings and 32 parent-question count differences.

The baseline is sealed by entry digests in
`scripts/lib/legacy-parity-seal.mjs`. It may only shrink. A canonical or locale
content/review change invalidates its exception. New IDs cannot be added and
review/source/lock/identity checks are never waived. No timing, approval or
missing text is manufactured. Runtime and static pages retain only actual
reviewed tellings; unavailable Full text is never silently substituted.

`npm run validate:strict` gates prospective releases under that scope.
`node scripts/locale-parity-gates.mjs --catalog` and
`node scripts/audit-locale-parity.mjs` continue to report the full backlog.
A passing release does not certify that catalog parity is complete.

When repairing a legacy edition, author and review the missing content, obtain
actual timing, rebind its source pin and locks, and remove the obsolete baseline
entry. Never update an entry to cover edited content or grow the sealed set.
