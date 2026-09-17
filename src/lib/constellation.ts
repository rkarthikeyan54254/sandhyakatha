import type { Card, Relations } from './types';

export interface ConstellationPoint {
  x: number;
  y: number;
  cluster: string;
}

export interface ConstellationDiscovery {
  a: string;
  b: string;
  label: string;
  clusterA: string;
  clusterB: string;
  unlockedOn: string;
}

export interface ConstellationState {
  storiesHeard: number;
  met: Set<string>;
  discoveries: ConstellationDiscovery[];
}

/**
 * Stable positions are part of the product: a child should find Hanumān where
 * he was last night. No force layout, no random seed, no movement between visits.
 */
export function constellationLayout(rel: Relations): Map<string, ConstellationPoint> {
  const names = Object.keys(rel.clusters);
  const pos = new Map<string, ConstellationPoint>();
  const cx = 350, cy = 265, R = 185;

  names.forEach((cluster, ci) => {
    const a = (ci / names.length) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(a) * R;
    const by = cy + Math.sin(a) * R * 0.82;
    const terms = rel.clusters[cluster];
    const r = 26 + terms.length * 4.6;

    terms.forEach((term, i) => {
      const b = (i / terms.length) * Math.PI * 2 + ci;
      pos.set(term, {
        x: bx + Math.cos(b) * r,
        y: by + Math.sin(b) * r * 0.78,
        cluster
      });
    });
  });

  return pos;
}

/**
 * Derive what has lit up from facts we already have.
 *
 * Trust boundary:
 * - a story counts only if it is still in the published card index;
 * - a "name lit" counts only if it exists in the curated relation map;
 * - a crossing is NEVER inferred from co-occurrence. It must be an explicitly
 *   labelled, curated edge whose endpoints live in different clusters;
 * - no extra child/profile state is written to create rewards.
 */
export function deriveConstellation(
  rel: Relations,
  cards: Card[],
  heard: Record<string, string>
): ConstellationState {
  const clusterOf = new Map<string, string>();
  for (const [cluster, terms] of Object.entries(rel.clusters))
    for (const term of terms) clusterOf.set(term, cluster);

  const heardCards = cards.filter(card => Boolean(heard[card.id]));
  const met = new Set<string>();
  const firstMet = new Map<string, string>();

  for (const card of heardCards) {
    const date = heard[card.id];
    for (const term of card.characters) {
      if (!clusterOf.has(term)) continue;
      met.add(term);
      const before = firstMet.get(term);
      if (!before || date < before) firstMet.set(term, date);
    }
  }

  const discoveries: ConstellationDiscovery[] = [];
  rel.edges.forEach(([a, b, rawLabel]) => {
    const label = rawLabel.trim();
    const clusterA = clusterOf.get(a);
    const clusterB = clusterOf.get(b);

    // Empty labels still draw as curated map edges, but we never invent reward
    // prose for them. Explainable discoveries must be explicit and cross-cluster.
    if (!label || !clusterA || !clusterB || clusterA === clusterB) return;
    if (!met.has(a) || !met.has(b)) return;

    const aAt = firstMet.get(a);
    const bAt = firstMet.get(b);
    if (!aAt || !bAt) return;

    discoveries.push({
      a, b, label, clusterA, clusterB,
      unlockedOn: aAt > bAt ? aAt : bAt
    });
  });

  // What changed most recently should be nearest the parent. The source edge
  // order remains the deterministic tiebreaker.
  discoveries.sort((x, y) => y.unlockedOn.localeCompare(x.unlockedOn));

  return { storiesHeard: heardCards.length, met, discoveries };
}

export function storiesForTerm(
  term: string,
  cards: Card[],
  heard: Record<string, string>
): Card[] {
  return cards.filter(card => Boolean(heard[card.id]) && card.characters.includes(term));
}
