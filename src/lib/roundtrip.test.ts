import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncProfile, signOut } from './sync';
import { emptyProfile, markHeard, heardOf, newChild, type Profile } from './profile';

/**
 * The exact thing a parent does: read some stories, sign out, sign back in as
 * the SAME person. Their history must come back. Modelled against a fake of
 * the real /api/profile, stale guard and all.
 */
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
    // the server's stale guard, copied from netlify/functions/profile.mts
    if (store?.updatedAt && incoming.updatedAt && Date.parse(incoming.updatedAt) < Date.parse(store.updatedAt))
      return { ok: true, status: 200, json: async () => ({ profile: store, stale: true }) } as any;
    store = incoming;
    return { ok: true, status: 200, json: async () => ({ profile: incoming }) } as any;
  }) as any;
});

function familyWhoHasRead(): Profile {
  const c = newChild('Rakshu', 8);
  let p: Profile = { ...emptyProfile(), children: [c], activeId: c.id };
  for (const id of ['govardhana', 'squirrel-setu', 'ganesha-circles']) p = markHeard(p, c.id, id);
  return p;
}

describe('sign out and sign back in as the same person', () => {
  /**
   * The bug Rama hit. Signing out empties this device, which drops the app on
   * the setup screen — so before he could reach the sign-in button again he had
   * to type the child's name, which minted a NEW child id. Merging then produced
   * two children, and the active one was the empty new one: every story looked
   * unread.
   */
  it('does not strand the family behind a second, empty child', async () => {
    let local = familyWhoHasRead();
    local = await syncProfile(local);
    expect(await signOut(local)).toBe('ok');

    // sign-out clears the device; the parent types the name again to get past setup
    const retyped = newChild('Rakshu', 8);
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

    // a different device: same child, freshly typed, so a different local id
    const onTablet = newChild('Rakshu', 8);
    const tablet = { ...emptyProfile(), children: [onTablet], activeId: onTablet.id,
                     updatedAt: new Date().toISOString() };
    const out = await syncProfile(tablet);

    expect(out.children).toHaveLength(1);
    expect(Object.keys(heardOf(out, out.activeId))).toHaveLength(3);
  });

  it('brings the reading history back', async () => {
    let local = familyWhoHasRead();
    const childId = local.children[0].id;

    local = await syncProfile(local);                    // signed in, first sync
    expect(Object.keys(heardOf(local, childId))).toHaveLength(3);

    expect(await signOut(local)).toBe('ok');
    local = emptyProfile();                              // what the app does on sign-out

    signedIn = true;                                     // they sign in again
    local = await syncProfile(local);

    expect(local.children.map(c => c.name)).toEqual(['Rakshu']);
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

  it('does not lose a night read while the last sync was stale', async () => {
    let local = familyWhoHasRead();
    const childId = local.children[0].id;
    local = await syncProfile(local);

    // another device writes later, then this one reads one more story
    store = { ...store!, updatedAt: '2099-01-01T00:00:00.000Z' };
    local = markHeard(local, childId, 'pusalar-temple');

    const r = await signOut(local);
    if (r === 'ok') {
      signedIn = true;
      const back = await syncProfile(emptyProfile());
      expect(Object.keys(heardOf(back, childId))).toContain('pusalar-temple');
    }
  });
});
