import { describe, expect, it } from 'vitest';
import { pathForTab, tabFromPath } from './route';

describe('tabFromPath', () => {
  it('maps the four surfaces, with or without a trailing slash', () => {
    expect(tabFromPath('/')).toBe('tonight');
    expect(tabFromPath('')).toBe('tonight');
    expect(tabFromPath('/shelf/')).toBe('shelf');
    expect(tabFromPath('/shelf')).toBe('shelf');
    expect(tabFromPath('/map/')).toBe('map');
    expect(tabFromPath('/why/')).toBe('why');
  });

  it('is case-insensitive, because links get typed and shared', () => {
    expect(tabFromPath('/Shelf/')).toBe('shelf');
    expect(tabFromPath('/WHY')).toBe('why');
  });

  // A parent who lands on a URL we do not serve should get tonight's story,
  // not an empty screen.
  it('falls back to tonight for anything unknown', () => {
    expect(tabFromPath('/nonsense/')).toBe('tonight');
    expect(tabFromPath('/s/two-birds/')).toBe('tonight');
  });

  it('round-trips every tab', () => {
    for (const t of ['tonight', 'shelf', 'map', 'why'] as const)
      expect(tabFromPath(pathForTab(t))).toBe(t);
  });
});
