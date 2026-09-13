import { describe, it, expect } from 'vitest';
import {emptyProfile, newChild, markHeard, heardOf, againOf, merge, tidy, removeChild, duplicateIdConflicts, repairDuplicateId, patchChildProfile, addChildToProfile} from './profile';
import type { Profile } from './profile';

function withChild() {
  const p = emptyProfile();
  const c = newChild('Beta', 8);
  return { p: { ...p, children: [c], activeId: c.id }, id: c.id };
}

describe('reading a story again', () => {
  it('keeps the first night and records the second separately', () => {
    const { p, id } = withChild();
    const once = markHeard(p, id, 'squirrel-setu');
    const first = heardOf(once, id)['squirrel-setu'];
    expect(first).toBeTruthy();
    expect(againOf(once, id)['squirrel-setu']).toBeUndefined();

    const twice = markHeard(once, id, 'squirrel-setu');
    expect(heardOf(twice, id)['squirrel-setu']).toBe(first);
    expect(againOf(twice, id)['squirrel-setu']).toBeTruthy();
  });

  it('does not count a different story as a re-read', () => {
    const { p, id } = withChild();
    const two = markHeard(markHeard(p, id, 'a'), id, 'b');
    expect(againOf(two, id)).toEqual({});
  });
});

describe('merging two devices', () => {
  it('unions re-reads and keeps the later night', () => {
    const { p, id } = withChild();
    const phone = { ...p, again: { [id]: { squirrel: '2026-09-01' } }, updatedAt: '2026-09-01T20:00:00.000Z' };
    const tablet = { ...p, again: { [id]: { squirrel: '2026-09-05', govardhana: '2026-09-04' } },
                     updatedAt: '2026-09-05T20:00:00.000Z' };
    const m = merge(phone, tablet);
    expect(againOf(m, id)).toEqual({ squirrel: '2026-09-05', govardhana: '2026-09-04' });
  });

  it('survives a profile written before re-reads existed', () => {
    const { p, id } = withChild();
    const old = { ...p, updatedAt: '2026-08-01T20:00:00.000Z' };
    delete (old as { again?: unknown }).again;
    const fresh = { ...p, again: { [id]: { squirrel: '2026-09-05' } }, updatedAt: '2026-09-05T20:00:00.000Z' };
    expect(againOf(merge(old, fresh), id)).toEqual({ squirrel: '2026-09-05' });
    expect(againOf(merge(fresh, old), id)).toEqual({ squirrel: '2026-09-05' });
  });

  it('uses the stable id before name+age when a child is renamed', () => {
    const child = { id: 'same-id', name: 'Beta', age: 8 };
    const server: Profile = { ...emptyProfile(), owner: 'acct', children: [child], activeId: child.id,
      heard: { [child.id]: { govardhana: '2026-09-01' } }, updatedAt: '2026-09-10T00:00:00.000Z' };
    const local: Profile = { ...server, children: [{ ...child, name: 'Gamma' }],
      updatedAt: '2026-09-11T00:00:00.000Z' };
    const out = merge(server, local);
    expect(out.children).toHaveLength(1);
    expect(out.children[0]).toMatchObject({ id: 'same-id', name: 'Gamma', age: 8 });
    expect(heardOf(out, 'same-id')).toEqual({ govardhana: '2026-09-01' });
  });

  it('uses the stable id before name+age when an age changes', () => {
    const child = { id: 'same-id', name: 'Beta', age: 8 };
    const server: Profile = { ...emptyProfile(), owner: 'acct', children: [child], activeId: child.id,
      updatedAt: '2026-09-10T00:00:00.000Z' };
    const local: Profile = { ...server, children: [{ ...child, age: 9 }],
      updatedAt: '2026-09-11T00:00:00.000Z' };
    const out = merge(server, local);
    expect(out.children).toEqual([{ id: 'same-id', name: 'Beta', age: 9 }]);
  });

  it('still folds one independently-created same-name+age child across two copies', () => {
    const serverChild = { id: 'server-id', name: 'Beta', age: 8 };
    const localChild = { id: 'local-id', name: 'Beta', age: 8 };
    const server: Profile = { ...emptyProfile(), owner: 'acct', children: [serverChild], activeId: serverChild.id,
      heard: { [serverChild.id]: { govardhana: '2026-09-01' } }, updatedAt: '2026-09-10T00:00:00.000Z' };
    const local: Profile = { ...emptyProfile(), owner: 'acct', children: [localChild], activeId: localChild.id,
      heard: { [localChild.id]: { 'squirrel-setu': '2026-09-11' } }, updatedAt: '2026-09-11T00:00:00.000Z' };
    const out = merge(server, local);
    expect(out.children).toHaveLength(1);
    expect(out.children[0].id).toBe('server-id');
    expect(Object.keys(heardOf(out, 'server-id')).sort()).toEqual(['govardhana', 'squirrel-setu']);
  });

  it('keeps the account id canonical even when the account copy is newer', () => {
    const localChild = { id: 'local-id', name: 'Beta', age: 8 };
    const serverChild = { id: 'server-id', name: 'Beta', age: 8 };
    const local: Profile = { ...emptyProfile(), owner: 'acct', children: [localChild], activeId: localChild.id,
      heard: { [localChild.id]: { local: '2026-09-01' } }, updatedAt: '2026-09-10T00:00:00.000Z' };
    const server: Profile = { ...emptyProfile(), owner: 'acct', children: [serverChild], activeId: serverChild.id,
      heard: { [serverChild.id]: { server: '2026-09-11' } }, updatedAt: '2026-09-11T00:00:00.000Z' };
    const out = merge(local, server, { canonicalIdsFrom: 'b' });
    expect(out.children).toEqual([{ id: 'server-id', name: 'Beta', age: 8 }]);
    expect(Object.keys(heardOf(out, 'server-id')).sort()).toEqual(['local', 'server']);
    expect(out.heard['local-id']).toBeUndefined();
  });

  it('does not guess when name+age is ambiguous on either side', () => {
    const a = { id: 'a', name: 'Sam', age: 8 };
    const b = { id: 'b', name: 'Sam', age: 8 };
    const c = { id: 'c', name: 'Sam', age: 8 };
    const server: Profile = { ...emptyProfile(), owner: 'acct', children: [a, b], activeId: a.id,
      updatedAt: '2026-09-10T00:00:00.000Z' };
    const local: Profile = { ...emptyProfile(), owner: 'acct', children: [c], activeId: c.id,
      updatedAt: '2026-09-11T00:00:00.000Z' };
    const out = merge(server, local);
    expect(out.children.map(x => x.id).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('the child list cleans itself without guessing identity', () => {
  const blank = (age: number) => newChild('', age);

  it('collapses the reported blank-row screen to the one real child', () => {
    const kids = [blank(14), blank(13), blank(8), blank(8), newChild('Beta', 8),
                  blank(8), blank(8), blank(8)];
    const p = { ...emptyProfile(), children: kids, activeId: kids[7].id };
    const out = tidy(p);
    expect(out.children.map(c => c.name)).toEqual(['Beta']);
    expect(out.activeId).toBe(out.children[0].id);
  });

  it('never drops a nameless child who has actually heard something', () => {
    const anon = blank(8);
    let p: Profile = { ...emptyProfile(), children: [anon, blank(8), blank(8)], activeId: anon.id };
    p = markHeard(p, anon.id, 'govardhana');
    const out = tidy(p);
    expect(out.children).toHaveLength(1);
    expect(out.children[0].id).toBe(anon.id);
    expect(heardOf(out, anon.id)['govardhana']).toBeTruthy();
  });

  it('keeps one blank when there is nothing else, so skipping setup still works', () => {
    const kids = [blank(8), blank(8), blank(8)];
    const out = tidy({ ...emptyProfile(), children: kids, activeId: kids[0].id });
    expect(out.children).toHaveLength(1);
    expect(out.activeId).toBe(out.children[0].id);
  });

  it('preserves a conflicting duplicate id instead of guessing which child owns the history', () => {
    const p: Profile = { ...emptyProfile(),
      children: [
        { id: 'same', name: 'Gamma', age: 9 },
        { id: 'same', name: 'Delta', age: 13 }
      ],
      activeId: 'same',
      heard: { same: { govardhana: '2026-09-01' } }
    };
    const out = tidy(p);
    expect(out.children).toHaveLength(2);
    expect(duplicateIdConflicts(out)).toHaveLength(1);
    expect(out.heard.same).toEqual({ govardhana: '2026-09-01' });
  });

  it('repairs a conflicting duplicate id only after the parent chooses the history owner', () => {
    const p: Profile = { ...emptyProfile(),
      children: [
        { id: 'same', name: 'Gamma', age: 9 },
        { id: 'same', name: 'Delta', age: 13 }
      ],
      activeId: 'same',
      heard: { same: { govardhana: '2026-09-01' } },
      again: { same: { govardhana: '2026-09-08' } }
    };
    const out = repairDuplicateId(p, 'same', 0);
    expect(out.children).toHaveLength(2);
    expect(new Set(out.children.map(c => c.id)).size).toBe(2);
    expect(out.children.map(c => c.name)).toEqual(['Gamma', 'Delta']);
    expect(out.deletedChildren?.same).toBeTruthy();
    const beta = out.children.find(c => c.name === 'Gamma')!;
    const delta = out.children.find(c => c.name === 'Delta')!;
    expect(out.heard[beta.id]).toEqual({ govardhana: '2026-09-01' });
    expect(out.again?.[beta.id]).toEqual({ govardhana: '2026-09-08' });
    expect(out.heard[delta.id]).toBeUndefined();
    expect(out.heard.same).toBeUndefined();
    expect(duplicateIdConflicts(out)).toEqual([]);
  });

  it('still collapses exact duplicate rows with the same id and metadata', () => {
    const p: Profile = { ...emptyProfile(),
      children: [
        { id: 'same', name: 'Beta', age: 8 },
        { id: 'same', name: 'Beta', age: 8 }
      ],
      activeId: 'same', heard: { same: { govardhana: '2026-09-01' } }
    };
    const out = tidy(p);
    expect(out.children).toEqual([{ id: 'same', name: 'Beta', age: 8 }]);
    expect(out.heard.same).toEqual({ govardhana: '2026-09-01' });
  });

  it('does not collapse different ids merely because name+age matches', () => {
    const a = newChild('Sam', 8), b = newChild('Sam', 8);
    let p: Profile = { ...emptyProfile(), children: [a, b], activeId: b.id };
    p = markHeard(p, a.id, 'govardhana');
    p = markHeard(p, b.id, 'squirrel-setu');
    const out = tidy(p);
    expect(out.children).toHaveLength(2);
    expect(Object.keys(out.heard).sort()).toEqual([a.id, b.id].sort());
  });


  it('reads a pre-tombstone profile without migration loss', () => {
    const child = newChild('Beta', 8);
    const old: Profile = { ...emptyProfile(), children: [child], activeId: child.id,
      heard: { [child.id]: { govardhana: '2026-09-01' } } };
    delete (old as { deletedChildren?: unknown }).deletedChildren;
    const out = tidy(old);
    expect(out.children).toEqual([child]);
    expect(out.heard[child.id]).toEqual({ govardhana: '2026-09-01' });
    expect(out.deletedChildren).toEqual({});
  });
  it('leaves a healthy list exactly as it found it', () => {
    const a = newChild('Beta', 8), b = newChild('Epsilon', 11);
    const p = { ...emptyProfile(), children: [a, b], activeId: b.id };
    const out = tidy(p);
    expect(out.children).toEqual(p.children);
    expect(out.activeId).toBe(b.id);
  });
});

describe('deletion is durable intent', () => {
  it('removes the child and its history and records a tombstone', () => {
    const a = newChild('Beta', 8), b = newChild('Epsilon', 11);
    let p: Profile = { ...emptyProfile(), children: [a, b], activeId: a.id };
    p = markHeard(p, a.id, 'govardhana');
    p = markHeard(p, b.id, 'squirrel-setu');
    const out = removeChild(p, a.id);
    expect(out.children.map(c => c.id)).toEqual([b.id]);
    expect(out.heard[a.id]).toBeUndefined();
    expect(out.heard[b.id]).toBeTruthy();
    expect(out.deletedChildren?.[a.id]).toBeTruthy();
  });

  it('does not let a stale copy with the same canonical id resurrect a deletion', () => {
    const child = { id: 'same-id', name: 'Beta', age: 8 };
    const stale: Profile = { ...emptyProfile(), owner: 'acct', children: [child], activeId: child.id,
      heard: { [child.id]: { govardhana: '2026-09-01' } }, updatedAt: '2026-09-10T00:00:00.000Z' };
    const deleted: Profile = { ...emptyProfile(), owner: 'acct', deletedChildren: { [child.id]: '2026-09-13T00:00:00.000Z' },
      updatedAt: '2026-09-13T00:00:00.000Z' };
    const out = merge(stale, deleted);
    expect(out.children).toEqual([]);
    expect(out.heard[child.id]).toBeUndefined();
    expect(out.deletedChildren?.[child.id]).toBe('2026-09-13T00:00:00.000Z');
  });
});

describe('field-specific setting clocks', () => {
  it('advances a child metadata clock even when wall-clock time has not moved', () => {
    const child = { id: 'child', name: 'Alpha', age: 8 };
    const future = '2099-01-01T00:00:00.000Z';
    const base: Profile = tidy({ ...emptyProfile(), children: [child], activeId: child.id,
      childUpdatedAt: { child: future }, updatedAt: future });
    const out = patchChildProfile(base, child.id, { name: 'Beta' });
    expect(Date.parse(out.childUpdatedAt!.child)).toBeGreaterThan(Date.parse(future));
    expect(out.children[0].name).toBe('Beta');
  });

  it('does not let a later story read roll back a newer rename, age or gate setting', () => {
    const child = { id: 'child', name: 'Beta', age: 8 };
    const staleBase: Profile = tidy({ ...emptyProfile(), owner: 'acct', children: [child], activeId: child.id,
      gate: false, updatedAt: '2026-09-10T09:00:00.000Z' });
    const server: Profile = tidy({ ...staleBase,
      children: [{ ...child, name: 'Gamma', age: 9 }], gate: true,
      childUpdatedAt: { child: '2026-09-10T10:00:00.000Z' },
      gateUpdatedAt: '2026-09-10T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z' });

    const staleAfterReading = markHeard(staleBase, child.id, 'squirrel-setu');
    // Simulate the read happening after the settings edit. markHeard may move
    // updatedAt, but must not move the metadata/gate clocks materialized by tidy().
    staleAfterReading.updatedAt = '2026-09-10T10:05:00.000Z';
    const out = merge(staleAfterReading, server, { canonicalIdsFrom: 'b' });
    expect(out.children).toEqual([{ id: 'child', name: 'Gamma', age: 9 }]);
    expect(out.gate).toBe(true);
    expect(out.heard.child['squirrel-setu']).toBeTruthy();
  });

  it('materializes legacy setting clocks once so later reads cannot impersonate edits', () => {
    const child = { id: 'child', name: 'Beta', age: 8 };
    const legacy: Profile = { ...emptyProfile(), children: [child], activeId: child.id,
      updatedAt: '2026-09-10T09:00:00.000Z' };
    delete legacy.childUpdatedAt; delete legacy.gateUpdatedAt; delete legacy.activeUpdatedAt;
    const loaded = tidy(legacy);
    const after = markHeard(loaded, child.id, 'govardhana');
    expect(after.childUpdatedAt?.child).toBe('2026-09-10T09:00:00.000Z');
    expect(after.gateUpdatedAt).toBe('2026-09-10T09:00:00.000Z');
  });

  it('quarantines stale history that arrives under an id retired by identity repair', () => {
    const current: Profile = tidy({ ...emptyProfile(), owner: 'acct', children: [{ id: 'new', name: 'Beta', age: 8 }],
      activeId: 'new', heard: { new: { old: '2026-09-01' } },
      deletedChildren: { oldid: '2026-09-10T10:00:00.000Z' }, retiredChildReasons: { oldid: 'repaired' },
      updatedAt: '2026-09-10T10:00:00.000Z' });
    const stale: Profile = { ...emptyProfile(), owner: 'acct', children: [{ id: 'oldid', name: 'Beta', age: 8 }],
      activeId: 'oldid', heard: { oldid: { old: '2026-09-01', later: '2026-09-11' } },
      updatedAt: '2026-09-11T20:00:00.000Z' };
    const out = merge(stale, current, { canonicalIdsFrom: 'b' });
    expect(out.heard.oldid).toBeUndefined();
    expect(out.quarantinedHistory?.oldid.heard).toEqual({ old: '2026-09-01', later: '2026-09-11' });
  });
});


describe('intentional child placeholder', () => {
  it('keeps one newly-added blank row beside an existing named child', () => {
    const existing = newChild('Alpha', 8);
    const base: Profile = tidy({ ...emptyProfile(), children: [existing], activeId: existing.id });
    const added = addChildToProfile(base, '', 8);
    expect(added.children).toHaveLength(2);
    const draft = added.children.find(c => !c.name.trim());
    expect(draft).toBeTruthy();
    expect(added.activeId).toBe(draft!.id);
    expect(added.childUpdatedAt?.[draft!.id]).toBeTruthy();

    // Server/load normalization must not immediately erase the editing row.
    const normalized = tidy(added);
    expect(normalized.children).toHaveLength(2);
    expect(normalized.children.some(c => c.id === draft!.id)).toBe(true);
  });
});
