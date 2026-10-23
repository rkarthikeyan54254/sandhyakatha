# Rāvaṇa’s last rites — October 23 publication preparation

Open `review.html` for English, Hindi and Tamil Short/Full candidates and the
user-supplied hero. Exact candidate source/locale JSONs are under `en/` and
`locales/`. `tellings.json` is the working editorial transcription, not a claim
of byte-for-byte preservation of the user’s message. Changes are documented in
`SOURCE-REVIEW.md`; `prepare.mjs` and `finish-review.mjs` reproduce the packet.

Status: not live, no production content/lock changes. New-story human native
review and actual read-aloud timings remain pending. The user authorized
publication, but the pasted ChatGPT notes themselves identify those reviews as
pending. Earlier repair-packet approvals are scoped to different story IDs.

Mechanical checks pass for three schema-valid editions / six tellings: English
302/652 words with three/six calculated minutes, native script, complete separate
lengths, source pins, mapped scene claims, balanced speech and final landings.
This does not certify native voice, actual delivery time, art layout or source
collation. The selected prose witness was inspected; direct Sanskrit retrieval
was unsuccessful and is not claimed as checked.

The current catalog release parity gate is captured in
`evidence/catalog-release-gate.log`. Do not bypass it. Next exact action: obtain
human review/timings of this rendered packet while continuing independent source,
asset and registration preparation. Full production build, visual QA, commit/PR,
deployment and live verification remain outstanding.

## Publication approval received and local registration complete

On 2026-10-23 Rama confirmed all three languages reviewed, Full six minutes,
Short three minutes, and good to publish. `approval.json` binds the reviewed
files; timings are user-reported whole minutes. Earlier pending statements in
the frozen review packet are superseded by this approval. No more review is
requested for this unchanged package.

Registered English/Hindi/Tamil, human source/language/read-aloud approval, exact
source pins/locks, canon, hero, public/preview/social configurations and three
share cards. Converted hero WebP and inspected all share cards. Used the existing
controlled facet `stopping when you have won`; spoken content is unchanged.
Preparation scripts now refuse to overwrite the approved packet.

Canonical strict validation, locale and native-editor gates pass. All194 tests
and typecheck pass. Isolated new-story runtime/public renderer gates verify both
complete tellings and exact blocks; see `evidence/new-story-verification.json`.
This fixture is QA only and does not waive catalog-wide release checks.

**Not live.** Full `npm run build` fails on416 pre-existing locale parity errors,
none for this story. No deployment was attempted. `publication-receipt.json`
records approved files and remaining release blocker. Next action is catalog
parity repair, then full build/visual/production verification.
