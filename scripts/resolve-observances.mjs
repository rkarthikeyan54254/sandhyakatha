#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const obsDir = join(ROOT, 'content/observances');
const observations = readdirSync(obsDir)
  .filter(f => f.endsWith('.json') && !f.startsWith('_'))
  .map(f => read(`content/observances/${f}`));
const table = read('content/panchanga.json');
const verification = existsSync(join(ROOT, 'content/observance-date-verification.json'))
  ? read('content/observance-date-verification.json').checks ?? {}
  : {};

const YEARS = ['2026','2027','2028','2029'];
const DAY = 86400000;
const dayRows = Object.entries(table.days ?? {}).filter(([d]) => YEARS.includes(d.slice(0,4)));
const byDate = new Map(dayRows);

const tithiNum = new Map([
  ['pratipada',1],['dvitiya',2],['tritiya',3],['chaturthi',4],['panchami',5],
  ['shashthi',6],['saptami',7],['ashtami',8],['navami',9],['dashami',10],
  ['ekadashi',11],['dvadashi',12],['trayodashi',13],['chaturdashi',14],
  ['purnima',15],['amavasya',15]
]);
const starAlias = new Map(Object.entries({
  krithigai:'krittika', thiruvathirai:'ardra', punarpoosam:'punarvasu',
  poosam:'pushya', aayilyam:'ashlesha', magam:'magha', pooram:'purva-phalguni',
  uttiram:'uttara-phalguni', astham:'hasta', chithirai:'chitra', swathi:'swati',
  visakam:'vishakha', anusham:'anuradha', kettai:'jyeshtha', moolam:'mula',
  pooradam:'purva-ashadha', uttiradam:'uttara-ashadha', thiruvonam:'shravana',
  avittam:'dhanishtha', sadhayam:'shatabhisha', poorattathi:'purva-bhadrapada',
  uttirattathi:'uttara-bhadrapada', revathi:'revati'
}));
const normStar = s => starAlias.get(String(s ?? '').toLowerCase()) ?? String(s ?? '').toLowerCase();
const tithiName = row => String(row.tithi ?? '').replace(/^(shukla|krishna)-/, '');
const datePlus = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0,10);

const solarMonthToTamil = {
  tamil: {
    chithirai:'chithirai',vaikasi:'vaikasi',aani:'aani',aadi:'aadi',avani:'avani',
    purattasi:'purattasi',aippasi:'aippasi',karthigai:'karthigai',margazhi:'margazhi',
    thai:'thai',masi:'masi',panguni:'panguni'
  },
  malayalam: {
    medam:'chithirai',edavam:'vaikasi',mithunam:'aani',karkidakam:'aadi',
    chingam:'avani',kanni:'purattasi',thulam:'aippasi',vrischikam:'karthigai',
    dhanu:'margazhi',makaram:'thai',kumbham:'masi',meenam:'panguni'
  },
  bengali: {
    boishakh:'chithirai',joishtho:'vaikasi',asharh:'aani',srabon:'aadi',
    bhadro:'avani',ashwin:'purattasi',kartika:'aippasi',agrohayon:'karthigai',
    poush:'margazhi',magh:'thai',falgun:'masi',choitro:'panguni'
  },
  odia: {
    baisakha:'chithirai',jyestha:'vaikasi',ashadha:'aani',shravana:'aadi',
    bhadraba:'avani',ashwina:'purattasi',kartika:'aippasi',margashira:'karthigai',
    pausha:'margazhi',magha:'thai',phalguna:'masi',chaitra:'panguni'
  },
  assamese: {
    bohag:'chithirai',jeth:'vaikasi',ahar:'aani',saon:'aadi',bhado:'avani',
    ahin:'purattasi',kati:'aippasi',aghon:'karthigai',puh:'margazhi',
    magh:'thai',phagun:'masi',chot:'panguni'
  },
  'sidereal-solar': {
    mesha:'chithirai',vrishabha:'vaikasi',mithuna:'aani',karka:'aadi',
    simha:'avani',kanya:'purattasi',tula:'aippasi',vrischika:'karthigai',
    dhanu:'margazhi',makara:'thai',kumbha:'masi',meena:'panguni'
  }
};
const solarMonthMatches = (row, rule) => {
  const target = solarMonthToTamil[rule.solarCalendar]?.[rule.solarMonth];
  return !!target && String(row.tamil ?? '').toLowerCase() === target;
};


