import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncProfile, signOut } from './sync';
import { adoptSnapshot } from './sync-adoption';
import { emptyProfile, markHeard, patchChildProfile, addChildToProfile, removeChild, setGateSetting, type Profile } from './profile';

const family = (): Profile => ({ ...emptyProfile(), owner: 'A', children: [{ id: 'c', name: 'Alpha', age: 8 }],
  activeId: 'c', heard: { c: { old: '2026-09-01' } }, updatedAt: '2026-09-12T00:00:00.000Z' });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => vi.unstubAllGlobals());

describe('snapshot adoption, not clock ordering', () => {
  it('restores an older account snapshot on a fresh device', () => {
    const fresh = emptyProfile(), saved = family();
    expect(adoptSnapshot(fresh, fresh, saved, 1, 1)).toBe(saved);
  });
  it.each(['rename', 'age', 'add', 'delete', 'gate', 'read'] as const)('preserves an intervening %s even with a future server clock', kind => {
    const before = family();
    const edits = {
      rename: () => patchChildProfile(before, 'c', { name: 'Beta' }),
      age: () => patchChildProfile(before, 'c', { age: 9 }),
      add: () => addChildToProfile(before, 'Delta', 7),
      delete: () => removeChild(before, 'c'),
      gate: () => setGateSetting(before, true),
      read: () => markHeard(before, 'c', 'new')
    };
    const edited = edits[kind]();
    expect(adoptSnapshot(edited, before, { ...before, updatedAt: '2099-01-01' }, 1, 1)).toBe(edited);
  });
  it('rejects a response from a previous account generation', () => {
    const fresh = emptyProfile();
    expect(adoptSnapshot(fresh, fresh, family(), 1, 2)).toBe(fresh);
  });
});

describe('truthful acknowledgement and sign-out', () => {
  it('merges anonymous settings edited during first sign-in rather than treating them as a fresh placeholder', async () => {
    const saved = family();
    const local = setGateSetting(emptyProfile(), true);
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) =>
      !init?.method ? reply({ account: { id: 'A' }, profile: saved })
        : reply({ profile: JSON.parse(init.body as string) })));
    const out = await syncProfile(local, 'A', true);
    expect(out.gate).toBe(true);
    expect(out.heard.c.old).toBeTruthy();
  });
  it.each(['GET401', 'PUT401', 'PUT204', 'missing-profile', 'network', 'CAS'] as const)('retains the exact local snapshot after %s', async failure => {
    const local = family(), persisted = JSON.stringify(local);
    const paths: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      paths.push(url);
      if (failure === 'network') throw new Error('offline');
      if (!init?.method) return failure === 'GET401' ? reply({}, 401) : reply({ account: { id: 'A' }, profile: local });
      if (failure === 'PUT401') return reply({}, 401);
      if (failure === 'PUT204') return new Response(null, { status: 204 });
      if (failure === 'CAS') return reply({ stale: true, profile: local });
      return reply({});
    }));
    expect(await signOut(local)).toBe('unsaved');
    expect(paths).not.toContain('/api/signout');
    expect(JSON.stringify(local)).toBe(persisted);
  });
  it('keeps anonymous sync local but never calls it an acknowledged sign-out', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply({}, 401)));
    const local = { ...family(), owner: null };
    expect(await syncProfile(local)).toBe(local);
    expect(await signOut(local)).toBe('unsaved');
  });
  it('rejects a different account than the refresh expected', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply({ account: { id: 'B' }, profile: null })));
    await expect(syncProfile(emptyProfile(), 'A')).rejects.toThrow('account changed');
    expect(await signOut(family())).toBe('unsaved');
  });
  it.each(['backup', 'logout'])('preserves edits made during %s', async stage => {
    let unchanged = true;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/signout') { unchanged = false; return new Response(null, { status: 204 }); }
      if (!init?.method) return reply({ account: { id: 'A' }, profile: family() });
      if (stage === 'backup') unchanged = false;
      return reply({ profile: JSON.parse(init.body as string) });
    }));
    expect(await signOut(family(), () => unchanged)).toBe('unsaved');
  });
});
