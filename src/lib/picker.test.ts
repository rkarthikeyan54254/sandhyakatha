import { describe, it, expect } from 'vitest';
import { pickTonight } from './picker';
import type { Card } from './types';
import type { Panchanga } from './panchanga';

const card = (o: Partial<Card>): Card => ({
  id: 'x', title: 'X', tease: '', version: 1, corpus: 'bhagavata', tradition: 'sanskrit',
  work: '', locus: '', stability: 'stable', minAge: 5, sensitivity: [], gated: false,
  careNote: null, values: [], calendar: {}, characters: [], minutes: { full: 6 }, linked: null, ...o
});
const pan = (o: Partial<Panchanga> = {}): Panchanga => ({
  date: '2026-11-11', masa: 'kartika', paksha: 'shukla', tithi: 'shukla-pratipada',
  nakshatra: '', festivals: ['govardhan-puja'], season: 'harvest', approximate: false, ...o
});
const ctx = (o = {}) => ({ panchanga: pan(), childAge: 8, heard: {}, includeGated: false, ...o });

describe('the night picker', () => {
  it('lets a festival beat everything else', () => {
    const cards = [card({ id: 'plain', calendar: { weight: 10 } }),
                   card({ id: 'govardhana', calendar: { festivals: ['govardhan-puja'], weight: 1 } })];
    const p = pickTonight(cards, ctx())!;
    expect(p.story.id).toBe('govardhana');
    expect(p.reason).toContain('govardhan puja');
  });

  it('never surfaces a gated story unless the parent opted in', () => {
    const cards = [card({ id: 'hard', gated: true, calendar: { weight: 10 } })];
    expect(pickTonight(cards, ctx())).toBeNull();
    expect(pickTonight(cards, ctx({ includeGated: true }))!.story.id).toBe('hard');
  });

  it('never surfaces a story above the child\'s age', () => {
    expect(pickTonight([card({ minAge: 12 })], ctx({ childAge: 7 }))).toBeNull();
  });

  it('does not repeat a story heard inside the last season', () => {
    const cards = [card({ id: 'a' })];
    expect(pickTonight(cards, ctx({ heard: { a: '2026-10-20' } }))).toBeNull();
    expect(pickTonight(cards, ctx({ heard: { a: '2026-01-01' } }))!.story.id).toBe('a');
  });

  it('gives the same story all evening, and a different one tomorrow', () => {
    const cards = Array.from({ length: 20 }, (_, i) => card({ id: 's' + i }));
    const a = pickTonight(cards, ctx())!.story.id;
    const b = pickTonight(cards, ctx())!.story.id;
    expect(a).toBe(b);
    const t = pickTonight(cards, ctx({ panchanga: pan({ date: '2026-11-12', festivals: [] }) }))!.story.id;
    expect(t).not.toBe(a);
  });

  it('says plainly when nothing on the calendar claims the night', () => {
    const p = pickTonight([card({ id: 'a' })], ctx({ panchanga: pan({ festivals: [], season: 'winter' }) }))!;
    expect(p.reason).toContain('nothing on the calendar');
  });
});

describe('the placeholder calendar', () => {
  const approx = (o = {}): Panchanga => ({
    date: '2026-09-08', masa: 'bhadrapada', paksha: 'shukla', tithi: '', nakshatra: '',
    festivals: [], season: 'monsoon-end', approximate: true, ...o
  });
  const c = (o: Partial<Card>): Card => ({
    id: 'x', title: 'X', tease: '', version: 1, corpus: 'bhagavata', tradition: 'sanskrit',
    work: '', locus: '', stability: 'stable', minAge: 5, sensitivity: [], gated: false,
    careNote: null, values: [], calendar: {}, characters: [], minutes: { full: 6 }, linked: null, ...o
  });

  it('never names a Hindu month it only guessed', () => {
    const p = pickTonight([c({ calendar: { months: ['bhadrapada'] } })],
      { panchanga: approx(), childAge: 8, heard: {}, includeGated: false })!;
    expect(p.reason).not.toMatch(/Bhadrapada/i);
  });

  it('still uses the season, which a solar month does know', () => {
    const p = pickTonight([c({ calendar: { seasons: ['monsoon-end'] } })],
      { panchanga: approx(), childAge: 8, heard: {}, includeGated: false })!;
    expect(p.reason).toContain('monsoon end');
  });
});