const eligible = (row, rule) => !(rule.adhikaPolicy === 'skip' && row.adhika === true);
const monthMatches = (row, rule) => {
  if (!eligible(row, rule)) return false;
  if (rule.monthSystem === 'purnimanta') return row.masaN === rule.month;
  if (rule.monthSystem === 'sourced-variant') return row.masa === rule.month || row.masaN === rule.month;
  return row.masa === rule.month;
};

function exactLunarCandidates(rule) {
  return dayRows
    .filter(([, d]) => monthMatches(d, rule) && d.paksha === rule.paksha && tithiName(d) === rule.tithi)
    .map(([date]) => ({year:date.slice(0,4), date, basis:'06:00-snapshot'}));
}

function kshayaCandidateForYear(rule, year) {
  const target = tithiNum.get(rule.tithi);
  if (!target) return null;
  for (const [date, row] of dayRows.filter(([d]) => d.startsWith(year))) {
    if (!monthMatches(row, rule) || row.paksha !== rule.paksha || (row.tithiN ?? 0) <= target) continue;
    const prevDate = datePlus(date, -1);
    const prev = byDate.get(prevDate);
    if (!prev) continue;
    const prevSame = monthMatches(prev, rule) && prev.paksha === rule.paksha;
    const jumpedOver = prevSame && (prev.tithiN ?? 0) < target;
    const skippedPratipada = !prevSame && target === 1;
    if (jumpedOver || skippedPratipada) {
      return {year, date:prevDate, basis:'kshaya-tithi-candidate'};
    }
  }
  return null;
}

function lunarCandidates(rule) {
  const exact = exactLunarCandidates(rule);
  const out = [];
  for (const year of YEARS) {
    const y = exact.filter(x => x.year === year);
    if (y.length) out.push(...y);
    else {
      const repair = kshayaCandidateForYear(rule, year);
      if (repair) out.push(repair);
    }
  }
  return out;
}

