# Sandhya Katha campaign workflow

There is one publishing workflow:

```bash
npm run campaign -- <story-id> --open
```

By default it generates the canonical English edition **and every public,
reviewed locale edition for that story**. For the current five-story Hindi
shelf, one command therefore generates both English and Hindi.

To intentionally limit a run:

```bash
npm run campaign -- --locale en <story-id>
npm run campaign -- --locale hi-IN <story-id>
```

Preflight without rendering:

```bash
npm run campaign:check -- <story-id>
npm run campaign:check -- --all
```

`campaign:today` uses the same workflow and therefore also emits every public
edition unless `--locale` is supplied.

## Outputs

Each edition produces one source set of creative assets and platform packages:

- Instagram: 9:16 reel + square carousel + captions + tracked links
- Facebook: 9:16 reel + square multi-image/carousel set + captions + tracked links
- YouTube: 9:16 Short + title + description + tracked link
- WhatsApp: channel post + share image + reel + tracked link

The same reel file is reused across platforms. The same carousel images are
reused for Instagram and Facebook. We do not independently redraw per platform.

Campaign bundles live under:

```text
social/campaigns/<story-id>/
  review.html
  manifest.json
  en/
    instagram/
    facebook/
    youtube/
    whatsapp/
  hi-IN/
    instagram/
    facebook/
    youtube/
    whatsapp/
```

## Content and typography contract

One edition resolver owns provenance. Locale output is allowed only when the
edition is public, approved, human-reviewed, source-version aligned,
source-byte pinned, and locale-lock current.

Reels and carousels use the **same curated selector set** for narrative social
copy. No generator may invent replacement story prose.

Typography is selected by one shared locale policy:

- English: stable Latin rendering.
- Complex scripts such as Hindi: browser-native shaping, native word spacing,
  and native line breaking with the approved locale font.

Never estimate complex-script width with character counts. Never position Indic
words manually. Never add fake spaces to reviewed text.

## Hardening

`scripts/campaign-workflow-gates.mjs` is part of `validate:strict` and build. It
rejects parallel campaign generators, standalone carousel generator commands,
missing public-locale selector coverage, campaign code that bypasses the unified
reel entrypoint, and complex-script carousel code that bypasses the shared
browser-native typography policy.

`scripts/reel.mjs` remains the lower-level reel component and diagnostic CLI.
For actual publishing, use `npm run campaign`.
