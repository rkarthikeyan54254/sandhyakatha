# Sandhya Katha Growth Ops State

Updated: 2026-10-02. Keep this file compact; replace stale values.

## Thirteen-story editorial queue — 2026-10-04

- Rama requested end-to-end work on all thirteen remaining draft canon entries and a durable check-in before the session ends. A fresh branch `codex/thirteen-stories-2026-10-04` starts from latest production `main` (`78d15e8`); first tracker checkpoint `746212e` is committed at `studio/batches/2026-10-04-thirteen/README.md`.
- Current bounded unit: source and age/care suitability audits across the eight non-gated and five gated entries. None is approved or published. Known holds include Kabīr's unresolved collection-scope decision and Sēkkiḻār's ungrounded prior hook. Human English read-aloud and Hindi/Tamil native-language review remain required before promotion.
- Usage at start: five-hour 4% used, weekly 15% used (shared account). Next exact action: finish and save the thirteen source decisions, then draft only the grounded, suitable stories and prepare review proofs; commit/push a checkpoint with remaining gates before ending this session.
- First audit unit complete: all thirteen have source/care decision records in the batch directory. Seven misleading canon planning claims were corrected (including Iyaṟpagai's constrained response, Kōṭpuli's source ending, Dakṣa's sacrifice, and Janābāī's episode boundary), and strict validation still passes with 80 written stories and zero warnings. No status, locale, lock, media, or public selector changed. Next exact action: continue exact-witness searches for held stories and create source-ledgered English candidates for the verified Pārvatī, Kaṇṇappar, and Dakṣa episodes; keep all human approvals pending.

## Second five trilingual stories — 2026-10-03

- COMPLETE: Rama approved the exact fifteen-edition proof and reported 3:00/6:00 readings in all three languages. Five English stories, ten Hindi/Tamil editions, five approved WebP heroes and five dedicated OG cards passed strict validation, 138 tests and the final-head Netlify deploy preview. PR #28 merged as `4310ea99675fe8c0bf241314f807f68267194ffb`.
- Live production verification: all 12 public English/Hindi/Tamil routes for the four non-gated stories displayed expected localized titles and loaded hero images; each public story exposed its dedicated OG image. All five OG JPEGs loaded at 1200×630. Sukanyā remains age gated and its public `/s/` route shows the not-on-shelf page. Evidence: `studio/batches/2026-10-03-second-five/deployment-evidence.json`.
- Local full build stalls in PWA service-worker generation after Vite, but the exact final-head Netlify deploy preview passed. No further publication work remains for this batch. Liṅgodbhava's observance mapping remains a separate unapproved proposal.

## First-five trilingual publication — 2026-10-03

PR #23 is synced with production main and the five supplied approved WebPs are hash-matched and decode-verified. Rama confirmed the native Hindi/Tamil readings were timed at 3:00 short and 6:00 full for each story; this is recorded as 180/360 seconds per edition. Five English stories and ten Hindi/Tamil editions are promoted locally, with locale locks, public shelves, five 1200×630 OG cards, and curated campaign selectors. Strict validation, 138 tests, Vite compile and static locale/public/social/design/surface gates pass. The local PWA service-worker generator stalled before cache validation; remote CI, merge and live verification remain. The one-off promotion script is removed. Next action: push PR #23, use CI to resolve any remaining build/cache issue, merge, and verify production pages.

## Current execution checkpoint — supersedes planning-only statuses below

- User authorized live organic execution and schedule changes. Two approved partner emails were SENT; receipts are in ORGANIC-RECOVERY-2026-09-30-execution.md. Do not resend. No partner acceptance is confirmed.
- Facebook three-evening invitation is live. Govardhana caption update is verified published October 1 at 17:30, with the full-story link and clean organic UTM tags; post 122112301815480455.
- Hindi YouTube Jatayu moved to October 3, 19:00 IST and reverified. Hindi Karna October 5, 19:00 IST verified October 2 by reopening visibility (GMT+0530).
- Tamil Hanuman-tail reel scheduled on Facebook and Instagram for October 4, 19:30 IST. Both exact Tamil captions and distinct organic source tags verified in the refreshed queue October 2. Instagram's earlier corrupted caption was repaired before publication; no duplicate was created.
- Instagram bio now explicitly directs parents to the homepage link and names English, Tamil and Hindi; persisted after refresh. Website field explicitly says links can only be edited on mobile, so the old paid-tagged story URL remains unresolved. No paid changes. Detailed evidence and screenshots: ORGANIC-SCHEDULE-2026-10-01.md and evidence/2026-10-02-*.
- Remaining exact action: replace the paid-tagged Instagram story URL through an authenticated mobile-app editing surface when available, then verify the click path. Desktop UI cannot do this. Do not repeat historical analytics collection, resend outreach, or launch duplicate posts. The full profile-routing objective remains incomplete; the completed live work is safe and verified.
- Blocker audit, October 2 continuation: desktop restriction revalidated live; available app inventory contains no Instagram/mobile-mirroring editing surface. This is the second consecutive goal turn with this remaining blocker (first identified in the preceding execution turn). No supported next write is available. Shared usage observed 81% five-hour / 91% weekly; do not spend more on repeated unchanged UI checks.
- Third consecutive blocker audit: the live Website field remains disabled with the same mobile-only restriction. No new editing surface or user input is available. Goal marked blocked, not complete, to stop unchanged automatic continuations. Resume prerequisite: authenticated Instagram mobile link editing; remaining action is to replace the paid-tagged story URL and verify its destination. All completed publication/scheduling evidence remains recorded above.

