# Privacy — decisions, made once, on purpose

This is an app used by children. Under India's DPDP Act a child's personal data
needs verifiable parental consent, and behavioural tracking and targeted
advertising to children are prohibited outright. The cheapest way to comply,
and the right way to build this, is to **not collect any of it**.

**Design rules, not aspirations:**

- No accounts, no child profiles on a server. Age, name, and what has been heard
  live in `localStorage` on the device and are never transmitted.
- No third-party analytics, no ad SDK, no social embeds, no fonts or scripts
  from anywhere the CSP in `netlify.toml` does not name.
- Product questions get answered by aggregate, non-identifying counts at the
  edge if at all — never by a per-child event stream.
- If sync across a family's devices is ever added, it syncs an opaque device
  key, and the parent's email if they ask for it. Never the child's name or age.

Changing any of this is a decision that needs a lawyer, not a pull request.
