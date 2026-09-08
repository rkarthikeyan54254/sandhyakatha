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
- What an account stores, in one row the parent owns: a first name they typed,
  an age, which stories were read and on what night, and the difficult-stories
  setting. Row-level security means no other account can read it. Deleting the
  account cascades the row away.
- What it does **not** store: behavioural events, per-child analytics, anything
  inferred, anything shared onward.
- No third-party analytics, no ad SDK, no social embeds, no fonts or scripts
  from anywhere the CSP in `netlify.toml` does not name.
- Product questions get answered by aggregate, non-identifying counts at the
  edge if at all — never by a per-child event stream.

`navigator.storage.persist()` is requested on load, so even the signed-out case
is as durable as the browser will allow.

Adding a column to `profiles` is a decision that needs a lawyer, not a pull
request.
