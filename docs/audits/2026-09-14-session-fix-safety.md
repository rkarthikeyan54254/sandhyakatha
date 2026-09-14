# P1 session fixes: pre-change safety review

## Reproduction and scope

The isolated production-function harness reproduces #1 (fresh empty local clock defeats server adoption), #2 (GET 401 followed by sign-out clears unuploaded history), and PUT 401 falsely resolving sync. Reproduced before implementation on 0ab2189.

Affected state: the entire Profile at App adoption/clear boundaries, plus backup-pending UI state. Profile fields, storage format, normalization, child identity, independent clocks, tombstones and quarantine semantics remain unchanged. Paths: load/save, local mutation, initial/account refresh, completion sync, debounced settings sync, sign-out. No production profile is used for testing.

## Invariants and approach

- Adopt a server result only if the request's exact local snapshot is still current and its account generation is still active. Wall-clock ordering is not an adoption authority.
- If a local edit intervenes, retain it and retry reconciliation against the latest snapshot; bounded exhaustion leaves backup pending, never a false success.
- GET 401 is a no-op only for anonymous local state. Account-owned state requires reauthentication. PUT requires an actual profile acknowledgement; 401, 204 and missing profile are failures.
- Sign-out can clear only the unchanged snapshot acknowledged for the same owner. Edits during backup or sign-out remain local even if the cookie has already been cleared.
- Account refresh invalidates earlier responses. The server rejects a profile explicitly owned by a different authenticated account, including cookie changes between GET and PUT.

## Existing-user matrix and coverage

| State | Required outcome / coverage |
|---|---|
| Healthy one/multiple children | Exact snapshot adoption; preserve all nights; session tests + round trips |
| Anonymous local / first sign-in | Signed-out sync stays local; signed-in history still merges; sync tests |
| Same-account sign-out/sign-in / fresh device | Older saved profile adopted; round-trip + adoption regression |
| Different account / late prior response | No cross-account merge; generations reject old responses; owner checks |
| Independent device IDs / same name-age | Existing unique cross-copy canonicalization unchanged; sync/profile/server tests |
| Rename / age / addition / active / gate | Intervening mutation prevents replacement; retry latest; parameterized adoption tests |
| Deletion / stale device | Tombstone preserved, no resurrection; profile/server/round-trip tests |
| Same ID changed metadata | Existing per-child clocks retained; profile/server tests |
| Conflicting duplicate IDs | Preserve ambiguity and shared history; no guessed repair; round-trip/profile tests |
| Concurrent writes | CAS/merge tests remain; late local mutation tests added |
| Missing optional legacy fields | Existing normalization unchanged; legacy tests remain |
| Older tab after upgrade | No new persisted fields; existing server reconciliation/tombstone/quarantine tests remain |
| Expired GET/PUT, network failure, CAS exhaustion | No sign-out clear; exact stored snapshot retained; failure regressions |

## Migration, repair and rollback

No schema migration or new stored field. Healthy profiles retain meaningful state. Safe automatic action is restoring an authenticated server snapshot or existing conservative reconciliation. Already-lost unuploaded history cannot be reconstructed. Corrupt identity/history ownership remains ambiguous and requires the existing explicit parent repair. Never guess or rewrite it as part of these fixes.

Rollback reads the same v1 profiles, but reintroduces the client bugs; deploy both client and server guard together. Old clients setting the correct owner remain compatible. Cross-account old-client writes are rejected rather than misattributed. Existing server CAS and history union remain authoritative.

## Verification

Regression tests exercise the real App hooks and persistence effects using React's development-only test renderer, with presentation components and network/storage isolated. Covered fresh restore, GET/PUT 401 sign-out, same-account round trip, edits during sync/logout, account replacement and late prior-generation responses. Unit cases additionally cover acknowledgement shape, anonymous use, clock-independent mutation preservation, retry-time anonymous edits and exhausted CAS. Server handler tests cover cookie/account mismatch and legacy/same-owner compatibility. No live family history is mutated by these checks.
