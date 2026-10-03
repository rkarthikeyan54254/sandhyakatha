import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { webpIntegrityProblem } from '../scripts/lib/media.mjs';

describe('published hero integrity', () => {
  it('rejects a truncated image even when the WebP header and filename remain intact', () => {
    const hero = readFileSync(new URL('../public/media/stories/syamantaka-mani/hero.webp', import.meta.url));
    expect(webpIntegrityProblem(hero)).toBeNull();
    expect(webpIntegrityProblem(hero.subarray(0, Math.floor(hero.length / 2))))
      .toMatch(/RIFF declares/);
  });
});
