import { describe, it, expect } from 'vitest';
import { emptyProfile, newChild, markHeard, heardOf, againOf, merge } from './profile';

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
