import { describe, it, expect } from 'vitest';
import { emptyProfile, newChild, markHeard, heardOf, againOf, merge, tidy } from './profile';
import type { Profile } from './profile';

/** A profile with one child, ready to read to. */
function withChild() {
  const p = emptyProfile();
  const c = newChild('Rishi', 8);
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
    // The first night is what the constellation is dated by; it must not move.
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
});

/**
 * The wall of "Add a name". Reported from the live account on 2026-09-10:
 * nine children, eight of them nameless, no way to delete any of them.
 * Cause: every skipped setup mints a nameless child, and merge() folded two
 * lists against each other but never a list against itself.
 */
describe('the child list cleans itself up', () => {
  const blank = (age: number) => newChild('', age);

  it('collapses the reported screen to the one real child', () => {
    const kids = [blank(14), blank(13), blank(8), blank(8), newChild('Rishi', 8),
                  blank(8), blank(8), blank(8)];
    const p = { ...emptyProfile(), children: kids, activeId: kids[7].id };
    const out = tidy(p);
    expect(out.children.map(c => c.name)).toEqual(['Rishi']);
    // The active one was a blank that has just been removed; it must land
    // somewhere real rather than leaving the app with no child selected.
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

  it('folds a duplicate name and age in one list, keeping both histories', () => {
    const a = newChild('Rishi', 8), b = newChild('Rishi', 8);
    let p: Profile = { ...emptyProfile(), children: [a, b], activeId: b.id };
    p = markHeard(p, a.id, 'govardhana');
    p = markHeard(p, b.id, 'squirrel-setu');
    const out = tidy(p);
    expect(out.children).toHaveLength(1);
    const nights = heardOf(out, out.children[0].id);
    expect(Object.keys(nights).sort()).toEqual(['govardhana', 'squirrel-setu']);
  });

  it('leaves a healthy list exactly as it found it', () => {
    const a = newChild('Rishi', 8), b = newChild('Meera', 11);
    const p = { ...emptyProfile(), children: [a, b], activeId: b.id };
    const out = tidy(p);
    expect(out.children.map(c => c.name)).toEqual(['Rishi', 'Meera']);
    expect(out.activeId).toBe(b.id);
  });

  it('cleans up on the way back from the account, not just on this device', () => {
    // The blanks are already on the server. Signing in must not restore them.
    const rishi = newChild('Rishi', 8);
    const server = { ...emptyProfile(), children: [rishi, newChild('', 8), newChild('', 8)],
                     activeId: rishi.id, updatedAt: '2026-09-10T00:00:00.000Z' };
    const device = { ...emptyProfile(), children: [], activeId: null,
                     updatedAt: '2026-09-10T01:00:00.000Z' };
    expect(merge(device, server).children.map(c => c.name)).toEqual(['Rishi']);
  });
});
