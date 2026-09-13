import { describe, it, expect } from 'vitest';
import { reconcileStored, writeReconciled } from './profile.mts';

describe('server-side profile safety', () => {
  it('does not let an older client resurrect a tombstoned child', () => {
    const current = {
      v: 1, children: [], activeId: null, heard: {}, again: {},
      deletedChildren: { child: '2026-09-13T00:00:00.000Z' },
      firstNight: null, owner: 'acct', updatedAt: '2026-09-13T00:00:00.000Z'
    };
    const oldClient = {
      v: 1, children: [{ id: 'child', name: 'Beta', age: 9 }], activeId: 'child',
      heard: { child: { govardhana: '2026-09-01' } }, again: {},
      firstNight: '2026-09-01', owner: 'acct', updatedAt: '2026-09-14T00:00:00.000Z'
    };
    const out = reconcileStored(current, oldClient);
    expect(out.children).toEqual([]);
    expect(out.heard.child).toBeUndefined();
    expect(out.deletedChildren.child).toBe('2026-09-13T00:00:00.000Z');
  });

  it('never erases a recorded reading night on an accepted write', () => {
    const current = {
      v: 1, children: [{ id: 'child', name: 'Beta', age: 9 }], activeId: 'child',
      heard: { child: { govardhana: '2026-09-01' } }, again: {}, deletedChildren: {},
      firstNight: '2026-09-01', owner: 'acct', updatedAt: '2026-09-10T00:00:00.000Z'
    };
    const incoming = {
      ...current,
      heard: { child: { 'squirrel-setu': '2026-09-11' } },
      firstNight: '2026-09-11', updatedAt: '2026-09-11T00:00:00.000Z'
    };
    const out = reconcileStored(current, incoming);
    expect(Object.keys(out.heard.child).sort()).toEqual(['govardhana', 'squirrel-setu']);
    expect(out.firstNight).toBe('2026-09-01');
  });

  it('stores only one row for the same child id, with incoming metadata', () => {
    const current = {
      v: 1, children: [{ id: 'same', name: 'Beta', age: 8 }], activeId: 'same',
      heard: {}, again: {}, deletedChildren: {}, firstNight: null, owner: 'acct',
      updatedAt: '2026-09-10T00:00:00.000Z'
    };
    const incoming = {
      ...current,
      children: [{ id: 'same', name: 'Gamma', age: 9 }],
      updatedAt: '2026-09-11T00:00:00.000Z'
    };
    const out = reconcileStored(current, incoming);
    expect(out.children).toEqual([{ id: 'same', name: 'Gamma', age: 9 }]);
  });

  it('preserves conflicting duplicate-id rows instead of silently choosing a child', () => {
    const current = {
      v: 1,
      children: [
        { id: 'same', name: 'Gamma', age: 9 },
        { id: 'same', name: 'Delta', age: 13 }
      ],
      activeId: 'same', heard: { same: { govardhana: '2026-09-01' } }, again: {},
      deletedChildren: {}, firstNight: '2026-09-01', owner: 'acct',
      updatedAt: '2026-09-12T00:00:00.000Z'
    };
    const out = reconcileStored(current, current);
    expect(out.children).toHaveLength(2);
    expect(out.children.map((c: any) => c.name)).toEqual(['Gamma', 'Delta']);
    expect(out.heard.same).toEqual({ govardhana: '2026-09-01' });
  });

  it('accepts an explicit repair by tombstoning the corrupt id and storing fresh child ids', () => {
    const current = {
      v: 1,
      children: [
        { id: 'same', name: 'Gamma', age: 9 },
        { id: 'same', name: 'Delta', age: 13 }
      ],
      activeId: 'same', heard: { same: { govardhana: '2026-09-01' } }, again: {},
      deletedChildren: {}, firstNight: '2026-09-01', owner: 'acct',
      updatedAt: '2026-09-12T00:00:00.000Z'
    };
    const incoming = {
      ...current,
      children: [
        { id: 'beta-new', name: 'Gamma', age: 9 },
        { id: 'delta-new', name: 'Delta', age: 13 }
      ],
      activeId: 'beta-new',
      heard: { 'beta-new': { govardhana: '2026-09-01' } },
      deletedChildren: { same: '2026-09-13T00:00:00.000Z' },
      updatedAt: '2026-09-13T00:00:00.000Z'
    };
    const out = reconcileStored(current, incoming);
    expect(out.children.map((c: any) => c.id)).toEqual(['beta-new', 'delta-new']);
    expect(out.heard.same).toBeUndefined();
    expect(out.heard['beta-new']).toEqual({ govardhana: '2026-09-01' });
    expect(out.deletedChildren.same).toBeTruthy();
  });

  it('folds an older client device id into the stored account id and remaps its history', () => {
    const current = {
      v: 1, children: [{ id: 'server-id', name: 'Beta', age: 8 }], activeId: 'server-id',
      heard: { 'server-id': { remote: '2026-09-11' } }, again: {}, deletedChildren: {},
      firstNight: '2026-09-11', owner: 'acct', updatedAt: '2026-09-11T00:00:00.000Z'
    };
    const incoming = {
      v: 1, children: [{ id: 'local-id', name: 'Beta', age: 8 }], activeId: 'local-id',
      heard: { 'local-id': { local: '2026-09-10' } }, again: {}, deletedChildren: {},
      firstNight: '2026-09-10', owner: 'acct', updatedAt: '2026-09-12T00:00:00.000Z'
    };
    const out = reconcileStored(current, incoming);
    expect(out.children).toEqual([{ id: 'server-id', name: 'Beta', age: 8 }]);
    expect(out.activeId).toBe('server-id');
    expect(Object.keys(out.heard['server-id']).sort()).toEqual(['local', 'remote']);
    expect(out.heard['local-id']).toBeUndefined();
  });

});


