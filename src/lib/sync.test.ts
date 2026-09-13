import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncProfile } from './sync';
import { emptyProfile, newChild, type Profile } from './profile';

const A = 'aaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbb';

function profileFor(owner: string | null, childName: string, heard: Record<string, string> = {}): Profile {
  const c = newChild(childName, 8);
  return { ...emptyProfile(), owner, children: [c], activeId: c.id, heard: { [c.id]: heard },
           updatedAt: '2026-09-08T20:00:00.000Z' };
}

let calls: { url: string; method: string; body?: any }[] = [];

function server(accountId: string, stored: Profile | null) {
  globalThis.fetch = vi.fn(async (url: any, init: any = {}) => {
    const method = init.method ?? 'GET';
    calls.push({ url: String(url), method, body: init.body ? JSON.parse(init.body) : undefined });
    if (method === 'GET')
      return { ok: true, status: 200, json: async () => ({ account: { id: accountId, email: null, kind: 'code' }, profile: stored }) } as any;
    return { ok: true, status: 200, json: async () => ({ profile: JSON.parse(init.body) }) } as any;
  }) as any;
}

beforeEach(() => { calls = []; });

describe('a second account signing in on the same browser', () => {
  it('never merges or uploads the previous family\'s copy', async () => {
    const theirs = profileFor(B, 'Delta');
    server(B, theirs);

    const out = await syncProfile(profileFor(A, 'Alpha', { squirrel: '2026-09-01' }));

    expect(out.children.map(c => c.name)).toEqual(['Delta']);
    expect(JSON.stringify(out)).not.toContain('Alpha');
    expect(out.owner).toBe(B);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
  });

  it('starts empty when the new account has nothing stored', async () => {
    server(B, null);
    const out = await syncProfile(profileFor(A, 'Alpha'));
    expect(out.children).toEqual([]);
    expect(out.owner).toBe(B);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
  });
});

describe('the ordinary paths still work', () => {
  it('claims an anonymous local profile on first sign-in', async () => {
    server(A, null);
    const out = await syncProfile(profileFor(null, 'Alpha'));
    expect(out.children.map(c => c.name)).toEqual(['Alpha']);
    expect(out.owner).toBe(A);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(1);
  });

  it('merges when the same account comes back with nights of its own', async () => {
    const stored = profileFor(A, 'Alpha', { govardhana: '2026-09-01' });
    stored.updatedAt = '2026-09-07T20:00:00.000Z';
    server(A, stored);
    const local = { ...profileFor(A, 'Alpha', { 'squirrel-setu': '2026-09-08' }), gate: true };
    const out = await syncProfile(local);
    expect(out.owner).toBe(A);
    expect(out.gate).toBe(true);
    expect(Object.keys(out.heard[out.activeId!])).toEqual(
      expect.arrayContaining(['govardhana', 'squirrel-setu']));
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(1);
  });

  it('takes the account copy whole when a fresh anonymous device has read nothing', async () => {
    const stored = profileFor(A, 'Alpha', { govardhana: '2026-09-01' });
    stored.gate = true;
    server(A, stored);
    const out = await syncProfile({ ...profileFor(null, 'Alpha'), gate: false });
    expect(out.gate).toBe(true);
    expect(out.children).toHaveLength(1);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
  });

  it('does not discard a signed-in rename merely because there are no reading nights', async () => {
    const stored = profileFor(A, 'Beta');
    stored.updatedAt = '2026-09-10T00:00:00.000Z';
    const local: Profile = {
      ...stored,
      children: [{ ...stored.children[0], name: 'Gamma' }],
      updatedAt: '2026-09-11T00:00:00.000Z'
    };
    server(A, stored);
    const out = await syncProfile(local);
    expect(out.children).toHaveLength(1);
    expect(out.children[0].name).toBe('Gamma');
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(1);
  });

  it('keeps the account child id when a fresh device has an older independent id', async () => {
    const serverChild = { id: 'server-id', name: 'Alpha', age: 8 };
    const localChild = { id: 'local-id', name: 'Alpha', age: 8 };
    const stored: Profile = { ...emptyProfile(), owner: A, children: [serverChild], activeId: serverChild.id,
      heard: { [serverChild.id]: { remote: '2026-09-11' } }, updatedAt: '2026-09-11T20:00:00.000Z' };
    const local: Profile = { ...emptyProfile(), owner: A, children: [localChild], activeId: localChild.id,
      heard: { [localChild.id]: { local: '2026-09-10' } }, updatedAt: '2026-09-10T20:00:00.000Z' };
    server(A, stored);
    const out = await syncProfile(local);
    expect(out.children).toEqual([serverChild]);
    expect(Object.keys(out.heard[serverChild.id]).sort()).toEqual(['local', 'remote']);
    expect(out.heard[localChild.id]).toBeUndefined();
    const put = calls.find(c => c.method === 'PUT')!;
    expect(put.body.children).toEqual([serverChild]);
  });

  it('adopts the server profile returned by an accepted write', async () => {
    const child = { id: 'child', name: 'Beta', age: 8 };
    const local: Profile = { ...emptyProfile(), owner: A, children: [child], activeId: child.id,
      heard: { [child.id]: { local: '2026-09-10' } }, updatedAt: '2026-09-10T20:00:00.000Z' };
    globalThis.fetch = vi.fn(async (_url: any, init: any = {}) => {
      const method = init.method ?? 'GET';
      if (method === 'GET')
        return { ok: true, status: 200, json: async () => ({ account: { id: A, email: null, kind: 'code' }, profile: null }) } as any;
      const body = JSON.parse(init.body);
      return { ok: true, status: 200, json: async () => ({
        profile: { ...body, heard: { [child.id]: { ...body.heard[child.id], server: '2026-09-09' } } }
      }) } as any;
    }) as any;
    const out = await syncProfile(local);
    expect(Object.keys(out.heard[child.id]).sort()).toEqual(['local', 'server']);
  });

  it('does nothing at all when signed out', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })) as any;
    const local = profileFor(null, 'Alpha');
    expect(await syncProfile(local)).toBe(local);
  });
});

describe('stale writes are reconciled before sync resolves', () => {
  it('retries with the server copy instead of returning an unacknowledged merge', async () => {
    const child = { id: 'child', name: 'Beta', age: 8 };
    const local: Profile = { ...emptyProfile(), owner: A, children: [child], activeId: child.id,
      heard: { [child.id]: { local: '2026-09-10' } }, updatedAt: '2026-09-10T20:00:00.000Z' };
    const remote: Profile = { ...emptyProfile(), owner: A, children: [child], activeId: child.id,
      heard: { [child.id]: { remote: '2026-09-11' } }, updatedAt: '2026-09-11T20:00:00.000Z' };
    let puts = 0;

    globalThis.fetch = vi.fn(async (_url: any, init: any = {}) => {
      const method = init.method ?? 'GET';
      if (method === 'GET')
        return { ok: true, status: 200, json: async () => ({ account: { id: A, email: null, kind: 'code' }, profile: null }) } as any;
      puts++;
      if (puts === 1)
        return { ok: true, status: 200, json: async () => ({ stale: true, profile: remote }) } as any;
      return { ok: true, status: 200, json: async () => ({ profile: JSON.parse(init.body) }) } as any;
    }) as any;

    const out = await syncProfile(local);
    expect(puts).toBe(2);
    expect(Object.keys(out.heard[child.id]).sort()).toEqual(['local', 'remote']);
  });
});
