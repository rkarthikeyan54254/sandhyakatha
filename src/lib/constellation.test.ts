import { describe, expect, it } from 'vitest';
import { deriveConstellation } from './constellation';
import type { Card, Relations } from './types';

const rel: Relations = {
  clusters: {
    EpicA: ['A', 'Place'],
    EpicB: ['B', 'C']
  },
  edges: [
    ['A', 'B', 'siblings'],
    ['A', 'Place', 'visited it'],
    ['A', 'C', ''],
    ['Place', 'B', 'remembered there']
  ]
};

function card(id: string, characters: string[]): Card {
  return {
    id, title: id, tease: '', version: 1, storyRevision: 'r1',
    corpus: 'ramayana', tradition: 'sanskrit', work: '', locus: '',
    stability: 'stable', minAge: 4, sensitivity: [], gated: false,
    careNote: null, values: [], calendar: {}, characters, minutes: { full: 6 },
    linked: null
  };
}

describe('deriveConstellation', () => {
  it('counts only published-card history and names represented on the map', () => {
    const state = deriveConstellation(
      rel,
      [card('one', ['A', 'Outside']), card('two', ['B'])],
      { one: '2026-09-10', two: '2026-09-12', retired: '2020-01-01' }
    );

    expect(state.storiesHeard).toBe(2);
    expect([...state.met].sort()).toEqual(['A', 'B']);
  });

  it('rewards only labelled curated edges that actually cross clusters', () => {
    const state = deriveConstellation(
      rel,
      [card('one', ['A', 'Place']), card('two', ['B', 'C'])],
      { one: '2026-09-10', two: '2026-09-12' }
    );

    expect(state.discoveries.map(d => [d.a, d.b, d.label])).toEqual([
      ['A', 'B', 'siblings'],
      ['Place', 'B', 'remembered there']
    ]);
    expect(state.discoveries.every(d => d.clusterA !== d.clusterB)).toBe(true);
  });

  it('sorts newly-unlocked crossings first without persisting reward state', () => {
    const state = deriveConstellation(
      rel,
      [card('a', ['A']), card('place', ['Place']), card('b', ['B'])],
      { a: '2026-09-01', place: '2026-09-15', b: '2026-09-10' }
    );

    expect(state.discoveries.map(d => `${d.a}-${d.b}`)).toEqual([
      'Place-B',
      'A-B'
    ]);
    expect(state.discoveries.map(d => d.unlockedOn)).toEqual([
      '2026-09-15',
      '2026-09-10'
    ]);
  });
});