## Goal and verified baseline

- Goal: 5,000 rolling 28-day GA4 active users, with meaningful reading and return behavior.
- Local and origin main: 3b70559586c5a0d5dbbbf5ff655a2c689bc29743, verified September 20.
- Foundation Actions 11–14 complete according to September 19 handoff; do not rebuild them.
- Public allowlist: 11 Hindi and 11 Tamil editions. The September 20 bilingual batch added `guha-boatman`, `jatayu-last-flight`, `hanuman-tail`, `birds-eye`, and `karna-armour` in both languages; preceding commit added `squirrel-setu`.
- September 20 local verification: production build PASS, strict/editorial/native-language/runtime/public/surface/cache gates PASS, 137/137 tests PASS. Remote CI was not rechecked.
- Preserve untracked Claude outputs/; never stage it or use git add .

## Analytics and publishing: evidence status

- September 30 organic recovery session: fresh September 2–29 GA4 total 1,344 active users, 1,543 sessions, 304 engaged sessions (19.70%). September 25–29: 19 distinct active users, 25 sessions; daily active counts 4, 3, 5, 5, 3. Paid-tagged 956/1,543 sessions (61.96%), but organic public links also reuse paid tags, so this is not a causal paid share. Recent September 23–29 events: 8 story-open users / 15 events; 1 finish user / 2 events. Raw query evidence saved in `ORGANIC-RECOVERY-2026-09-30-evidence.json`.
- Source measurement has concrete contamination: Instagram bio story link uses `meta/paid_social`; Instagram Hindi/Tamil Hanuman-tail and Facebook cross-posts use `youtube/shorts`; Facebook English cross-posts use `instagram/reel`. Do not treat source labels as exact platform attribution.
- September 30 recovery deliverable COMPLETE: `ORGANIC-RECOVERY-2026-09-30.md`, `ORGANIC-RECOVERY-2026-09-30-launch-kit.md`, browser audit and raw JSON. User clarified Bangalore, no direct temple contact, cold outreach, at most one hour/day when available. Six sourced organisational prospects; first two tailored drafts; three-night ages-6+ trial; 11 checked tracking URLs. No outreach/publication performed. 5,000 by October 15 is not a credible operating forecast: 815 already-measured users fit September 18–October 15, leaving about 4,185 additional qualifying users before September 30's unknown contribution.
- New measurement caveat: public `/s/` pages provide complete stories but do not have the app reader's open/finish event coverage in the inspected code. Do not call the 8 open-users/1 finish-user a whole-site reading funnel. Use public page engagement and aggregate voluntary trial feedback until measurement is validated.
- Live audit: YouTube September 2–29 = 8,119 views, 12.3 hours, +10 subscribers; five Shorts scheduled through October 4. Instagram 21 followers; loaded WhatsApp channel 12 followers. Search sitemap successful with 212 discovered pages, read September 29; indexing report stale at September 21 (13 indexed, 98 not indexed). Historical Navaratri redirect error currently navigates successfully. Live festival page lists only October 11–13 and eight stories; repair/review its programme before promoting a nine-night promise. See browser audit for dates and limits.

