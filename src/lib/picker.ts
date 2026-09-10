import type { Card } from './types';
import type { Panchanga } from './panchanga';

export interface Pick { story: Card; reason: string; alternates: Card[] }
export interface Ctx {
  panchanga: Panchanga;
  childAge: number;
  heard: Record<string, string>;   // id -> yyyy-mm-dd last heard
  /** id -> yyyy-mm-dd a story was asked for again. A favourite comes back sooner. */
  favourites?: Record<string, string>;
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
  // A story heard recently does not come round again — except one the child has
  // already asked for a second time. Repetition is the point of bedtime reading,
  // and a favourite waits a month rather than a season.
  const favourite = !!ctx.favourites?.[c.id];
  if (last && daysSince(last, p.date) < (favourite ? 30 : 90)) return null;

  let s = (c.calendar.weight ?? 5);
  let reason = '';

  // A lunar month has two names. The dark fortnight that ends Ashvina in the
  // amānta reckoning is the dark fortnight of Kārtika in the pūrṇimānta one,
  // and the festival names everybody uses are pūrṇimānta — Naraka Chaturdaśī
  // is "Kārtika kṛṣṇa chaturdaśī" on a day this table calls Ashvina. Matching
  // only `masa` meant a story keyed to Kārtika never matched its own night.
  const monthHit = c.calendar.months?.find(m => m === p.masa || m === p.masaN) ?? null;
  const title = (m: string) => m[0].toUpperCase() + m.slice(1);

  if (!p.approximate && c.calendar.festivals?.some(f => p.festivals.includes(f))) {
    s += 100; reason = `it is ${c.calendar.festivals.find(f => p.festivals.includes(f))!.replace(/-/g, ' ')}`;
  } else if (!p.approximate && c.calendar.tithi?.includes(p.tithi)
             && (!c.calendar.months?.length || monthHit)) {
    // A tithi ALONE recurs every month: there is a kṛṣṇa chaturdaśī twelve
    // times a year. When a story also names its month, the two are a
    // conjunction and not alternatives — otherwise the Naraka Chaturdaśī story
    // came up every single month, saying "tonight is krishna chaturdashi" on a
    // night that was nothing of the kind.
    s += 20;
    reason = monthHit ? `tonight is ${title(monthHit)} ${p.tithi.replace(/-/g, ' ')}`
                      : `tonight is ${p.tithi.replace(/-/g, ' ')}`;
  } else if (c.calendar.seasons?.includes(p.season)) {
    // Season survives the placeholder — a solar month tells you the monsoon is
    // ending even when it cannot tell you the tithi.
    s += 12;  reason = `of where we are in the year — ${p.season.replace(/-/g, ' ')}`;
  } else if (!p.approximate && monthHit) {
    s += 6;   reason = `it belongs to ${title(monthHit)}`;
  }

  // gently prefer a story pitched at the child rather than well under them
  s -= Math.max(0, ctx.childAge - c.minAge) * 0.4;
  if (last) s -= 3;
  if (favourite) { s += 8; if (!reason) reason = 'this is one that got asked for twice'; }
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
    reason: top.reason || 'nothing on the calendar claims tonight, so this is simply the one that fits',
    alternates: ranked.slice(1, 3).map(r => r.card)
  };
}
