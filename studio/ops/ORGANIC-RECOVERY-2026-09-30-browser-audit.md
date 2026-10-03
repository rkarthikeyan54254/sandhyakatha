# Browser audit — 30 September 2026

Read-only observations from Rama's logged-in Chrome tabs, approximately 22:00–22:20 IST. No messages, posts, subscriptions, account settings, profile records or ad campaigns changed. Only business/channel facts are retained here; incidental personal chat content is excluded.

## YouTube

- Channel: https://www.youtube.com/@the_SandhyaKatha
- Studio channel ID: `UCJw6WS9sgs0yO4XW3nBemBg`.
- September 2–29 analytics: **8,119 views, 12.3 watch hours, +10 subscribers**. Current subscriber count 10. This resolves the previous lack of verified YouTube reporting through a UI read; Windsor's YouTube connector was not repaired.
- Top videos in that period: Tamil Durga 1,576 views, Tamil Hanuman-tail 1,244, Tamil Govardhana 1,208; English Hanuman-reminded 1,171. Different upload dates, exposure and tiny samples prevent a controlled language-performance claim. Tamil is a useful next test, not a proved winner.
- Public channel website link goes to the untagged homepage. The Videos tab has no long-form videos. Descriptions contain direct story URLs, some copied from other platforms with wrong UTMs.
- Five future Shorts visible: Tamil Jatayu October 1 (`MODR07P81cM`); Hindi Jatayu October 2 (`N7ftYqTXVQg`); Tamil Guha October 2 (`rhTLn4UASaE`); Hindi Karna October 3 (`xvIPJoAvNeM`); Tamil Andal October 4 (`NmbUZQuwX5o`). No later scheduled Short in the full 28-item table. Existing private/draft duplicates were left intact.
- Studio displayed an identity-verification notice. Advanced-feature eligibility was not checked. Do not promise a related-video funnel until eligibility is verified. No identity documents accessed or submitted.
- Official link behavior checked September 30: Shorts-description/comment URLs are not clickable; channel profile links are clickable. Related-video links lead to another YouTube video and require advanced features. Sources: https://support.google.com/youtube/answer/13748639?hl=en and https://support.google.com/youtube/answer/14075157?hl=en .

## Instagram and Facebook

- Instagram profile: https://www.instagram.com/the_sandhyakatha/ — 21 followers, 35 posts.
- Bio promises tonight's katha. First website link is the homepage with `utm_source=ig&utm_medium=social&utm_content=link_in_bio`. A separate Hanuman-reminded bio link uses `utm_source=meta&utm_medium=paid_social&utm_campaign=language_test_hanuman-reminded&utm_content=en`.
- Hindi/Tamil Hanuman-tail Instagram posts use `youtube/shorts` tags. Facebook cross-posts also carry `youtube/shorts` and `instagram/reel` tags. Raw post IDs/captions/URLs are in the evidence JSON.
- The displayed Instagram captions contain plain story URLs; do not treat caption text as a verified clickable outbound surface.
- Connector evidence confirms recent posts published on both platforms. Facebook/Instagram future scheduling queues were not exhaustively inspected; reconcile them before adding or moving posts. This session does not diagnose a scheduling failure.

## WhatsApp

- Channel: https://whatsapp.com/channel/0029VbDPZyP8KMqsuZX2GJ10
- Loaded channel header showed **12 followers** (initial loading state briefly showed 13).
- Recent posts included direct, untagged story links; older posts mixed correct WhatsApp tags with Instagram and paid tags. There is no clean platform attribution from these links.
- Existing opt-in channel can support a small return-use trial; it is not currently a large acquisition audience. A channel follower is not a measured family reader.

## Search Console

- Property https://sandhyakatha.com/.
- Page indexing report **last updated September 21**, not September 30: 13 indexed; 98 not indexed = 96 discovered/currently not indexed + 1 crawled/currently not indexed + 1 redirect error.
- Redirect-error example: `https://sandhyakatha.com/f/navaratri`, last crawl September 17. Validation started September 17 and failed September 19. A current Chrome navigation without a trailing slash successfully reached `/f/navaratri/`; historical error is not proof of an ongoing loop. Next action is live URL Inspection, not a speculative redirect rewrite.
- `/sitemap.xml`: Success, 212 discovered pages, last read September 29. An old `/sitemap.xmp` submission has one error and zero pages. The working sitemap already exists; resubmission is not an acquisition strategy.
- Indexing totals and sitemap discovered totals have different dates/scopes; do not subtract them or call all 199 other sitemap pages broken.
- Google does not guarantee indexing or ranking from sitemap submission: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap .

## Website and measurement

- Homepage loaded a valid selected story after initial loading. Initial empty state resolved; no persistent outage established. Existing family/account state was not edited.
- Verified full public English story pages: `/s/hanuman-tail/` (ages 6+, 6 minutes); `/s/hanuman-reminded/` (ages 6+, 6 minutes); `/s/guha-boatman/` (ages 6+, **7 minutes**, social-hierarchy parent note). All include the telling and a discussion question; English pages include share and WhatsApp follow actions. Public reading requires no sign-in. Hindi/Tamil switcher links are visible; this audit did not open every locale destination.
- Static pages and the app reader are different measurement surfaces. Repository `public/gtag-init.js`, `public/share.js` and public prerender scripts initialize ordinary GA but do not emit the app's `story_opened` / `story_finished` events. `src/lib/track.ts` and `src/App.tsx` emit those for the app reader. This is code-supported evidence of an instrumentation gap, not a live network-payload test. A static page view is not proof of a completed read.
- The September 23–29 static-page query returns eight page views across the returned `/s/` rows; active users cannot be summed across pages. This also indicates a small measured public-page audience, but does not measure story completion.
- Live `/f/navaratri/` shows only October 11, 12 and 13 under dates, repeats those three dates in the FAQ, and lists eight stories. It does not currently fulfill a dated nine-night program. The posts' nine-night promise needs a verified editorial/calendar plan before this becomes the campaign landing page. Do not invent a ninth story, regional date or blanket age suitability.

## Limits

No fresh mobile-device/in-app-browser test, live GA event debug, true reader cohort report, current Google Ads status, or direct proof of parent audience composition was obtained. Current-day visits generated by this audit are outside the analytic windows above. Future reports must account for owner/testing traffic.
