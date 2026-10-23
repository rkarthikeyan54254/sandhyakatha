# Rendition selection: pre-change safety review

Deterministic reproduction: use a locale story containing independently reviewed
`short` and `full` in the source JSON. Runtime currently strips `full`; Reader
selects `short` for every non-English locale, App resets selection to short on
language change and in an effect, and locale Tonight offers no duration control.
Thus selecting full in English then switching to Hindi/Tamil loses the selected
telling even when full text exists.

Affected state: React's ephemeral `len` and rendered/catalog rendition metadata.
No Profile field, child/account identity, history bucket, migration, sync,
sign-in, sign-out, add/delete, rename, age-change or repair callback is changed.
App edits only remove language-dependent length resets and correct analytics
mode/one-more values. `markHeard`'s profile mutation and sync body remain intact.

Invariants: preserve selected length across language changes; canonical story id
remains the history id; merely selecting length/language never records a reading
night; completion uses the existing child/story history path exactly once.
No full telling is inferred from duration, copied from short, or auto-approved.

Existing-user impact matrix: healthy one/multiple-child, anonymous and signed-in
profiles, account switches, first sign-in, sign-out/sign-in, stale/multiple devices,
rename/age-change/add/delete, ambiguous duplicate identities and concurrent writes
all retain their existing storage schema and Profile behavior. Length choice is
session-only and carries no family identity. Missing new catalog renditionMinutes
is an explicit incomplete-assets state, not permission to borrow English minutes
or fabricate a locale full telling.

Migration/rollback: none. Older catalog metadata may be read as the actual
short-only set but release gates forbid shipping that incomplete set. Rolling back
UI code does not change profiles. No automatic family repair is performed, and
ambiguous ownership/history is never guessed.

Reader lifecycle reproduction: complete one story, then open its linked next
story. Without a canonical-id React key, the old Reader's completion guard and
completed view survive the story change; the next completion can be skipped.
The proposed fix keys Reader by canonical story id. Different stories reset only
ephemeral completion controls; switching languages on the same story retains
them. No history is cleared or reattributed. Regression tests must complete both
stories in sequence in every language and check their distinct canonical ids.

Verification: interaction tests retain full/short choice across languages, assert
selection does not modify persisted profiles and completion retains canonical id;
render tests show distinct selected locale text and length controls. Run existing
App session and persisted-profile suites (healthy/corrupt/stale/multi-device,
account round trips, rename/age/add/delete/concurrent paths), all tests and typecheck.
Production build remains blocked by the known catalog-wide parity backlog; it
must pass before deployment. This is not a persisted-state repair or migration.

## Shared family-controls access (Tonight)

Deterministic reproduction: render Tonight with the same Profile and callbacks
in English, Hindi and Tamil. The early native return omits the child selector,
name/age inputs, add/remove controls, conflict repair and difficult-story gate.
English exposes them. This is an access defect, not corrupted persisted state.

Implementation boundary: extract the existing family-control JSX into one shared
component, invoke it from both Tonight branches, and supply native labels. Keep
all existing App mutation callbacks, profile functions, identity rules, storage,
authentication and sync paths unchanged. Fields exposed remain children, activeId,
heard and gate; no new stored field, migration or automatic repair is introduced.
Existing paths are App callbacks -> profile add/patch/remove/setActive/setGate/
repairDuplicateId -> existing save/sync. The UI must forward the exact same ids,
patches and explicit history-owner index. Removing a child with history still
requires two clicks. Conflicts suppress ordinary controls and preserve ambiguity.

Impact matrix: healthy one/multiple children, signed-out local, first anonymous
sign-in, same-account sign-out/in, different account, independent second-device
child ids, rename, age change, add/delete, same name+age/different ids, same id with
changed metadata, malformed duplicate ids, stale/concurrent writes, old profiles
and older tabs all retain their existing mutation/reconciliation behavior.
Native parents gain the same explicit controls; no action runs during rendering
or language switching. No identity/history repair is guessed in any state.
Rollback removes access only; stored format and reconciliation remain compatible.

Validation: render/interaction regression across all three languages for selection,
rename/age/add, explicit gate change, two-click history deletion, and ambiguous
conflict owner choice. Run the existing full profile/session/sync tests for the
matrix and typecheck. Production release stays blocked by catalog parity until
all required editorial and release gates pass; this UI change is not deployable
by itself.

## Native AccountPanel access and copy

Reproduction: English Tonight renders AccountPanel; native early return omits it.
Use the same component in both branches with locale-specific copy. No auth,
sync, sign-out or recovery-code implementation changes. Preserve callback order,
unsaved sign-out refusal and pending-backup truthfulness. UI error states use
stable local keys so language switching updates messages without a new action.
The existing-user matrix above is unchanged: no new fields, migration, repair or
account reconciliation. Tests must cover all languages, backup pending versus
acknowledged, sign-out refusal, disabled backup, code creation and code use.
