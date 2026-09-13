# Sandhya Katha — coding-agent guardrails

These rules are repository policy. Read them before changing code.

## Persisted user state is not a normal bug-fix surface

Before changing anything that reads, writes, merges, migrates, deletes, identifies, or synchronizes family/account state (`src/lib/profile.ts`, `src/lib/sync.ts`, `netlify/functions/profile.mts`, authentication/session code, or any code that mutates `Profile`), **read `docs/PERSISTED-STATE-SAFETY.md` first**.

Do not jump from a reported symptom to a patch. A persisted-state change must begin with:

1. a deterministic reproduction;
2. explicit data invariants;
3. an existing-user impact matrix;
4. backward-compatibility and migration analysis;
5. tests for healthy, corrupted, stale-device, multi-device, sign-out/sign-in, rename, age-change, add, delete, and concurrent-write paths;
6. a statement of which states can be repaired automatically and which are ambiguous and must not be guessed.

The primary invariant is: **never lose, misattribute, duplicate, or silently resurrect a family's reading history in order to make the UI look correct.**

A fix is not complete because the screenshot looks right. It is complete only when existing stored profiles remain safe and the relevant round trips are covered by tests.

## Editorial work

For story/content changes, `EDITORIAL.md` remains authoritative. Source fidelity and the hard review gates must not be weakened for speed.
