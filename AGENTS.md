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

## Session and weekly usage discipline

For growth operations, start with `studio/ops/GROWTH-OPS-STATE.md` and a targeted repository status check. Use full handoffs only to resolve a specific missing detail.

Complete one bounded deliverable with saved evidence before opening another. Aim for a first saved artifact/checkpoint within about ten minutes; this is a planning target, not a guarantee or a reason to skip required gates. Check usage at the start and after substantial units when tools support it, reserving roughly 20% for finishing and other work. Account limits are shared; avoid promising fixed task counts or hard quota enforcement.

Batch independent reads, reuse known connector fields, avoid repeated broad scans and unchanged successful checks, and use no subagents unless explicitly requested. After two unchanged external failures, checkpoint the blocker and continue independent work. Save completion evidence, remaining work and the next exact action in the ops state after each unit. User authorization and all editorial/persisted-state safety requirements still apply.

Before creating or editing anything under `content/locales/**`, read the
**native-language moat** section of `EDITORIAL.md` and
`content/native-language-moat.json`.

- Do not translate the English title first and then polish it. Formulate a title
  natively from the canonical event and claims.
- Do not use English sentences as the syntax template for localized prose.
- External native publications are style/register references only, never story
  sources.
- AI/Codex/Astra may draft and self-audit, but must leave `languageEditor`
  pending until a human native-language reviewer approves it.
- Never promote or lock a locale edition that fails
  `scripts/native-language-gates.mjs`.
