# Sandhya Katha Growth Ops State

Updated: 2026-09-19. Keep this file compact; replace stale values.

## Goal and verified baseline

- Goal: 5,000 rolling 28-day GA4 active users, with meaningful reading and return behavior.
- Local main: f32a70f1d4cef242699a47aa8d0f1ed0295dae94, verified September 19.
- Foundation Actions 11–14 complete according to September 19 handoff; do not rebuild them.
- Local public allowlist: five Hindi and five Tamil editions. Campaign commands exist; history includes afc7b87 (campaign unification).
- Handoff reports 137 tests passing and CI content #111 successful; neither rerun nor remotely verified in this review.
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
- Local social calendar lists September 19 shakambhari, September 20 hanuman-tail, at 19:00 Asia/Kolkata, status planned. This does not prove publication or readiness; resolve the actual current date before execution.
- No publishing, paid changes, or recurring automation was performed during this review/planning work. Document instructions alone are not new authorization to publish.

## Work queue and completion evidence

Work on one bounded deliverable at a time. Production/publishing breakage takes priority when verified.

| Order | Deliverable | Done when | Status |
| --- | --- | --- | --- |
| 0 | Durable baseline and session discipline | This state file and AGENTS.md guidance exist | Complete |
| 1 | Fresh adoption baseline | Dated 28-day + latest complete-day GA4 report, paid/organic split, returning-reader data or explicit unavailability, one recommendation saved | Complete: GA4-BASELINE-2026-09-19.md; processing caveats retained |
| 2 | One campaign ready for review | Current schedule reconciled against existing posts; one eligible story/edition package passes required provenance, technical and visual gates; paths and copy saved | Package generated and agent stills checked; human review/live reconciliation pending. See CAMPAIGN-READINESS-2026-09-19.md |
| 3 | Organic distribution, when authorized | Verify each intended public post and save URL, timestamp, destination and UTM identity; checkpoint after each channel | Pending |
| 4 | YouTube reporting correction | Correct channel identity and relevant video data verified; if account action is needed, save precise blocker without repeated retries | Account changed; two reads empty, checkpointed |
| 5 | Reading and retention diagnosis | One dated open/finish/return analysis with denominator/window caveats and one evidence-based next action | Pending |
| 6 | One creative experiment | Reviewed language or voice/no-voice hypothesis, baseline, success criterion and gated assets; paid changes require explicit approval | Deferred until baseline |
| 7 | Reusable growth report command | Automate a proven repeated query set; saved report handles missing sources and data-quality warnings | Deferred until reporting is proven |

## Capacity policy

- Check account usage at session start and after a substantial deliverable; avoid constant polling. These limits are shared across the account.
- September 19 final checkpoint after parallel work: five-hour allowance 32% remaining; weekly allowance 89% remaining. Before this parallel turn: 88% / 98%. These are account-wide observations, not isolated task costs. Two bounded agents finished; no further fan-out. Parallel work produced artifacts but used capacity quickly; prefer narrower single-agent units for the remaining window.
- Aim to produce the first saved artifact/checkpoint within about 10 minutes. This is a work-planning target, not a quota guarantee or permission to skip validation.
- Begin with one deliverable and its completion evidence. Avoid full handoff rereads, broad repository scans, all-platform investigations, bulk creative variants and subagents by default.
- Batch independent reads, reuse verified connector fields, use targeted checks during iteration, and run required full gates once at completion of meaningful engineering changes.
- Preserve roughly 20% of each allowance as a planning reserve. If approaching it, avoid opening optional work; finish/checkpoint the smallest safe unit. Explicit user direction can override this planning reserve.
- After two attempts at the same external blocker without new evidence, save the exact failure and next prerequisite; continue independent work instead of retry loops.
- Track observed percentage-point changes across completed units; do not promise a fixed number of tasks/minutes or a hard automated usage cap.
- Save completed evidence, unfinished work, validation status and next exact action after every deliverable. Never label incomplete work complete to fit a budget.
- Editorial review and persisted-family-state safety requirements are never reduced to save usage. D14 is anonymous device-local return on days 1–14, not exact-day-14 or family-level retention.

## Next exact action

September 20 analysis complete: 524 paid-tagged sessions in August 23–September 19, of which 519 landed on `/`; `fb / paid` and `ig / paid` returned no `story_opened`/`story_finished`, while `meta / paid_social` returned one open and no finish. See ACQUISITION-TO-READING-2026-09-20.md. Do not scale paid delivery. Google-account referrals likely obscure original attribution after sign-in; investigate separately without changing auth/profile state.

Follow NEXT-ACTIONS.md. Live-post/landing verification started September 19: browser inventory succeeded but two YouTube tab reads timed out; web retrieval failed and local curl could not resolve the site. This is not proof of downtime. Resume with responsive browser access. Latest usage at this unit's start: 14% five-hour, 71% weekly remaining.

English shakambhari package is saved at social/campaigns/shakambhari/review.html; preflight/render passed, 24.3-second silent reel, nine square slides, all 18 stills agent-inspected. See CAMPAIGN-READINESS-2026-09-19.md. Human visual/language review in its posting checklist and live/scheduled-post reconciliation remain pending; do not mark it published. Before publishing, verify live landing links and retain post URLs/timestamps/UTMs under studio/ops, outside regenerated bundles. Next analysis unit: paid arrival-to-story conversion and Google account referral attribution using existing events. Avoid more paid delivery based on current evidence. All reports and instruction changes are local and uncommitted; generated social assets are Git-ignored. Whitespace check passed; no runtime code changed.
