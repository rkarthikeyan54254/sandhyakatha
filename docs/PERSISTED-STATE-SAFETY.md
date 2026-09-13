# Persisted-state safety policy

Sandhya Katha's family history is accumulated product value. A parent can recreate a UI preference; they cannot recreate months of remembered reading nights. Code that touches persisted profile/account state therefore follows migration discipline, not ordinary bug-fix discipline.

## The invariant hierarchy

In this order:

1. **Never lose a recorded reading night.** `heard` is historical ground truth. A merge must be monotonic unless the parent explicitly deletes the child whose history is being removed.
2. **Never misattribute a reading night.** UI cleanup is not permission to move history between children when identity is ambiguous.
3. **Never cross account boundaries.** State owned by one account must never merge into another account.
4. **Child IDs are unique in healthy profiles.** A legacy profile may already contain duplicate IDs because of an older sync bug. Identical duplicate rows may collapse safely; conflicting rows must be preserved until the parent resolves them.
5. **Same ID beats heuristic identity only across healthy copies.** Across two healthy copies, matching child IDs identify the same logical child even when name or age changed. If one stored copy already contains two different child rows under the same ID, identity is ambiguous and must not be guessed. Name+age remains only a fallback for independently created IDs on different devices.
6. **Explicit deletion must stay deleted.** Absence is not enough to encode deletion in an additive merge. Deletion needs durable intent that survives refreshes, stale devices, and sign-in round trips.
7. **Healthy profiles must remain healthy.** Migration/normalization must be idempotent and must not rewrite meaningful fields unnecessarily.
8. **Signed-out remains local-first; signed-in adds durability, not different semantics.**

## Required pre-change review

Before implementation, write down:

- exact symptom and deterministic reproduction;
- affected persisted fields;
- all read/write paths touching those fields;
- existing-user state matrix;
- migration/rollback behavior;
- automatic-repair rules;
- ambiguous states that must not be guessed;
- tests that prove the invariants above.

Do not implement until this review is coherent.

## Minimum existing-user matrix

Every persisted-state change must reason through at least:

- healthy one-child account;
- healthy multi-child account;
- signed-out local profile;
- first sign-in with anonymous local history;
- sign-out then sign-in to the same account;
- a different account on the same browser;
- second device with the same child independently created;
- child rename;
- child age change;
- child addition;
- child deletion;
- same name+age with different IDs;
- same ID with changed metadata;
- malformed duplicate IDs already stored;
- stale server write / concurrent device update;
- older stored profile missing newly added optional fields;
- older browser tab writing after a newer client has migrated the profile.

## Repair policy

Automatic repair is allowed only where historical meaning is preserved.

Safe examples:

- fold exact duplicate rows with the same child ID and the same metadata;
- union `heard` by child/story and retain the earliest first-read date;
- union rereads and retain the latest reread date;
- repoint `activeId` when its row no longer exists.

Unsafe examples:

- fold different child IDs merely because they share name+age inside one already-stored profile;
- split one shared history bucket between two children by guessing;
- collapse two different child rows that share one corrupted ID; ask the parent which child owns the shared history instead;
- overwrite account history with a cleaner but less complete local copy;
- infer deletion from a child being absent in one copy.

When a state is ambiguous, preserve data and surface/record the conflict rather than invent history.

## Deletion rule

Profile synchronization is otherwise additive. Therefore child deletion must be represented as durable deletion intent (for example a tombstone) and must be honoured by both client reconciliation and server writes. A stale or older client must not be able to resurrect a deliberately deleted canonical child merely by sending an older profile.

## Identity rule

`Child.id` is the canonical identity after reconciliation.

When merging two profile copies:

1. same ID across two healthy copies => same child; newer metadata may update the row, but a second row must never be created;
2. different IDs + same normalized name and age => may be treated as the same child only as the cross-device fallback already required by first-time independent setup, and only when that identity key is unique on both copies;
3. different IDs + different identity key => different children.

For signed-in reconciliation, the existing account/server ID is canonical when the unique name+age fallback folds an independently-created device ID. Recency may update name/age metadata; it must never silently replace the durable account identity. The server enforces the same fallback as a safety net for older browser builds.

Within a single profile, duplicate IDs are corruption. If duplicate rows have identical metadata, collapse them. If the rows disagree on name or age, preserve the conflict and require an explicit parent repair. A safe repair gives every conflicting row a fresh ID, tombstones the corrupt shared ID, and moves the existing history only to the child the parent chooses.

## Completion gate

A persisted-state fix is not ready until:

- the reported bug has a regression test;
- the matrix above has targeted coverage for the affected paths;
- `npm test`, `npm run typecheck`, and the production build pass;
- round-trip tests prove reading history survives sign-in/sign-out and multi-device merge;
- deletion cannot resurrect after refresh;
- a healthy pre-change profile produces the same meaningful history after normalization;
- any new stored field is optional/backward-readable or has an explicit migration;
- rollback/old-client behavior has been considered.

If any of those fail, the change goes backward. The gate is not lowered to ship the UI fix.

## Concurrency and independent clocks

A profile-wide `updatedAt` is not an authority for every field. Reading a story
may advance the profile/history clock, but it must never thereby claim that a
child name, age, active selection, or difficult-story setting was edited.

Required clocks:
- child metadata: one clock per child id
- active child selection: its own clock
- difficult-story gate: its own clock
- reading history: monotonic union, not last-writer-wins

Legacy profiles may materialize these clocks from their old `updatedAt` once on
upgrade. After that, unrelated actions must not advance them.

Account writes are compare-and-swap operations. A server write must read the
current value with its ETag, reconcile monotonically, conditionally write with
`onlyIfMatch`/`onlyIfNew`, and retry on an ordinary precondition conflict. A
reported conditional-write success without a non-empty ETag is not an
acknowledgement and must be treated as failure.

## Retired ids and late stale activity

Deliberate child deletion and identity repair are different operations. A stale
old tab writing after a deliberate deletion may be ignored. A stale old tab
writing history under an id retired by identity repair must not be discarded,
because that history may be real and its new child attribution is unknowable.
Preserve it in a quarantine bucket for explicit recovery rather than guessing.

## Truthful backup state

The UI may say "Everything is backed up" only after the current local snapshot
has received a server acknowledgement. While a local mutation is waiting to
sync, or after a sync failure, say that it is saved on this device and backup is
pending. Never turn a swallowed network error into a false durability claim.
