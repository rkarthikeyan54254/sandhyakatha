# Sandhya Katha Growth Ops State

Updated: 2026-09-20. Keep this file compact; replace stale values.

## Goal and verified baseline

- Goal: 5,000 rolling 28-day GA4 active users, with meaningful reading and return behavior.
- Local and origin main: 3b70559586c5a0d5dbbbf5ff655a2c689bc29743, verified September 20.
- Foundation Actions 11–14 complete according to September 19 handoff; do not rebuild them.
- Public allowlist: 11 Hindi and 11 Tamil editions. The September 20 bilingual batch added `guha-boatman`, `jatayu-last-flight`, `hanuman-tail`, `birds-eye`, and `karna-armour` in both languages; preceding commit added `squirrel-setu`.
- September 20 local verification: production build PASS, strict/editorial/native-language/runtime/public/surface/cache gates PASS, 137/137 tests PASS. Remote CI was not rechecked.
- Preserve untracked Claude outputs/; never stage it or use git add .

## Analytics and publishing: evidence status

- Fresh analytics: August 22–September 18, pulled September 19: 789 active users (15.78% of goal), 930 sessions, 208 engaged (22.37%). September 18: 258 active users. See GA4-BASELINE-2026-09-19.md and its JSON evidence.
- Returning dimension: 30 active users, 132 sessions, 65.91% engagement; this is not D14 cohort retention. Paid-tagged: 522 sessions, 58 engaged (11.11%). Source totals differ slightly from undimensioned totals; Google-account referrals and paid engagement duration need investigation. Current spend/paid delivery status not fetched.
- GA4 property: 553123842. Live Windsor discovery now shows YouTube 39241, sandhyakathas@gmail.com, replacing the old source. Two August 22–September 18 video queries returned no rows, so reporting remains unverified. Do not reconnect blindly; next check is correct channel access/date coverage in Windsor/YouTube Studio.
- Handoff-reported English hanuman-reminded posts (not reverified):
  - Instagram: https://www.instagram.com/p/DdZaPdRz69w/
  - Facebook: https://www.facebook.com/reel/2948152478851342
  - WhatsApp: https://whatsapp.com/channel/0029VbDPZyP8KMqsuZX2GJ10/107
  - YouTube: https://youtube.com/shorts/UklnejawQz4
- September 20 active campaign: `hanuman-tail`, scheduled locally for 19:00 Asia/Kolkata. English/Hindi/Tamil package generated; mechanical, agent visual and Rama human-review gates passed. Live-channel reconciliation and publication remain. See CAMPAIGN-READINESS-2026-09-20.md.
- No publishing, paid changes, or recurring automation was performed during this review/planning work. Document instructions alone are not new authorization to publish.

## Work queue and completion evidence

Work on one bounded deliverable at a time. Production/publishing breakage takes priority when verified.

| Order | Deliverable | Done when | Status |
| --- | --- | --- | --- |
| 0 | Durable baseline and session discipline | This state file and AGENTS.md guidance exist | Complete |
| 1 | Fresh adoption baseline | Dated 28-day + latest complete-day GA4 report, paid/organic split, returning-reader data or explicit unavailability, one recommendation saved | Complete: GA4-BASELINE-2026-09-19.md; processing caveats retained |
| 2 | One campaign ready for review | Current schedule reconciled against existing posts; one eligible story/edition package passes required provenance, technical and visual gates; paths and copy saved | `hanuman-tail` en/hi/ta generated; mechanical, agent visual and Rama human-review gates pass. Live reconciliation pending. See CAMPAIGN-READINESS-2026-09-20.md |
| 3 | Organic distribution, when authorized | Verify each intended public post and save URL, timestamp, destination and UTM identity; checkpoint after each channel | Pending |
| 4 | YouTube reporting correction | Correct channel identity and relevant video data verified; if account action is needed, save precise blocker without repeated retries | Account changed; two reads empty, checkpointed |
| 5 | Reading and retention diagnosis | One dated open/finish/return analysis with denominator/window caveats and one evidence-based next action | Acquisition-to-reading diagnosis complete; D14 cohort reporting remains separate |
| 6 | One creative experiment | Reviewed language or voice/no-voice hypothesis, baseline, success criterion and gated assets; paid changes require explicit approval | Deferred until baseline |
| 7 | Reusable growth report command | Automate a proven repeated query set; saved report handles missing sources and data-quality warnings | Deferred until reporting is proven |

## Capacity policy

- Check account usage at session start and after a substantial deliverable; avoid constant polling. These limits are shared across the account.
- September 20 checkpoint after validation and campaign generation: five-hour allowance 78% remaining; weekly allowance 30% remaining. These are account-wide observations, not isolated task costs. Prefer bounded sequential work while weekly capacity is constrained.
- Aim to produce the first saved artifact/checkpoint within about 10 minutes. This is a work-planning target, not a quota guarantee or permission to skip validation.
- Begin with one deliverable and its completion evidence. Avoid full handoff rereads, broad repository scans, all-platform investigations, bulk creative variants and subagents by default.
- Batch independent reads, reuse verified connector fields, use targeted checks during iteration, and run required full gates once at completion of meaningful engineering changes.
- Preserve roughly 20% of each allowance as a planning reserve. If approaching it, avoid opening optional work; finish/checkpoint the smallest safe unit. Explicit user direction can override this planning reserve.
- After two attempts at the same external blocker without new evidence, save the exact failure and next prerequisite; continue independent work instead of retry loops.
- Track observed percentage-point changes across completed units; do not promise a fixed number of tasks/minutes or a hard automated usage cap.
- Save completed evidence, unfinished work, validation status and next exact action after every deliverable. Never label incomplete work complete to fit a budget.
- Editorial review and persisted-family-state safety requirements are never reduced to save usage. D14 is anonymous device-local return on days 1–14, not exact-day-14 or family-level retention.

## Next exact action

With explicit push/publication authorization, use the already-open channel/content pages to reconcile duplicate/scheduled posts and verify the English/Hindi/Tamil live landing pages. If clean, publish one channel at a time and record URLs immediately. Do not rerun the build, tests, campaign generation or analytics unless inputs change.
