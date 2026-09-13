import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncProfile, signOut } from './sync';
import { emptyProfile, markHeard, heardOf, newChild, removeChild, duplicateIdConflicts, repairDuplicateId, patchChildProfile, type Profile } from './profile';

const ID = 'aaaaaaaaaaaaaaaa';

let store: Profile | null;
let signedIn: boolean;

beforeEach(() => {
  store = null;
  signedIn = true;
  globalThis.fetch = vi.fn(async (url: any, init: any = {}) => {
    const path = String(url);
    const method = init.method ?? 'GET';
    if (path === '/api/signout') { signedIn = false; return { ok: true, status: 204, json: async () => ({}) } as any; }
    if (!signedIn) return { ok: false, status: 401, json: async () => ({}) } as any;
    if (method === 'GET')
      return { ok: true, status: 200,
               json: async () => ({ account: { id: ID, email: 'a@x.com', kind: 'google' }, profile: store }) } as any;
    const incoming = JSON.parse(init.body);
    if (store?.updatedAt && incoming.updatedAt && Date.parse(incoming.updatedAt) < Date.parse(store.updatedAt))
      return { ok: true, status: 200, json: async () => ({ profile: store, stale: true }) } as any;
    store = incoming;
    return { ok: true, status: 200, json: async () => ({ profile: incoming }) } as any;
  }) as any;
});

function familyWhoHasRead(): Profile {
  const c = newChild('Alpha', 8);
  let p: Profile = { ...emptyProfile(), children: [c], activeId: c.id };
  for (const id of ['govardhana', 'squirrel-setu', 'ganesha-circles']) p = markHeard(p, c.id, id);
  return p;
}

describe('sign out and sign back in as the same person', () => {
  it('does not strand the family behind a second, empty child', async () => {
    let local = familyWhoHasRead();
    local = await syncProfile(local);
    expect(await signOut(local)).toBe('ok');

    const retyped = newChild('Alpha', 8);
    local = { ...emptyProfile(), children: [retyped], activeId: retyped.id,
              updatedAt: new Date().toISOString() };

    signedIn = true;
    local = await syncProfile(local);

    expect(local.children).toHaveLength(1);
    expect(Object.keys(heardOf(local, local.activeId))).toHaveLength(3);
  });

  it('folds a child typed on a second device into the one the account knows', async () => {
    let first = familyWhoHasRead();
    first = await syncProfile(first);

    const onTablet = newChild('Alpha', 8);
    const tablet = { ...emptyProfile(), children: [onTablet], activeId: onTablet.id,
                     updatedAt: new Date().toISOString() };
    const out = await syncProfile(tablet);

    expect(out.children).toHaveLength(1);
    expect(Object.keys(heardOf(out, out.activeId))).toHaveLength(3);
  });

  it('brings the reading history back', async () => {
    let local = familyWhoHasRead();
    const childId = local.children[0].id;

    local = await syncProfile(local);
    expect(Object.keys(heardOf(local, childId))).toHaveLength(3);

    expect(await signOut(local)).toBe('ok');
    local = emptyProfile();

    signedIn = true;
    local = await syncProfile(local);

    expect(local.children.map(c => c.name)).toEqual(['Alpha']);
    expect(Object.keys(heardOf(local, childId))).toHaveLength(3);
  });

  it('keeps the difficult-stories setting across the round trip', async () => {
    let local = { ...familyWhoHasRead(), gate: true };
    local = await syncProfile(local);
    expect(await signOut(local)).toBe('ok');
    local = emptyProfile();
    signedIn = true;
    local = await syncProfile(local);
    expect(local.gate).toBe(true);
  });

  it('does not lose a night when the first write races a newer server copy', async () => {
    let local = familyWhoHasRead();
    const childId = local.children[0].id;
    local = await syncProfile(local);

    store = { ...store!, updatedAt: '2099-01-01T00:00:00.000Z' };
    local = markHeard(local, childId, 'pusalar-temple');

    expect(await signOut(local)).toBe('ok');
    signedIn = true;
    const back = await syncProfile(emptyProfile());
    expect(Object.keys(heardOf(back, childId))).toContain('pusalar-temple');
  });
});

describe('identity edits and deletions round-trip through the account', () => {
  it('a rename does not create a second selected child and survives refresh', async () => {
    let local = familyWhoHasRead();
    local = await syncProfile(local);
    const id = local.children[0].id;
    local = patchChildProfile(local, id, { name: 'Delta' });
    local = await syncProfile(local);

    const back = await syncProfile({ ...emptyProfile(), owner: ID });
    expect(back.children).toHaveLength(1);
    expect(back.children[0]).toMatchObject({ id, name: 'Delta' });
    expect(Object.keys(heardOf(back, id))).toHaveLength(3);
  });

  it('a deliberate child deletion stays deleted after refresh and sign-in', async () => {
    const a = newChild('Beta', 9), b = newChild('Delta', 13);
    let local: Profile = { ...emptyProfile(), children: [a, b], activeId: a.id };
    local = markHeard(local, a.id, 'govardhana');
    local = markHeard(local, b.id, 'ganesha-circles');
    local = await syncProfile(local);

    local = removeChild(local, a.id);
    local = await syncProfile(local);
    expect(local.deletedChildren?.[a.id]).toBeTruthy();

    const back = await syncProfile({ ...emptyProfile(), owner: ID });
    expect(back.children.map(c => c.id)).toEqual([b.id]);
    expect(back.heard[a.id]).toBeUndefined();
    expect(back.heard[b.id]).toBeTruthy();
  });

  it('preserves an already-stored conflicting duplicate id until the parent chooses', async () => {
    store = {
      ...emptyProfile(), owner: ID,
      children: [
        { id: 'same', name: 'Gamma', age: 9 },
        { id: 'same', name: 'Delta', age: 13 }
      ],
      activeId: 'same',
      heard: { same: { govardhana: '2026-09-10', 'squirrel-setu': '2026-09-11' } },
      updatedAt: '2026-09-12T00:00:00.000Z'
    };
    const back = await syncProfile(emptyProfile());
    expect(back.children).toHaveLength(2);
    expect(duplicateIdConflicts(back)).toHaveLength(1);
    expect(Object.keys(back.heard.same).sort()).toEqual(['govardhana', 'squirrel-setu']);
  });

  it('round-trips an explicit duplicate-id repair without losing the shared history', async () => {
    store = {
      ...emptyProfile(), owner: ID,
      children: [
        { id: 'same', name: 'Gamma', age: 9 },
        { id: 'same', name: 'Delta', age: 13 }
      ],
      activeId: 'same',
      heard: { same: { govardhana: '2026-09-10', 'squirrel-setu': '2026-09-11' } },
      updatedAt: '2026-09-12T00:00:00.000Z'
    };
    let local = await syncProfile(emptyProfile());
    local = repairDuplicateId(local, 'same', 0); // parent says the old history is Gamma's
    local = await syncProfile(local);
    expect(duplicateIdConflicts(local)).toEqual([]);
    expect(local.deletedChildren?.same).toBeTruthy();
    const beta = local.children.find(c => c.name === 'Gamma')!;
    const delta = local.children.find(c => c.name === 'Delta')!;
    expect(Object.keys(local.heard[beta.id]).sort()).toEqual(['govardhana', 'squirrel-setu']);
    expect(local.heard[delta.id]).toBeUndefined();
    expect(local.heard.same).toBeUndefined();
  });
});
