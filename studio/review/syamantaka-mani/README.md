# Syamantaka Maṇi — publication and image integrity

The English, Hindi and Tamil short/full editions were approved and published in PR #24 on 3 October 2026. The approved hero was listed in `content/media.json`, but the checked-in WebP was truncated: its RIFF header declared 33,880 bytes while the file contained 14,931. The publication gate checked the metadata, version and file presence, so it passed a file the browser could not display. The first share card fell back to a text-only design for the same reason.

The hero has been replaced using Rama's attached 1448 × 1086 PNG (SHA-256 `002da45dd965ba2f7d7a110096caf452412e699c4deda0b17e9251bbaef94608`). The new WebP is 301,146 bytes (SHA-256 `08ed54087255cc118d03539f0bdb2ccd519515a35ba7c5d67175806fa6098716`) and decodes with `dwebp`. The story-specific share card was regenerated from that image.

The strict published-hero gate now checks the WebP RIFF size and chunk boundaries, and story rendering omits invalid files with a warning. A regression test verifies that a truncated WebP is rejected even when its filename and header remain intact. The current 72 story hero files pass the structural gate. This check catches truncation and malformed containers; it does not replace visual review or a browser load check.
