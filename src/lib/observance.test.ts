import { describe, expect, it } from 'vitest';
import { observanceLabel, observancesForDate, type RuntimeObservanceCatalog } from './observance';

const catalog: RuntimeObservanceCatalog = {
  schemaVersion: '1.0',
  meta: {
    generated: 'test',
    sourceObservances: 1,
    agreedDateInstances: 1,
    excludedDateDisagreements: 0,
    runtimeStoryMappings: 0
  },
  dates: {
    '2026-09-19': [{
      id: 'radha-ashtami',
      names: { en: 'Radha Ashtami' },
      kind: 'jayanti',
      scope: { breadth: 'broad', traditions: ['vaishnava'], regions: ['north-india'] },
      importance: { tier: 'major', score: 80 },
      source: { authority: 'Calendar', url: 'https://example.test', citation: 'Test' },
      stories: []
    }]
  }
};

describe('runtime observance lookup', () => {
  it('returns every cross-checked observance for the date without inventing a story', () => {
    const day = observancesForDate(catalog, '2026-09-19');
    expect(day.map(x => x.id)).toEqual(['radha-ashtami']);
    expect(day[0].stories).toEqual([]);
  });

  it('does not silently translate an observance name into a reviewed locale', () => {
    const o = observancesForDate(catalog, '2026-09-19')[0];
    expect(observanceLabel(o, 'en')).toBe('Radha Ashtami');
    expect(observanceLabel(o, 'hi-IN')).toBeNull();
    expect(observanceLabel(o, 'ta-IN')).toBeNull();
  });
});
