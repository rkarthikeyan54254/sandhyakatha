import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import * as P from './lib/profile';

// Exercise the real App hooks, persistence effects and callback boundaries.
// Only presentation is stubbed: no production browser/account is touched.
const view = vi.hoisted(() => ({ props: null as any }));
vi.mock('./ui/Tonight', () => ({ default: (props: any) => { view.props = props; return null; } }));
vi.mock('./ui/Chrome', () => ({ Header: () => null, Tabs: () => null }));
vi.mock('./ui/Reader', () => ({ default: () => null }));
vi.mock('./ui/Shelf', () => ({ default: () => null }));
vi.mock('./ui/Constellation', () => ({ default: () => null }));
vi.mock('./ui/Why', () => ({ default: () => null }));

let tree: ReactTestRenderer;
let disk: Map<string, string>;
let remote: P.Profile;
let owner: string;
let failure: 'GET401' | 'PUT401' | null;
let pausePut: (() => Promise<void>) | null;
let pauseLogout: (() => Promise<void>) | null;
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
beforeEach(() => {
  disk = new Map(); owner = 'A'; failure = null; pausePut = null; pauseLogout = null;
  remote = { ...P.emptyProfile(), owner, children: [{ id: 'c', name: 'Alpha', age: 8 }], activeId: 'c',
    heard: { c: { old: '2026-09-01' } }, updatedAt: '2026-09-12T00:00:00.000Z' };
  vi.stubGlobal('localStorage', { getItem: (k: string) => disk.get(k) ?? null, setItem: (k: string, v: string) => disk.set(k, v) });
  vi.stubGlobal('window', { location: { href: 'https://test.invalid/' }, history: { replaceState() {} }, setTimeout, clearTimeout });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith('/data/')) return response(url.endsWith('index.json') ? { stories: [] } : null);
    if (url === '/api/signout') { await pauseLogout?.(); failure = 'GET401'; return new Response(null, { status: 204 }); }
    if (!init?.method) return failure === 'GET401' ? response({}, 401) : response({ account: { id: owner }, profile: remote });
    await pausePut?.();
    if (failure === 'PUT401') return response({}, 401);
    remote = P.merge(JSON.parse(init.body as string), remote, { canonicalIdsFrom: 'b' });
    return response({ profile: remote });
  }));
});
afterEach(() => { act(() => tree?.unmount()); vi.unstubAllGlobals(); });
async function mount() { await act(async () => { tree = create(<App />); }); await flush(); }

it('adopts and persists older saved history in the actual App on a fresh device', async () => {
  await mount();
  expect(view.props.profile.owner).toBe('A');
  expect(P.load().heard.c.old).toBe('2026-09-01');
});

it.each(['GET401', 'PUT401'] as const)('does not clear persisted history on sign-out with %s', async mode => {
  await mount(); failure = mode;
  const before = JSON.stringify(P.load());
  await act(async () => { expect(await view.props.onSignOut()).toBe('unsaved'); });
  await flush();
  expect(JSON.stringify(P.load())).toBe(before);
  expect(view.props.syncPending).toBe(true);
});

it('round-trips App sign-out and fresh sign-in to the same account', async () => {
  await mount();
  await act(async () => { expect(await view.props.onSignOut()).toBe('ok'); });
  expect(P.load().children).toEqual([]);
  failure = null;
  await act(async () => { await view.props.onAccountChanged(); }); await flush();
  expect(P.load().heard.c.old).toBe('2026-09-01');
});

it('preserves and retries an edit while the initial account sync is pending', async () => {
  const local = { ...remote, heard: { c: { local: '2026-09-02' } } };
  P.save(local);
  let release!: () => void;
  const blocked = new Promise<void>(r => { release = r; });
  pausePut = () => blocked;
  await mount();
  act(() => view.props.patchChild('c', { name: 'Renamed', age: 9 }));
  pausePut = null; release(); await flush(); await flush();
  expect(P.load().children[0]).toMatchObject({ name: 'Renamed', age: 9 });
  expect(Object.keys(P.load().heard.c).sort()).toEqual(['local', 'old']);
  expect(remote.children[0].name).toBe('Renamed');
});

it('never clears an edit made while the logout request is pending', async () => {
  await mount();
  let release!: () => void;
  pauseLogout = () => new Promise<void>(r => { release = r; });
  let result!: Promise<string>;
  await act(async () => { result = view.props.onSignOut(); });
  act(() => view.props.patchChild('c', { name: 'Keep me' }));
  await act(async () => { release(); expect(await result).toBe('unsaved'); });
  await flush();
  expect(P.load().children[0].name).toBe('Keep me');
  expect(P.load().heard.c.old).toBeTruthy();
});

it('replaces previous-account display with the current account, regardless of clocks', async () => {
  await mount();
  owner = 'B'; remote = { ...P.emptyProfile(), owner, updatedAt: '2020-01-01T00:00:00.000Z' };
  await act(async () => { await view.props.onAccountChanged(); }); await flush();
  expect(P.load().owner).toBe('B');
  expect(P.load().children).toEqual([]);
  expect(P.load().heard).toEqual({});
});

it('ignores a late response from a previous refresh/account generation', async () => {
  await mount();
  const originalFetch = globalThis.fetch;
  let release!: () => void;
  let gets = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/profile' && !init?.method && ++gets === 2) {
      const previous = remote;
      await new Promise<void>(r => { release = r; });
      return response({ account: { id: 'A' }, profile: previous });
    }
    return originalFetch(url, init);
  }));
  await act(async () => { await view.props.onAccountChanged(); });
  owner = 'B'; remote = { ...P.emptyProfile(), owner };
  await act(async () => { await view.props.onAccountChanged(); }); await flush();
  expect(P.load().owner).toBe('B');
  release(); await flush();
  expect(P.load().owner).toBe('B');
  expect(P.load().heard).toEqual({});
});
