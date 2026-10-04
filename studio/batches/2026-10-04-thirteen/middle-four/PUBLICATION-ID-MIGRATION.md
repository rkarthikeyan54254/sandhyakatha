# Pārvatī production ID correction

The reviewed batch proof retains `boy-insults-shiva` as a historical file/key so `english-review-approval.json` continues to verify the exact reviewed bytes (`SHA-256 0345b390d987e59129769a62e86b6c5102359fd7f0cab070220e40a718556f9d`). The checked Śiva Purāṇa 26.3 calls the disguised visitor an **old man**. Publishing that inaccurate key as a share URL would preserve a false claim, so the production canon/story/locale identity is `parvati-visitor`.

The production English copy changes only metadata: `id`, status/review fields when approved, the controlled value, and a valid linked story. Its narration blocks are unchanged from the reviewed batch proof. SHA-256 of canonicalized block arrays:

| Length | Reviewed candidate = production copy |
|---|---|
| short | `ff69a55c125b4507c669998a24110faab817d89eca03ffc83cd20180de6c3bd7` |
| full | `fe06d9505b66e5dcd184172adf52c9e867167e684b10e21534a2718656431f9d` |

Locale candidate prose should likewise be copied unchanged into production files named `parvati-visitor.json`, with `storyId: parvati-visitor` and `sourceBlobSha1` recomputed against the **final published** English bytes. Do not alter the reviewed batch locale files or fabricate exact measuredSeconds from rounded minute reports. Locale approvals, locks and public shelves require human approval and actual recorded seconds under the repository gates.
