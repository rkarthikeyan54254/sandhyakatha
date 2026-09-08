# Privacy — decisions, made once, on purpose

This is an app used by children. Under India's DPDP Act a child's personal data
needs verifiable parental consent, and behavioural tracking and targeted
advertising to children are prohibited outright.

**An earlier version of this file said: no accounts, ever, nothing leaves the
device.** That was the wrong rule, and it is worth recording why. It confused
*don't collect a child's data* with *don't have accounts*. The consequence was
that a family's history — which stories were read, the constellation the child
is building — lived only in `localStorage`, where Safari evicts it after about
seven days without a first-party visit and Chrome evicts it under storage
pressure. The whole promise of this app is that it accrues. Storing the accrual
somewhere the browser may delete without warning is not a privacy stance; it is
a broken product wearing one.

## The rule now

**Collect the minimum, from the parent, with their consent, and never profile
the child.**

- The app works **fully signed out**. No wall in front of the first story.
- Signing in is optional and does exactly three things: survives a cleared
  cache, reaches the second device, and later carries a subscription.
- Google is the primary sign-in and an email magic link the alternative.
  **No passwords, ever.**
- What an account stores, in one blob the parent owns: a first name they typed,
  an age, which stories were read and on what night, and the difficult-stories
  setting. It lives in Netlify's key-value store beside the site, keyed by the
  session's subject; a function refuses every request without that session.
- **Google is an identity provider, not an embedded one.** The OAuth exchange
  happens server-side and no Google script is ever loaded in the page, so
  Google never sees a visitor who does not sign in. Only `openid` and `email`
  are requested.
- A parent who would rather not use Google can take a recovery code instead: an
  account with no identity attached, where we never learn who they are.
- What it does **not** store: behavioural events, per-child analytics, anything
  inferred, anything shared onward.
- **Google Analytics 4 is used for measurement, and only measurement.**
  `public/gtag-init.js` denies `ad_storage`, `ad_user_data` and
  `ad_personalization` at consent default, switches off Google Signals and
  ad-personalisation signals, and anonymises IP. Three events are sent —
  a story was opened, a story was finished, sign-in was started — and nothing
  else. No child name, no age, no free text, no cross-site identity.
  DPDP prohibits behavioural advertising to children; the GA defaults are not
  on our side, so they are overridden explicitly. If that ever becomes hard to
  guarantee, the replacement is Netlify Analytics, which is server-side and
  sets no cookie at all.
- No ad SDK, no social embeds, no fonts or scripts from anywhere the CSP in
  `netlify.toml` does not name.
- Product questions get answered by aggregate, non-identifying counts at the
  edge if at all — never by a per-child event stream.

`navigator.storage.persist()` is requested on load, so even the signed-out case
is as durable as the browser will allow.

Adding a column to `profiles` is a decision that needs a lawyer, not a pull
request.
