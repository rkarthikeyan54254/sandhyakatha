import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentTab, onRoutePop, pathForTab, pushTabPath, tabFromPath } from './route';

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

describe('partial browser environments', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not assume a partial window has History or event APIs', () => {
    vi.stubGlobal('window', {
      location: { href: 'https://test.invalid/' },
      history: { replaceState() {} },
      setTimeout,
      clearTimeout
    });

    expect(currentTab()).toBe('tonight');
    expect(pushTabPath('map')).toBe(false);

    let called = false;
    const dispose = onRoutePop(() => { called = true; });
    expect(() => dispose()).not.toThrow();
    expect(called).toBe(false);
  });

  it('uses History and popstate when the browser provides them', () => {
    const pushState = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.stubGlobal('window', {
      location: { pathname: '/', search: '?x=1' },
      history: { pushState },
      addEventListener,
      removeEventListener
    });

    expect(pushTabPath('map')).toBe(true);
    expect(pushState).toHaveBeenCalledWith({ tab: 'map' }, '', '/map/?x=1');

    const listener = vi.fn();
    const dispose = onRoutePop(listener);
    expect(addEventListener).toHaveBeenCalledWith('popstate', listener);
    dispose();
    expect(removeEventListener).toHaveBeenCalledWith('popstate', listener);
  });
});
