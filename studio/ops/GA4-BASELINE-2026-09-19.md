# GA4 adoption baseline — September 19, 2026

Source: live Windsor googleanalytics4 account 553123842, https://sandhyakatha.com/. Requested August 22–September 18 inclusive (28 calendar days); today excluded. Latest elapsed day may still be processing. Exact queries and responses: GA4-BASELINE-2026-09-19.json.

## Goal position

| Metric | 28-day result |
| --- | ---: |
| Active users (undimensioned total) | 789 |
| Goal progress | 15.78% of 5,000 |
| New users | 788 |
| Sessions | 930 |
| Engaged sessions | 208 |
| Engagement rate | 22.37% |
| Average engagement time per active user | 31.79 seconds |
| Page/screen views | 1,450 |

The historical 458-user handoff snapshot is 331 lower, but its exact reporting window/pull time is unknown. This is not a comparable-period growth rate.

## Recent elapsed days

| Date | Active users | Sessions | Engaged sessions | Engagement rate | Avg engagement seconds/user |
| --- | ---: | ---: | ---: | ---: | ---: |
| September 16 | 35 | 41 | 17 | 41.46% | 69.54 |
| September 17 | 301 | 315 | 43 | 13.65% | 5.74 |
| September 18 | 258 | 276 | 46 | 16.67% | 9.55 |

September 17 has revised upward from the handoff's preliminary 220 users. Avoid treating same-day snapshots as final.

## Source quality

Grouped from returned source/medium rows. These are attribution labels, not proof of the actual acquisition route.

| Attribution group | Sessions | Engaged sessions | Engagement rate |
| --- | ---: | ---: | ---: |
| Paid-tagged: fb/paid, ig/paid, meta/paid_social | 522 | 58 | 11.11% |
| Tagged non-paid social: Instagram and WhatsApp social/format tags | 45 | 29 | 64.44% |
| Social domain referrals, paid/organic unknown | 45 | 23 | 51.11% |
| Direct, true origin unknown | 249 | 55 | 22.09% |
| Google account referrals, possible sign-in attribution | 52 | 43 | 82.69% |
| Organic search | 2 | 1 | 50.00% |
| Unattributed | 16 | 0 | 0% |
| Other referrals | 2 | 0 | 0% |

Paid-tagged sessions are approximately 56.1% of the undimensioned total. Do not sum source-level active users: the same person can appear in several sources. Nor should all non-paid-tagged sessions be called organic.

## Returning readers

The new/returning dimension returns 30 returning active users, 132 returning sessions, 87 engaged sessions, 65.91% engagement and 520.1 seconds engagement per returning active user. The new row returns 789 active users, 786 sessions and 15.39% engagement.

New and returning user rows overlap; never add them into a user total or subtract new users from active users to infer returning users. These are GA4 visit classifications, not the product's anonymous days-1–14 retention cohorts. D14 cohort outcomes and story open/finish conversion are not measured by this report.

## Data-quality limits

- Source rows sum to 933 sessions and 209 engaged sessions versus undimensioned 930/208. New/returning rows also sum to 209 engaged sessions. Preserve the discrepancy; do not force a reconciliation.
- Facebook/Instagram paid average engagement returns about 0.04 seconds/user despite engaged sessions. It could reflect measurement/attribution behavior as well as low-quality visits; do not diagnose bots or non-readers solely from this.
- Google account referrals are unusually engaged and may represent authentication attribution. The 30 returning-user sample may include owner/testing traffic; genuine family retention is not established.
- Small non-paid samples are directional. Search has only two sessions.
- Requested dates are explicit; property timezone and final processing status were not independently checked.

## Next decision

Prepare one reviewed organic campaign with explicit platform UTMs and verify its destination. Do not recommend increased paid delivery from these results. The next measurement task is a narrow check of paid arrivals versus story_opened/story_finished and sign-in referral attribution, using existing event vocabulary, before any tracking code change. Persisted-state and editorial gates still apply.
