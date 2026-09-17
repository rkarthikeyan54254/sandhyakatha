/**
 * Addresses for the four surfaces.
 *
 * Until now the whole app lived at "/" and the current surface was React state,
 * which meant the shelf and the constellation could not be linked to, the
 * browser's back button left the site instead of going back a screen, and
 * search engines saw one page where there are four.
 *
 * No router dependency: this is a PWA that has to stay small and work offline,
 * and four routes do not need one. pushState on the way in, popstate on the way
 * back, and pure functions in between so they can be tested without a DOM.
 */
import type { Tab } from '../ui/Chrome';

export const TAB_PATHS: Record<Tab, string> = {
  tonight: '/',
  shelf: '/shelf/',
  map: '/map/',
  why: '/why/',
};

/**
 * Trailing slash optional, case-insensitive, and anything we cannot make sense
 * of is tonight's story.
 *
 * The argument is deliberately permissive. This runs in a `useState`
 * initialiser, which is the very first thing the app does, and it is handed
 * whatever `window.location.pathname` happens to be — which is `undefined`
 * under the test renderer, and can be missing in any non-browser environment.
 * A bad path must never be the reason a parent gets a blank screen.
 */
export function tabFromPath(pathname?: string | null): Tab {
  if (typeof pathname !== 'string') return 'tonight';
  switch (pathname.toLowerCase().replace(/\/+$/, '')) {
    case '/shelf': return 'shelf';
    case '/map': return 'map';
    case '/why': return 'why';
    default: return 'tonight';
  }
}

export function pathForTab(tab: Tab): string {
  return TAB_PATHS[tab] ?? '/';
}

/** Where we are now, safe to call before we know there is a browser. */
export function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  const p = window.location?.pathname;
  return typeof p === 'string' ? p : '/';
}

/** The surface the current address names. */
export function currentTab(): Tab {
  return tabFromPath(currentPath());
}

/**
 * Push a surface address only when this environment actually implements the
 * History API. A partial `window` is common in tests and embedded renderers;
 * existence alone is not a capability guarantee.
 *
 * Returns true only when a new history entry was written.
 */
export function pushTabPath(tab: Tab): boolean {
  if (typeof window === 'undefined') return false;
  const pushState = window.history?.pushState;
  if (typeof pushState !== 'function') return false;

  const path = pathForTab(tab);
  if (currentPath() === path) return false;

  const search = typeof window.location?.search === 'string' ? window.location.search : '';
  pushState.call(window.history, { tab }, '', path + search);
  return true;
}

/**
 * Subscribe to browser back/forward only when the host really provides the
 * event API. Returns a cleanup function in every environment.
 */
export function onRoutePop(listener: () => void): () => void {
  if (
    typeof window === 'undefined' ||
    typeof window.addEventListener !== 'function' ||
    typeof window.removeEventListener !== 'function'
  ) return () => {};

  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}
