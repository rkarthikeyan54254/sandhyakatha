import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { panchanga, type PanchangaTable } from './panchanga';
import { pickTonight } from './picker';
import type { Card } from './types';

const table = JSON.parse(readFileSync('content/panchanga.json', 'utf8')) as PanchangaTable;
const index = JSON.parse(readFileSync('public/data/index.json', 'utf8')) as { stories: Card[] };

describe('the pañcāṅga table', () => {
  it('covers today', () => {
    expect(panchanga(new Date(), table).approximate).toBe(false);
  });

  it('agrees with NalNaal on a known date', () => {
    // 8 September 2026, Chennai: Śrāvaṇa, kṛṣṇa pakṣa, Dvādaśī.
    const p = panchanga(new Date('2026-09-08T12:00:00'), table);
    expect(p.masa).toBe('shravana');
    expect(p.paksha).toBe('krishna');
    expect(p.tithi).toBe('krishna-dvadashi');
  });

  it('finds every festival in every year it covers', () => {
    const years = new Set(Object.keys(table.days).map(d => d.slice(0, 4)));
    for (const f of ['govardhan-puja', 'janmashtami', 'ganesh-chaturthi', 'mahashivaratri', 'holi']) {
      const found = new Set(Object.entries(table.days)
        .filter(([, d]) => d.festivals.includes(f)).map(([k]) => k.slice(0, 4)));
      expect([...years].filter(y => !found.has(y)), `${f} missing from`).toEqual([]);
    }
  });

  it('hands the right story to the right night', () => {
    // Govardhan Pūjā 2026. The checked override places the observance on Nov 9.
    // Annakut is an alias for the same observance and must move with it.
    const p = panchanga(new Date('2026-11-09T20:00:00'), table);
    expect(p.festivals).toContain('govardhan-puja');
    expect(p.festivals).toContain('annakut');

    const next = panchanga(new Date('2026-11-10T20:00:00'), table);
    expect(next.festivals).not.toContain('govardhan-puja');
    expect(next.festivals).not.toContain('annakut');

    const pick = pickTonight(index.stories, { panchanga: p, childAge: 8, heard: {}, includeGated: false });
    expect(pick?.story.id).toBe('govardhana');
    expect(pick?.reason).toContain('govardhan puja');
  });

  it('says nothing it cannot know once the table runs out', () => {
    const p = panchanga(new Date('2099-01-01T12:00:00'), table);
    expect(p.approximate).toBe(true);
    expect(p.tithi).toBe('');
    expect(p.festivals).toEqual([]);
  });
});
