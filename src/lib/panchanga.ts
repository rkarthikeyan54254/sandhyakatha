/**
 * The Hindu calendar for a given date and place.
 *
 * NOT IMPLEMENTED. This is the interface only, so the story picker can be
 * written, tested and reviewed before the ephemeris is wired in.
 *
 * Wire this to the same ephemeris NalNaal already uses rather than a second
 * one — two ephemerides in one house means two different Ekādaśīs, and the
 * first person to notice will be a grandparent.
 */
export interface Panchanga {
  date: string;            // yyyy-mm-dd, local
  masa: string;            // 'bhadrapada'
  paksha: 'shukla' | 'krishna';
  tithi: string;           // 'shukla-ekadashi'
  nakshatra: string;
  festivals: string[];     // slugs, matching calendar.festivals in the corpus
  season: string;          // 'monsoon-end'
  approximate: boolean;    // true while this is the placeholder
}

const MASA = ['magha','phalguna','chaitra','vaishakha','jyeshtha','ashadha','shravana','bhadrapada','ashvina','kartika','margashirsha','pausha'];
const SEASON: Record<string,string> = { ashadha:'monsoon-onset', shravana:'monsoon-onset', bhadrapada:'monsoon-end', ashvina:'harvest', kartika:'harvest', margashirsha:'winter', pausha:'winter', magha:'winter', phalguna:'spring', chaitra:'spring', vaishakha:'hot', jyeshtha:'hot' };

/** Placeholder: solar-month approximation, no tithi, no festivals.
 *  Everything downstream must treat `approximate: true` as "do not print this". */
export function panchanga(d: Date): Panchanga {
  const masa = MASA[d.getMonth()];
  return {
    date: d.toISOString().slice(0, 10),
    masa, paksha: d.getDate() <= 15 ? 'shukla' : 'krishna',
    tithi: '', nakshatra: '', festivals: [],
    season: SEASON[masa], approximate: true
  };
}