function resolveOne(o, resolvedById) {
  const r = o.rule;
  let dates = [];
  let caveat = null;

  if (r.type === 'yearly-explicit') {
    dates = Object.entries(r.datesByYear ?? {}).map(([year,date]) => ({year,date,basis:'explicit-sourced-date'}));
  } else if (r.type === 'lunar-tithi') {
    dates = lunarCandidates(r);
    if (!['full-day','sunrise','sunrise-prevailing'].includes(r.decisionWindow)) {
      caveat = `${r.decisionWindow} decision window is not fully resolved by the 06:00 daily snapshot`;
    }
  } else if (r.type === 'recurring-tithi') {
    dates = dayRows
      .filter(([,d]) => eligible(d,r) && d.paksha === r.paksha && tithiName(d) === r.tithi)
      .map(([date]) => ({year:date.slice(0,4),date,basis:'06:00-snapshot'}));
  } else if (r.type === 'solar-nakshatra') {
    if (solarMonthToTamil[r.solarCalendar]) {
      dates = dayRows
        .filter(([,d]) => solarMonthMatches(d,r) && normStar(d.nakshatra) === r.nakshatra)
        .map(([date]) => ({year:date.slice(0,4),date,basis:'06:00-sidereal-solar-star'}));
      caveat = `${r.solarCalendar} solar-star candidate uses the shared sidereal solar month and 06:00 nakshatra snapshot; regional day-boundary rules still require source verification`;
    } else {
      caveat = `${r.solarCalendar} solar calendar is not bridged by the research resolver`;
    }
  } else if (r.type === 'solar-day') {
    if (solarMonthToTamil[r.solarCalendar]) {
      dates = dayRows
        .filter(([,d]) => solarMonthMatches(d,r) && d.tamilDay === r.solarDay)
        .map(([date]) => ({year:date.slice(0,4),date,basis:'sidereal-solar-day'}));
      if (r.solarCalendar !== 'tamil')
        caveat = `${r.solarCalendar} solar-day candidate is bridged through the shared sidereal solar month; regional civil-day assignment still requires source verification`;
    } else {
      caveat = `${r.solarCalendar} solar calendar is not bridged by the research resolver`;
    }
  } else if (r.type === 'solar-month-lunar-tithi') {
    if (solarMonthToTamil[r.solarCalendar]) {
      dates = dayRows
        .filter(([,d]) => solarMonthMatches(d,r) && d.paksha === r.paksha && tithiName(d) === r.tithi)
        .map(([date]) => ({year:date.slice(0,4),date,basis:'06:00-sidereal-solar-lunar'}));
      caveat = `Hybrid ${r.solarCalendar} solar/lunar candidate still requires the sampradaya decision window`;
    } else {
      caveat = `${r.solarCalendar} solar calendar is not bridged by the research resolver`;
    }
  } else if (r.type === 'multi-day' && r.month && r.paksha && r.tithi) {
    for (const start of lunarCandidates(r)) {
      for (let i=0; i<r.durationDays; i++) {
        const date = datePlus(start.date, i);
        if (YEARS.includes(date.slice(0,4))) dates.push({year:date.slice(0,4),date,day:i+1,start:start.date,basis:start.basis});
      }
    }
    caveat = 'Multi-day span is a scaffold; individual ritual days may need their own observance rules';
  } else if (r.type === 'relative') {
    const anchor = resolvedById.get(r.anchorObservanceId);
    for (const d of anchor?.materializedDates ?? anchor?.dates ?? []) {
      const date = datePlus(d.date, r.offsetDays);
      dates.push({year:date.slice(0,4),date,basis:'relative',anchor:d.date});
    }
    if (!anchor) caveat = `anchor ${r.anchorObservanceId} was not resolved`;
  } else {
    caveat = `rule type ${r.type} is not yet resolved by the research-stage resolver`;
  }

  const check = verification[o.id];
  const crossChecks = [];
  const materializedDates = [];
  for (const year of YEARS) {
    const candidate = dates.find(d => d.year === year)?.date ?? null;
    const verified = check?.dates?.[year] ?? null;
    if (verified) {
      const delta = candidate ? Math.round((Date.parse(verified)-Date.parse(candidate))/DAY) : null;
      let classification = 'agree';
      if (candidate !== verified) {
        if (candidate === null) classification = 'source-only';
        else if (Math.abs(delta) === 1) classification = 'decision-window-or-sunrise-snapshot';
        else classification = 'rule-or-calendar-system-review';
      }
      crossChecks.push({year,computed:candidate,verified,status:candidate===verified?'agree':'disagree',deltaDays:delta,classification,source:check.source});
      materializedDates.push({year,date:verified,basis:'external-verified-date',computedCandidate:candidate,agreement:candidate===verified});
    } else {
      for (const d of dates.filter(x => x.year === year)) materializedDates.push({...d,basis:`unverified-${d.basis}`});
    }
  }

  return {id:o.id,status:o.status,ruleType:r.type,dates,materializedDates,...(caveat?{caveat}:{}),...(crossChecks.length?{crossChecks}:{})};
}

const ordered = [...observations].sort((a,b) => a.id.localeCompare(b.id));
const resolvedById = new Map();
for (const o of ordered.filter(x => x.rule.type !== 'relative')) {
  const r = resolveOne(o, resolvedById);
  resolvedById.set(o.id, r);
}
for (const o of ordered.filter(x => x.rule.type === 'relative')) {
  const r = resolveOne(o, resolvedById);
  resolvedById.set(o.id, r);
}
const resolved = [...resolvedById.values()];
const disagreements = resolved.flatMap(x => (x.crossChecks ?? []).filter(c => c.status === 'disagree').map(c => ({observanceId:x.id,...c})));
const unresolved = resolved.filter(x => !(x.materializedDates ?? []).length);
const severeDisagreements = disagreements.filter(x => x.classification === 'rule-or-calendar-system-review');

mkdirSync(join(ROOT,'reports'), {recursive:true});
writeFileSync(join(ROOT,'reports/observances-2026-2029.json'), JSON.stringify({
  generated:new Date().toISOString(),
  panchangaRange:{from:table.meta?.from,to:table.meta?.to},
  years:YEARS,
  observances:resolved.length,
  unresolved:unresolved.map(x => ({id:x.id,caveat:x.caveat ?? 'no dates'})),
  disagreements,
  severeDisagreements,
  resolved
}, null, 2) + '\n');

console.log(`observance resolver: ${resolved.length} record(s)`);
console.log(`unresolved: ${unresolved.length}`);
console.log(`candidate/source disagreements preserved: ${disagreements.length}`);
console.log(`severe (>1 day / calendar-system) disagreements: ${severeDisagreements.length}`);
for (const d of severeDisagreements) console.log(`  REVIEW ${d.observanceId} ${d.year}: candidate ${d.computed ?? 'none'} vs source ${d.verified}`);
