#!/usr/bin/env node
/** What to write next, and by when. Sorted by the next date each story's
 *  festival actually falls — pages want four weeks of clearance to be indexed. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const canon = read('content/canon.json').canon;
const cal = read('content/panchanga.json').days;
const today = new Date().toISOString().slice(0, 10);

const nextDate = f => Object.entries(cal)
  .filter(([d, v]) => d >= today && (v.festivals ?? []).includes(f))
  .map(([d]) => d).sort()[0];

const rows = canon
  .filter(c => !existsSync(join(ROOT, `content/stories/${c.id}.json`)))
  .map(c => {
    const dates = (c.festivals ?? []).map(nextDate).filter(Boolean).sort();
    return { ...c, due: dates[0] ?? null };
  })
  .filter(c => c.due)
  .sort((a, b) => a.due.localeCompare(b.due));

const days = d => Math.round((Date.parse(d) - Date.parse(today)) / 86400000);
console.log('\nUnwritten, with a date attached:\n');
for (const r of rows) {
  const d = days(r.due);
  const flag = d < 28 ? '  ← inside the four-week window' : '';
  console.log(`${r.due}  (+${String(d).padStart(3)}d)  ${r.id.padEnd(22)} ${r.festivals.join(', ')}${flag}`);
}
const thin = {};
for (const c of canon) { const b = c.minAge <= 6 ? '4-6' : c.minAge <= 9 ? '7-9' : c.minAge <= 12 ? '10-12' : '13-15'; thin[b] = (thin[b] ?? 0) + 1; }
console.log(`\nAge spread across the whole canon: ${Object.entries(thin).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
console.log(`Written: ${canon.filter(c => existsSync(join(ROOT, `content/stories/${c.id}.json`))).length} of ${canon.length}\n`);
