import type { Card } from './types';
import type { Panchanga } from './panchanga';
import type { RuntimeObservance, RuntimeObservanceStory } from './observance';

export interface PickObservance {
  id: string;
  name: string;
  relevance: RuntimeObservanceStory['relevance'];
  source: RuntimeObservance['source'];
}

export interface Pick {
  story: Card;
  reason: string;
  alternates: Card[];
  observance?: PickObservance;
}

export interface Ctx {
  panchanga: Panchanga;
  childAge: number;
  heard: Record<string, string>;   // id -> yyyy-mm-dd last heard
  /** id -> yyyy-mm-dd a story was asked for again. A favourite comes back sooner. */
  favourites?: Record<string, string>;
  includeGated: boolean;
  allowRepeatFallback?: boolean;
  /** Cross-checked runtime observances for exactly this Panchanga date. */
  observances?: RuntimeObservance[];
}

/** Stable per (date, id) so the same night always yields the same story,
 *  on every device, with no server. Reload does not reroll the bedtime story. */
function jitter(date: string, id: string): number {
  let h = 2166136261;
  for (const ch of date + '|' + id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

const DAY = 86_400_000;
const daysSince = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

interface ObservanceMatch {
  observance: RuntimeObservance;
  mapping: RuntimeObservanceStory;
  score: number;
}

interface Scored {
  card: Card;
  score: number;
  reason: string;
  observance?: PickObservance;
}

const RELATION_BONUS: Record<RuntimeObservanceStory['relevance'], number> = {
  direct: 50,
  'strong-related': 30,
  related: 12
};

const BREADTH_BONUS: Record<RuntimeObservance['scope']['breadth'], number> = {
  'pan-india': 16,
  broad: 10,
  regional: 4,
  sampradaya: 2,
  'temple-specific': 0
};

function bestObservanceMatch(storyId: string, ctx: Ctx): ObservanceMatch | null {
  let best: ObservanceMatch | null = null;
  for (const observance of ctx.observances ?? []) {
    for (const mapping of observance.stories) {
      if (mapping.storyId !== storyId) continue;
      const score =
        observance.importance.score +
        RELATION_BONUS[mapping.relevance] +
        BREADTH_BONUS[observance.scope.breadth];
      if (!best || score > best.score)
        best = { observance, mapping, score };
    }
  }
  return best;
}

function observanceReason(hit: ObservanceMatch): string {
  const detail = hit.mapping.reason.trim().replace(/[.]+$/, '');
  return `Today is ${hit.observance.names.en}. ${detail}`;
}

function score(c: Card, ctx: Ctx, allowRecentRepeat = false): Scored | null {
  if (c.gated && !ctx.includeGated) return null;
  if (c.minAge > ctx.childAge) return null;

  const p = ctx.panchanga;
  const last = ctx.heard[c.id];
  // A story heard recently does not come round again — except one the child has
  // already asked for a second time. Repetition is the point of bedtime reading,
  // and a favourite waits a month rather than a season.
  const favourite = !!ctx.favourites?.[c.id];
  if (last && !allowRecentRepeat && daysSince(last, p.date) < (favourite ? 30 : 90)) return null;

  let s = (c.calendar.weight ?? 5);
  let reason = '';
  let matchedObservance: PickObservance | undefined;

  // Panchanga V2 wins when a cross-checked observance has an explicit,
  // runtime-allowlisted story relationship. A high base keeps a direct
  // observance match above legacy month/season hints while still allowing age,
  // repeat and deterministic tie-breaks to work exactly as before.
  const obsHit = !p.approximate ? bestObservanceMatch(c.id, ctx) : null;
  if (obsHit) {
    s += 140 + obsHit.score;
    reason = observanceReason(obsHit);
    matchedObservance = {
      id: obsHit.observance.id,
      name: obsHit.observance.names.en,
      relevance: obsHit.mapping.relevance,
      source: obsHit.observance.source
    };
  } else {
    // Legacy calendar metadata remains a compatibility fallback while the
    // independently researched observance corpus moves through runtime review.
    const monthHit = c.calendar.months?.find(m => m === p.masa || m === p.masaN) ?? null;
    const title = (m: string) => m[0].toUpperCase() + m.slice(1);

    if (!p.approximate && c.calendar.festivals?.some(f => p.festivals.includes(f))) {
      s += 100; reason = `it is ${c.calendar.festivals.find(f => p.festivals.includes(f))!.replace(/-/g, ' ')}`;
    } else if (!p.approximate && c.calendar.tithi?.includes(p.tithi)
               && (!c.calendar.months?.length || monthHit)) {
      // A tithi ALONE recurs every month. If a story names a month too, the
      // month and tithi are a conjunction, not alternatives.
      s += 20;
      reason = monthHit ? `tonight is ${title(monthHit)} ${p.tithi.replace(/-/g, ' ')}`
                        : `tonight is ${p.tithi.replace(/-/g, ' ')}`;
    } else if (c.calendar.seasons?.includes(p.season)) {
      s += 12; reason = `of where we are in the year — ${p.season.replace(/-/g, ' ')}`;
    } else if (!p.approximate && monthHit) {
      s += 6; reason = `it belongs to ${title(monthHit)}`;
    }
  }

  // gently prefer a story pitched at the child rather than well under them
  s -= Math.max(0, ctx.childAge - c.minAge) * 0.4;
  if (last) {
    s -= 3;
    if (allowRecentRepeat) s += Math.max(0, Math.min(90, daysSince(last, p.date))) * 0.08;
  }
  if (favourite) { s += 8; if (!reason) reason = 'this is one that got asked for twice'; }
  s += jitter(p.date, c.id) * 4;

  return { card: c, score: s, reason, observance: matchedObservance };
}

export function pickTonight(cards: Card[], ctx: Ctx): Pick | null {
  let ranked = cards.map(c => score(c, ctx)).filter((x): x is Scored => !!x)
                    .sort((a, b) => b.score - a.score);
  let repeated = false;

  if (!ranked.length && ctx.allowRepeatFallback) {
    ranked = cards.map(c => score(c, ctx, true)).filter((x): x is Scored => !!x)
                  .sort((a, b) => b.score - a.score);
    repeated = ranked.length > 0;
  }

  if (!ranked.length) return null;
  const top = ranked[0];
  return {
    story: top.card,
    reason: top.reason || (repeated
      ? 'this is the reviewed story you have gone longest without hearing'
      : 'nothing on the calendar claims tonight, so this is simply the one that fits'),
    alternates: ranked.slice(1, 3).map(r => r.card),
    ...(top.observance ? { observance: top.observance } : {})
  };
}
