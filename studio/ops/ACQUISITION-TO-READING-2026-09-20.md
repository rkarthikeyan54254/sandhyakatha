# Acquisition-to-reading diagnosis — September 20, 2026

Source: live Windsor GA4 connector, property `553123842`. Window: August 23–September 19, 2026 inclusive. September 19 may still be processing.

## Finding

Paid-tagged acquisition is producing visits but almost no measured story starts.

| Paid source | Sessions | Main landing pattern | `story_opened` | `story_finished` |
| --- | ---: | --- | ---: | ---: |
| `fb / paid` | 336 | 335 homepage, 1 `/why` | 0 | 0 |
| `ig / paid` | 183 | 183 homepage | 0 | 0 |
| `meta / paid_social` | 5 | 1 homepage, 3 Hindi Hanuman story, 1 English Hanuman story | 1 event / 1 user | 0 |
| **Total** | **524** | **519 homepage (99.0%)** | **1 event / 1 user** | **0** |

This is the clearest current bottleneck: the legacy paid traffic lands overwhelmingly on `/`, while the product counts `story_opened` only after a story JSON fetch succeeds and Reader opens. The paid visits therefore are not converting into the action Sandhya Katha exists to create.

Do not spend more or scale these paid routes based on reach, clicks, CPC or CPM. Any paid change still requires Rama's explicit approval.

## Comparison signals

Across all source/medium rows, GA4 returned 303 `story_opened` events and 27 `story_finished` events. Their ratio is 8.9%, but it is **not a user completion rate**: people can open several stories, event users overlap across sources, and finishing may occur in another session/source.

Examples of non-paid measured story activity:

- Direct: 137 opens from 34 users; 14 finishes from 8 users.
- `ig / social`: 19 opens from 6 users; 2 finishes from 2 users.
- `instagram / social`: 8 opens from 4 users; no finish row returned.
- Instagram carousel: 17 opens from 1 user; 2 finishes from 1 user, suggesting repeat/internal activity and a very small sample.
- WhatsApp channel: 7 opens from 4 users; no finish row returned.
- Facebook domain referrals combined: 18 opens from 17 source-row users; no finish row returned.

## Google-account referral anomaly

`accounts.google.com / referral` and `accounts.google.co.in / referral` together returned 57 story opens from five source-row active users, seven story finishes from five, and six sign-in starts from four. This is consistent with sign-in redirect attribution overwriting the original acquisition source for later events. It may also contain owner/testing activity.

Treat Google-account referral as an authentication/attribution issue, not an acquisition channel. Do not use its engagement to claim returning-family behavior.

## Recent event trend

| Date | Opens | Finishes | Sign-in starts |
| --- | ---: | ---: | ---: |
| September 16 | 35 | 4 | 1 |
| September 17 | 20 | 0 | 0 |
| September 18 | 20 | 1 | 2 |
| September 19 | 11 | 1 | 0 |

The last day may be incomplete. These are event counts, not distinct-reader funnel conversion.

## What can be concluded

1. Current paid-tagged traffic is poorly aligned with story reading.
2. Sending paid visitors to the homepage is a likely conversion barrier; the data does not isolate whether creative intent, audience quality or homepage design is the primary cause.
3. Direct and tagged non-paid social produce measurable story opens, but samples are small and may include repeat/internal use.
4. The existing three-event vocabulary is sufficient to expose the immediate failure. No analytics code change is justified yet.

## Next action

Complete the prepared organic Shakambhari campaign review and use its direct story URL with platform-specific tracking. Record its verified post URLs and compare sessions, `story_opened`, and `story_finished` after a full day. This creates a clean organic baseline before designing any paid experiment.

Separately, inspect GA4 referral exclusions/cross-domain handling for `accounts.google.com` without changing authentication or persisted family state. Any code/config change must first establish a deterministic reproduction and respect `docs/PERSISTED-STATE-SAFETY.md` if it touches session/profile behavior.
