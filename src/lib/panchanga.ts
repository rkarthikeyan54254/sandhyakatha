/**
 * The Hindu calendar for a given date.
 *
 * Not computed here. `scripts/panchanga.py` runs Swiss Ephemeris offline and
 * ships a table — the same engine and the same conventions as NalNaal (Lahiri
 * ayanāṃśa, tithi sampled at 06:00 IST, Chennai, amānta months), on purpose:
 * two ephemerides in one house means two different Ekādaśīs, and the first
 * person to notice is a grandparent.
 *
 * Shipping a table rather than an ephemeris also means nothing is computed
 * while a parent waits, and it still works on a flight.
 */
export interface Panchanga {
  date: string;            // yyyy-mm-dd, local
  masa: string;            // amānta lunar month, e.g. 'shravana'
  masaN?: string;          // purṇimānta name, for festivals sourced up north
  paksha: 'shukla' | 'krishna';
  tithi: string;           // 'krishna-dvadashi'
  tithiN?: number;         // 1–15 within the fortnight
  nakshatra: string;
  festivals: string[];     // slugs matching calendar.festivals in the corpus
  season: string;
  tamil?: string;          // 'Avani'
  tamilDay?: number;
  skippedTithi?: boolean;  // this festival's tithi was a kṣaya tithi
  approximate: boolean;    // true only when the table does not cover the date
}

export interface PanchangaTable {
  meta: { engine: string; convention: string; from: string; to: string; caveat: string };
  days: Record<string, Omit<Panchanga, 'date' | 'approximate'>>;
}

const MASA = ['magha','phalguna','chaitra','vaishakha','jyeshtha','ashadha','shravana',
  'bhadrapada','ashvina','kartika','margashirsha','pausha'];
const SEASON: Record<string, string> = { ashadha:'monsoon-onset', shravana:'monsoon-onset',
  bhadrapada:'monsoon-end', ashvina:'harvest', kartika:'harvest', margashirsha:'winter',
  pausha:'winter', magha:'winter', phalguna:'spring', chaitra:'spring', vaishakha:'hot', jyeshtha:'hot' };

export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Look the date up. If the table has run out — it covers four years and wants
 * regenerating before then — fall back to a solar approximation that knows the
 * season and admits it knows nothing else. Everything downstream must treat
 * `approximate` as "do not print this".
 */
export function panchanga(d: Date, table?: PanchangaTable | null): Panchanga {
  const date = localDate(d);
  const row = table?.days?.[date];
  if (row) return { date, approximate: false, ...row };
  const masa = MASA[d.getMonth()];
  return {
    date, masa, paksha: d.getDate() <= 15 ? 'shukla' : 'krishna',
    tithi: '', nakshatra: '', festivals: [], season: SEASON[masa], approximate: true
  };
}

/** Title-cased for display: 'shukla-dvadashi' → 'Śukla Dvādaśī' is overkill; we
 *  print what the table holds, capitalised, and let the diacritics live in the
 *  lexicon where a parent can tap them. */
export const titleCase = (s: string) =>
  s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
