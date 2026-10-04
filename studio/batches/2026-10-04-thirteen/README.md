# Thirteen-story editorial queue — 4 October 2026

This batch starts from production `main` at `78d15e8`. The thirteen entries below are canon plans, not publication-ready stories. The retired Jain Rāvaṇa entry is outside this queue. The goal is to bring each eligible story through source grounding, English and native-language editorial review, art, technical validation, and release; a failed source or human-review gate remains a recorded hold rather than an inferred approval.

| Group | Canon IDs | Current state | Next gate |
| --- | --- | --- | --- |
| Early four | `lakshmana-rekha`, `kabir-shroud`, `mira-cup`, `narsinh-hundi` | Source audit underway | Primary/source witness and editorial decision; Kabīr scope is unresolved in `EDITORIAL.md` |
| Middle four | `janabai-grinding`, `bhasmasura-hand`, `boy-insults-shiva`, `sekkizhar-first-word` | Source audit underway | Verify exact claims; Sēkkiḻār's prior hook was not grounded in the checked witness |
| Gated five | `kannappar-eyes`, `siruttondar`, `kotpuli`, `iyarpagai`, `daksha-sacrifice` | Source and care audit underway | Primary witness, age/care suitability, explicit parent gate |

## First source audit checkpoint

The three group audits are saved in `early-four/source-decision.md`, `middle-four/SOURCE-AUDIT.md`, and `gated-five/EDITORIAL-DECISIONS.md`. They are research records, not approvals. Seven canon planning claims were corrected where the checked witnesses contradicted the old phrasing; `iyarpagai` now also flags the source's violence and deaths. Strict canonical validation still passes with 80 written stories and zero warnings.

The immediately draftable English candidates are Pārvatī's visitor, Kaṇṇappar, and Dakṣa, subject to claim-by-claim ledgers and age/care review. `siruttondar`, `kotpuli`, and `iyarpagai` have source anchors but need exceptional presentation scrutiny. The other seven need a specific witness or episode-boundary decision; Kabīr additionally needs the explicit collection-scope decision required by `EDITORIAL.md`. The early-four source search is continuing before a final draftability verdict.

No story or locale in this batch is approved or published yet. An AI draft or self-audit cannot satisfy the human English read-aloud or Hindi/Tamil `languageEditor` reviews. A native edition must be authored from canonical claims, not translated from English syntax, and must pass `scripts/native-language-gates.mjs` before any promotion or lock. Each review proof must preserve the exact reviewed text and imagery so approval can be tied to hashes and measured timings.

The first bounded deliverable is the source-and-suitability audit for all thirteen. After that, prepare only grounded English stories and build a review proof; collect human editorial decisions before creating or promoting public locale editions. Save gate results, remaining work, and the next exact action here and in `studio/ops/GROWTH-OPS-STATE.md` after each unit.

The current per-story state and exact next actions are in [STATUS.md](STATUS.md). Four English drafts are now in the [offline review proof](review.html), and `node studio/batches/2026-10-04-thirteen/validate.mjs` passes its mechanical candidate checks. These are drafts; no human approval, native-language edition, art approval, or release gate is claimed.
