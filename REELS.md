# Sandhya Katha reel workflow

There is one reel component workflow: `scripts/reel.mjs`.

For publishing across platforms, use the unified campaign command documented in
`CAMPAIGNS.md`; it calls this reel workflow rather than bypassing it.

## Commands

```bash
# English
npm run reel -- hanuman-reminded --open
npm run reel:check -- hanuman-reminded

# Reviewed locale editions
npm run reel -- --locale hi-IN hanuman-reminded --open
npm run reel -- --locale ta-IN hanuman-reminded --open
npm run reel:check -- --locale hi-IN hanuman-reminded
npm run reel:check -- --locale ta-IN hanuman-reminded

# Every configured, publishable reel edition
npm run reel:check -- --all

# Static architecture/invariant gate
npm run verify:reel-workflow
```

## Invariants

- Do not add another top-level reel generator for a language, campaign, or script.
- Locale reel selectors live only in `content/social-locales.json` and point to reviewed locale text. They may not contain replacement prose, font overrides, coordinates, or width heuristics.
- English keeps its proven Latin/SVG text renderer.
- Complex-script locale editions use the browser-native layout adapter under `scripts/lib/`; shaping, spaces, ligatures, and line breaking belong to the browser text engine, not manual word positioning.
- Every reel uses the same CLI, card sequence contract, source/provenance gates, technical video gate, and review workflow.
- Adding a future locale extends the existing locale adapter/configuration. It must not create `scripts/reel-<locale>.mjs`, a locale-specific npm command, or a separate campaign generator.

`validate:strict` runs `scripts/reel-workflow-gates.mjs`, which mechanically
rejects parallel reel workflows and includes a regression test for the DOM
attribute parser bug that previously blocked complex-script layout diagnostics.
