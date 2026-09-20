# Publishing audit — 2026-09-19

Scope: local read-only audit of schedule, campaign machinery and publication records; this report is the only change. No external service or public post was verified, and no publishing occurred. `Claude outputs/` was excluded.

## Schedule versus evidence

`content/social-calendar.json` was generated September 15 and schedules 19:00 Asia/Kolkata:

| Date | Story | Recorded status |
| --- | --- | --- |
| September 19 | `shakambhari` — The Woman Who Fed the World | planned |
| September 20 | `hanuman-tail` — The Tail Bhīma Could Not Lift | planned |
| September 21 | `bharata-sandals` — The Empty Chair | planned |
| September 22 | `jatayu-last-flight` — Jaṭāyu's Last Flight | planned |
| September 23 | `narakasura` — The Morning After Naraka | planned |

All calendar entries, including September 15–18, remain `planned`. This is a plan, not publication evidence or a current readiness check. `hanuman-reminded` is also planned for September 30 despite the handoff reporting an earlier publication; distinguish an intentional repeat from an accidental duplicate before that slot.

The only matching public-post records found in targeted `studio/`, `content/`, `scripts/`, and local social JSON/Markdown/text records are the handoff-reported URLs in `studio/ops/GROWTH-OPS-STATE.md`:

- Instagram: https://www.instagram.com/p/DdZaPdRz69w/
- Facebook: https://www.facebook.com/reel/2948152478851342
- WhatsApp: https://whatsapp.com/channel/0029VbDPZyP8KMqsuZX2GJ10/107
- YouTube: https://youtube.com/shorts/UklnejawQz4

They describe English `hanuman-reminded`; actual timestamp, caption destination, UTM identity, and present availability remain unverified. Generated assets and unchecked posting checklists do not establish publication.

## Tracking and package machinery

`CAMPAIGNS.md` documents one generator, `npm run campaign -- <story-id>`, selecting English plus public reviewed locale editions. `scripts/lib/campaign-runner.mjs` writes platform copy/link files and provenance manifests under `social/campaigns/<story-id>/<locale>/`.

| Platform/format | utm_source | utm_medium |
| --- | --- | --- |
| Instagram reel / carousel | instagram | reel / carousel |
| Facebook reel / carousel | facebook | reel / carousel |
| YouTube Short | youtube | shorts |
| WhatsApp channel | whatsapp | channel |

All use `utm_campaign=daily_story` and `utm_content=<story-id>_<locale>`, pointing to the resolved edition's public path. This distinguishes platform, format, story and edition, but not publication date or creative variants of the same format. Analysts should inspect source/medium directly rather than assume these custom media map into a particular GA4 default channel group.

Manifest fields cover story version, locale, source provenance and asset paths. They do not record public post URLs, publish timestamps or verification evidence. `scripts/campaign-today.mjs` selects the current India date and invokes generation; it neither publishes nor checks/updates calendar publication status. `scripts/social-plan.mjs` preserves existing schedule entries and writes new rows as planned.

Regeneration removes the story's entire campaign directory before rebuilding. Keep publication evidence outside that directory so it survives regeneration.

## Next exact actions

1. Finish the separately assigned September 19 campaign preflight/render/review work. Preserve all editorial and language review gates; a planned calendar row does not waive them.
2. Before posting, reconcile the selected story against actual channel history once, then record the result in a durable file under `studio/ops/`. If channel history is inaccessible, retain `unverified` rather than infer not published.
3. For each authorized post, record platform, account/channel, story ID/version, locale, format, exact destination URL including UTMs, public post URL, actual timestamp with timezone, and verification time/evidence. Keep planned, prepared, published and verified states distinct.
4. Reconcile the four existing Hanuman URLs into that record and explicitly decide whether September 30 is an intentional repeat. Do not mark earlier planned stories published merely because assets exist.
5. Defer tracking-code changes until a repeated-creative experiment needs per-post attribution; use a durable publication ledger now. No code change or broad test run is needed for this audit.

Completion evidence: inspected the calendar, unified runner, daily wrapper, planner, documentation and local metadata searches. Live publication state remains outside this audit's scope.