- Historical analytics: August 22–September 18, pulled September 19: 789 active users, 930 sessions, 208 engaged. Superseded for current decisions by the September 30 evidence above; retained in GA4-BASELINE-2026-09-19.md.
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
| 1 | Fresh adoption baseline | Dated 28-day + latest complete-day GA4 report, paid/organic split, returning-reader data or explicit unavailability, one recommendation saved | Refreshed September 30: ORGANIC-RECOVERY-2026-09-30.md + raw evidence; attribution and public-reader gaps retained |
| 2 | One campaign ready for review | Current schedule reconciled against existing posts; one eligible story/edition package passes required provenance, technical and visual gates; paths and copy saved | `hanuman-tail` en/hi/ta generated; mechanical, agent visual and Rama human-review gates pass. Live reconciliation pending. See CAMPAIGN-READINESS-2026-09-20.md |
| 3 | Organic distribution, when authorized | Verify each intended public post and save URL, timestamp, destination and UTM identity; checkpoint after each channel | Pending |
| 4 | YouTube reporting correction | Correct channel identity and relevant video data verified; if account action is needed, save precise blocker without repeated retries | Verified September 30 through Studio UI; Windsor connector repair remains unnecessary/unverified |
| 5 | Reading and retention diagnosis | One dated open/finish/return analysis with denominator/window caveats and one evidence-based next action | September 30 public-page measurement gap identified; no whole-site finish or D14 rate claimed |
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

For the organic recovery plan: Rama reviews/sends the two prepared cold messages to Tapas Reading Cafe and Our Story Shelf, or explicitly authorises those recipients/drafts for sending. Correct the featured profile route and verify the actual mobile click path before launching the three-evening trial. Record acceptance and actual shares separately. No partner is secured. Remaining prerequisites: live profile changes, mobile click verification, future FB/IG queue reconciliation, public-reader instrumentation decision and editorial/calendar correction before any nine-night Navaratri campaign.

September 30 validation: evidence JSON parses; reported arithmetic agrees with responses; 11 tracking URLs pass parameter/path checks; three English trial stories opened on production. No production code/content changes or deployment; pre-existing five-story editorial work preserved. Usage at completion checkpoint: five-hour 75% used, weekly 27% used (shared account; start 1%/16%). Finishing capacity reserved.

## Five-story publication checkpoint — 27 September

- Rama approved all 15 editions, short/full, and authorized merge. Ten staged locale language/source approvals recorded; five supplied images downloaded, mapped and converted to WebP with hashes in `studio/batches/2026-09-26-five-stories/approval.json`.
- Latest main fetched: `63c97f2`; batch branch is two commits ahead with no upstream divergence before this checkpoint. No merge or production publication yet.
- Targeted batch review, canonical strict validation and full build pass (publication-preflight.txt). Remaining factual prerequisite: actual native read-aloud seconds; pending user question distinguishes measured readings from 3/6-minute estimated labels. No timings invented and no gates weakened.
- Next exact action: record the timing answer, complete runtime promotion/locks and full build, then push/merge and verify production. Existing merge approval persists.
- Usage observed: five-hour window 73% used, weekly 11% used. Continue bounded work and preserve finishing capacity.

## Story releases — 3 October 2026

- Five-story publication: PR #25 merged as `044691e8b143f519ad79cadab08f76a2cb4ba0aa`. The final-head Netlify deploy preview passed. Rama's recorded human approval and measured 180/360-second Hindi/Tamil timings are in the five-story batch. All five supplied hero illustrations and story share cards are checked in. Public English routes for butter-rope, last-grain and banyan-seed and Hindi/Tamil butter-rope routes were observed live on sandhyakatha.com; blue-jackal and mice-ate-the-scales retain their age gates and correctly have no public `/s/` route.
- Syamantaka Maṇi: PR #24 rebased by merge onto the five-story release, with combined locks/public shelves/social selectors; targeted strict, native-language, locale-parity, campaign and observance gates passed. Its final-head Netlify deploy preview passed. PR #24 merged as `78bbde0fc43698e57c4d02eb02aebeec639fe76b`.
- Production confirmation: after the deploy completed, `/s/syamantaka-mani/`, `/s/syamantaka-mani/hi/` and `/s/syamantaka-mani/ta/` all displayed the new story titles on sandhyakatha.com; the English page displayed its approved hero. The immediately post-merge 404 resolved. The exact deployed commit marker was blocked by the browser, so verification is based on the new story content plus successful final-head preview.
- The local full build on the five-story branch stalled in TypeScript; `publication-preflight.txt` explicitly marks that attempt incomplete. Netlify's final-head deploy preview provided the passing production build for PR #25. The separate Syamantaka final-head deploy preview passed after conflict resolution.
- Next exact action: no further publication action for these six stories. Resume the bounded growth queue from the latest organic schedule evidence; keep publication and analytics work separate.
