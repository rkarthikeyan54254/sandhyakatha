# Bharat observance corpus

One JSON file per observance. The observance corpus is deliberately independent
of Sandhya Katha story availability.

An observance answers:

> What is observed, by whom, under what documented recurrence rule, and with
> what degree of confidence?

It does **not** answer:

> Which story should we tell?

That relationship lives later in `content/observance-story-map.json`.

Only records with `status: "approved"` will eventually be eligible for
production resolution. `discovered`, `sourced`, and `in-review` are research
states and must never silently leak into Tonight.

Every sourced/approved record needs source coverage for identity, rule and
scope. Approved records also require a human reviewer/date and may not have
`confidence: "provisional"`.

Do not create a festival merely because a story needs a date. Do not infer
observance relationships from shared deity/person names.