describe('server concurrency and metadata clocks', () => {
  it('reconciles again after a CAS conflict so two simultaneous reading writes survive', async () => {
    let data: any = {
      v: 1, children: [{ id: 'child', name: 'Beta', age: 8 }], activeId: 'child', gate: false,
      heard: { child: { base: '2026-09-01' } }, again: {}, deletedChildren: {}, retiredChildReasons: {},
      firstNight: '2026-09-01', owner: 'acct', updatedAt: '2026-09-10T00:00:00.000Z'
    };
    let etag = 'e1';
    let firstWrite = true;
    const store = {
      getWithMetadata: async () => ({ data, etag }),
      setJSON: async (_key: string, next: any, options: any) => {
        expect(options.onlyIfMatch).toBe(etag);
        if (firstWrite) {
          firstWrite = false;
          // Another device wins between our read and write.
          data = reconcileStored(data, { ...data,
            heard: { child: { other: '2026-09-11' } }, updatedAt: '2026-09-11T20:00:00.000Z' });
          etag = 'e2';
          return { modified: false };
        }
        data = next; etag = 'e3'; return { modified: true, etag };
      }
    };
    const incoming = { ...data, heard: { child: { mine: '2026-09-12' } }, updatedAt: '2026-09-12T20:00:00.000Z' };
    const out = await writeReconciled(store, 'acct', incoming);
    expect(Object.keys(out.heard.child).sort()).toEqual(['base', 'mine', 'other']);
  });

  it('rejects a claimed conditional-write success that has no etag', async () => {
    const current = { v: 1, children: [], activeId: null, gate: false, heard: {}, again: {},
      deletedChildren: {}, firstNight: null, updatedAt: '2026-09-10T00:00:00.000Z' };
    const store = {
      getWithMetadata: async () => ({ data: current, etag: 'e1' }),
      setJSON: async () => ({ modified: true, etag: '' })
    };
    await expect(writeReconciled(store, 'acct', current)).rejects.toThrow('not acknowledged');
  });

  it('accepts a pre-v5 tab rename when its inherited child clock still equals the account clock', () => {
    const current = {
      v: 1, children: [{ id: 'child', name: 'Alpha', age: 8 }], activeId: 'child', gate: false,
      childUpdatedAt: { child: '2026-09-10T10:00:00.000Z' }, gateUpdatedAt: '2026-09-10T10:00:00.000Z',
      activeUpdatedAt: '2026-09-10T10:00:00.000Z', heard: {}, again: {}, deletedChildren: {},
      retiredChildReasons: {}, firstNight: null, owner: 'acct', updatedAt: '2026-09-10T10:00:00.000Z'
    };
    const oldTabRename = {
      ...current,
      children: [{ id: 'child', name: 'Delta', age: 8 }],
      // v4 moves only the whole-profile clock; it echoes childUpdatedAt unchanged.
      updatedAt: '2026-09-10T10:05:00.000Z'
    };
    const out = reconcileStored(current, oldTabRename);
    expect(out.children).toEqual([{ id: 'child', name: 'Delta', age: 8 }]);
    expect(out.childUpdatedAt.child).toBe('2026-09-10T10:05:00.000Z');
  });

  it('still rejects that same pre-v5 shape when its inherited child clock is older than the account clock', () => {
    const current = {
      v: 1, children: [{ id: 'child', name: 'Gamma', age: 9 }], activeId: 'child', gate: true,
      childUpdatedAt: { child: '2026-09-10T10:10:00.000Z' }, gateUpdatedAt: '2026-09-10T10:10:00.000Z',
      activeUpdatedAt: '2026-09-10T10:10:00.000Z', heard: {}, again: {}, deletedChildren: {},
      retiredChildReasons: {}, firstNight: null, owner: 'acct', updatedAt: '2026-09-10T10:10:00.000Z'
    };
    const staleOldTab = {
      ...current,
      children: [{ id: 'child', name: 'Alpha', age: 8 }],
      childUpdatedAt: { child: '2026-09-10T10:00:00.000Z' },
      heard: { child: { squirrel: '2026-09-10' } },
      updatedAt: '2026-09-10T10:15:00.000Z'
    };
    const out = reconcileStored(current, staleOldTab);
    expect(out.children).toEqual([{ id: 'child', name: 'Gamma', age: 9 }]);
    expect(out.heard.child.squirrel).toBe('2026-09-10');
  });

  it('does not let an old client story read roll back newer child metadata or gate state', () => {
    const current = {
      v: 1, children: [{ id: 'child', name: 'Gamma', age: 9 }], activeId: 'child', gate: true,
      childUpdatedAt: { child: '2026-09-10T10:00:00.000Z' }, gateUpdatedAt: '2026-09-10T10:00:00.000Z',
      activeUpdatedAt: '2026-09-10T10:00:00.000Z', heard: {}, again: {}, deletedChildren: {},
      retiredChildReasons: {}, firstNight: null, owner: 'acct', updatedAt: '2026-09-10T10:00:00.000Z'
    };
    // Old browser has no field clocks; its later updatedAt is only because it read a story.
    const oldClient = {
      v: 1, children: [{ id: 'child', name: 'Beta', age: 8 }], activeId: 'child', gate: false,
      heard: { child: { squirrel: '2026-09-10' } }, again: {}, deletedChildren: {},
      firstNight: '2026-09-10', owner: 'acct', updatedAt: '2026-09-10T10:05:00.000Z'
    };
    const out = reconcileStored(current, oldClient);
    expect(out.children).toEqual([{ id: 'child', name: 'Gamma', age: 9 }]);
    expect(out.gate).toBe(true);
    expect(out.heard.child.squirrel).toBe('2026-09-10');
  });

  it('quarantines stale history after an identity repair instead of dropping it', () => {
    const current = {
      v: 1, children: [{ id: 'new', name: 'Beta', age: 8 }], activeId: 'new', gate: false,
      heard: { new: { base: '2026-09-01' } }, again: {},
      deletedChildren: { old: '2026-09-10T10:00:00.000Z' }, retiredChildReasons: { old: 'repaired' },
      firstNight: '2026-09-01', owner: 'acct', updatedAt: '2026-09-10T10:00:00.000Z'
    };
    const oldTab = {
      v: 1, children: [{ id: 'old', name: 'Beta', age: 8 }], activeId: 'old', gate: false,
      heard: { old: { base: '2026-09-01', late: '2026-09-11' } }, again: {},
      firstNight: '2026-09-01', owner: 'acct', updatedAt: '2026-09-11T20:00:00.000Z'
    };
    const out = reconcileStored(current, oldTab);
    expect(out.heard.old).toBeUndefined();
    expect(out.quarantinedHistory.old.heard.late).toBe('2026-09-11');
  });
});
