import type { Card } from './types';
import type { Panchanga } from './panchanga';

export interface Pick { story: Card; reason: string; alternates: Card[] }
export interface Ctx {
  panchanga: Panchanga;
  childAge: number;
  heard: Record<string, string>;   // id -> yyyy-mm-dd last heard
  includeGated: boolean;
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

interface Scored { card: Card; score: number; reason: string }

function score(c: Card, ctx: Ctx): Scored | null {
  if (c.gated && !ctx.includeGated) return null;
  if (c.minAge > ctx.childAge) return null;

  const p = ctx.panchanga;
  const last = ctx.heard[c.id];
  if (last && daysSince(last, p.date) < 90) return null;   // don't repeat within a season

  let s = (c.calendar.weight ?? 5);
  let reason = '';

  if (!p.approximate && c.calendar.festivals?.some(f => p.festivals.includes(f))) {
    s += 100; reason = `it is ${c.calendar.festivals.find(f => p.festivals.includes(f))!.replace(/-/g, ' ')}`;
  } else if (!p.approximate && c.calendar.tithi?.includes(p.tithi)) {
    s += 20;  reason = `tonight is ${p.tithi.replace(/-/g, ' ')}`;
  } else if (c.calendar.seasons?.includes(p.season)) {
    s += 12;  reason = `of where we are in the year — ${p.season.replace(/-/g, ' ')}`;
  } else if (c.calendar.months?.includes(p.masa)) {
    s += 6;   reason = `it belongs to ${p.masa[0].toUpperCase() + p.masa.slice(1)}`;
  }

  // gently prefer a story pitched at the child rather than well under them
  s -= Math.max(0, ctx.childAge - c.minAge) * 0.4;
  if (last) s -= 3;
  s += jitter(p.date, c.id) * 4;

  return { card: c, score: s, reason };
}

export function pickTonight(cards: Card[], ctx: Ctx): Pick | null {
  const ranked = cards.map(c => score(c, ctx)).filter((x): x is Scored => !!x)
                      .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;
  const top = ranked[0];
  return {
    story: top.card,
    reason: top.reason || 'nothing on the calendar claims tonight, so this is simply the one that fits her',
    alternates: ranked.slice(1, 3).map(r => r.card)
  };
}
