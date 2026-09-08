import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncProfile } from './sync';
import { emptyProfile, newChild, type Profile } from './profile';

/**
 * The rule under test is a privacy rule, not a convenience one: a device
 * holding one family's copy must never merge it into, or upload it to, a
 * different account. Everything else here is scaffolding for that.
 */
const A = 'aaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbb';

function profileFor(owner: string | null, childName: string, heard: Record<string, string> = {}): Profile {
  const c = newChild(childName, 8);
  return { ...emptyProfile(), owner, children: [c], activeId: c.id, heard: { [c.id]: heard },
           updatedAt: '2026-09-08T20:00:00.000Z' };
}

let calls: { url: string; method: string; body?: any }[] = [];

/** Stands in for the site's own /api/profile. */
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
    const theirs = profileFor(B, 'Meera');
    server(B, theirs);

    const out = await syncProfile(profileFor(A, 'Rakshu', { squirrel: '2026-09-01' }));

    expect(out.children.map(c => c.name)).toEqual(['Meera']);
    expect(JSON.stringify(out)).not.toContain('Rakshu');
    expect(out.owner).toBe(B);
    // The decisive assertion: nothing was written to the new account.
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
  });

  it('starts empty when the new account has nothing stored', async () => {
    server(B, null);
    const out = await syncProfile(profileFor(A, 'Rakshu'));
    expect(out.children).toEqual([]);
    expect(out.owner).toBe(B);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0);
  });
});

describe('the ordinary paths still work', () => {
  it('claims an anonymous local profile on first sign-in', async () => {
    server(A, null);
    const out = await syncProfile(profileFor(null, 'Rakshu'));
    expect(out.children.map(c => c.name)).toEqual(['Rakshu']);
    expect(out.owner).toBe(A);
    // and it is pushed, so signing in does not silently discard the setup
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(1);
  });

  it('merges when the same account comes back', async () => {
    const stored = profileFor(A, 'Rakshu');
    stored.updatedAt = '2026-09-07T20:00:00.000Z';
    server(A, stored);
    const local = { ...profileFor(A, 'Rakshu'), gate: true };
    const out = await syncProfile(local);
    expect(out.owner).toBe(A);
    expect(out.gate).toBe(true);
    expect(calls.filter(c => c.method === 'PUT')).toHaveLength(1);
  });

  it('does nothing at all when signed out', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })) as any;
    const local = profileFor(null, 'Rakshu');
    expect(await syncProfile(local)).toBe(local);
  });
});
