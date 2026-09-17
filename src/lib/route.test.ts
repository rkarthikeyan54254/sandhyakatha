import { describe, expect, it } from 'vitest';
import { currentTab, pathForTab, tabFromPath } from './route';

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

  // Regression: this ran inside App's useState initialiser against
  // window.location.pathname, which is undefined under the test renderer. It
  // threw before the app had rendered anything, taking all eight session tests
  // with it. A missing path must degrade to tonight, never to a blank screen.
  it('survives a missing or non-string path', () => {
    expect(tabFromPath(undefined)).toBe('tonight');
    expect(tabFromPath(null)).toBe('tonight');
    expect(tabFromPath(undefined as unknown as string)).toBe('tonight');
    expect(currentTab()).toBe('tonight');
  });

  it('round-trips every tab', () => {
    for (const t of ['tonight', 'shelf', 'map', 'why'] as const)
      expect(tabFromPath(pathForTab(t))).toBe(t);
  });
});
