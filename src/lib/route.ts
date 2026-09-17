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
 * back, and a pure function in between so it can be tested without a DOM.
 */
import type { Tab } from '../ui/Chrome';

export const TAB_PATHS: Record<Tab, string> = {
  tonight: '/',
  shelf: '/shelf/',
  map: '/map/',
  why: '/why/',
};

/** Trailing slash optional, case-insensitive, anything unknown is tonight. */
export function tabFromPath(pathname: string): Tab {
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
