#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { approvedHeroUrl } from './lib/media.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const args = process.argv.slice(2);
const daysArg = args.indexOf('--days');
const DAYS = daysArg >= 0 ? Number(args[daysArg + 1]) : 30;
const RESET = args.includes('--reset');

if (!Number.isInteger(DAYS) || DAYS < 1 || DAYS > 90) {
  console.error('usage: npm run social:plan -- --days <1..90> [--reset]');
  process.exit(1);
}

function indiaDate(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

function reelPreflight(id) {
  try {
    execFileSync(
      process.execPath,
      [join(ROOT, 'scripts', 'reel.mjs'), '--check', id],
      {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8'
      }
    );
    return { ok: true };
  } catch (err) {
    const detail = String(err?.stderr ?? err?.message ?? '')
      .split('\n')
      .find(line => line.includes('FAIL reel gate:')) ??
      'reel preflight failed';
    return { ok: false, detail: detail.trim() };
  }
}

const today = indiaDate();
const canon = read('content/canon.json').canon;
const canonById = new Map(canon.map(x => [x.id, x]));
const panchanga = read('content/panchanga.json').days ?? {};
const mediaDoc = read('content/media.json');
const media = mediaDoc.stories ?? mediaDoc;
const socialDoc = read('content/social.json');
const social = socialDoc.stories ?? {};

const candidates = [];
const rejected = [];

for (const name of readdirSync(join(ROOT, 'content/stories')).filter(x => x.endsWith('.json'))) {
  const story = read(`content/stories/${name}`);

  if (story.status !== 'published') continue;
  if (story.audience?.gated) continue;
  if (!social[story.id]?.reel?.blocks?.length) continue;

  const hero = approvedHeroUrl({
    root: ROOT,
    story,
    media,
    warn: () => {}
  });
  if (!hero) {
    rejected.push([story.id, 'no approved exact-version hero']);
    continue;
  }

  const gate = reelPreflight(story.id);
  if (!gate.ok) {
    rejected.push([story.id, gate.detail]);
    continue;
  }

  candidates.push({
    id: story.id,
    title: story.title,
    minAge: story.audience?.minAge ?? 99,
    weight: story.calendar?.weight ?? 0,
    festivals: story.calendar?.festivals ?? [],
    canonN: canonById.get(story.id)?.n ?? 9999
  });
}

if (!candidates.length) {
  console.error('FAIL: no reel-gated campaign-ready stories found.');
  process.exit(1);
}

candidates.sort((a, b) =>
  a.canonN - b.canonN ||
  a.minAge - b.minAge ||
  a.id.localeCompare(b.id)
);

const calendarPath = join(ROOT, 'content/social-calendar.json');
let existing = { version: 2, days: {} };

if (existsSync(calendarPath)) {
  existing = JSON.parse(readFileSync(calendarPath, 'utf8'));
}

let existingDays = existing.days ?? {};
if (RESET) {
  existingDays = Object.fromEntries(
    Object.entries(existingDays).filter(([date]) => date < today)
  );
}

const used = new Set(
  Object.entries(existingDays)
    .filter(([date]) => date >= today)
    .map(([, row]) => row.storyId)
);

const festivalUsed = new Set();
let rotation = 0;

function chooseGeneral() {
  let general = candidates
    .filter(s => !used.has(s.id))
    .sort((a, b) =>
      a.minAge - b.minAge ||
      b.weight - a.weight ||
      a.canonN - b.canonN
    );

  if (!general.length) {
    used.clear();
    general = [...candidates].sort((a, b) =>
      a.minAge - b.minAge ||
      b.weight - a.weight ||
      a.canonN - b.canonN
    );
  }

  const story = general[rotation % general.length];
  rotation++;
  return { story, reason: 'rotation' };
}

function pickFor(date) {
  const festivals = panchanga[date]?.festivals ?? [];

  const festivalCandidates = candidates
    .filter(s =>
      !used.has(s.id) &&
      !festivalUsed.has(s.id) &&
      s.festivals.some(f => festivals.includes(f))
    )
    .sort((a, b) =>
      b.weight - a.weight ||
      a.minAge - b.minAge ||
      a.canonN - b.canonN
    );

  if (festivalCandidates.length) {
    const story = festivalCandidates[0];
    festivalUsed.add(story.id);
    return {
      story,
      reason: `festival:${story.festivals.find(f => festivals.includes(f))}`
    };
  }

  return chooseGeneral();
}

const days = { ...existingDays };

for (let i = 0; i < DAYS; i++) {
  const date = addDays(today, i);

  if (days[date]?.storyId) {
    const known = candidates.find(s => s.id === days[date].storyId);
    if (known) used.add(known.id);
    continue;
  }

  const picked = pickFor(date);
  used.add(picked.story.id);

  days[date] = {
    storyId: picked.story.id,
    title: picked.story.title,
    reason: picked.reason,
    status: 'planned'
  };
}

const ordered = Object.fromEntries(
  Object.entries(days).sort(([a], [b]) => a.localeCompare(b))
);

const output = {
  version: 2,
  timezone: 'Asia/Kolkata',
  postingTime: '19:00',
  generatedOn: today,
  policy:
    'Only published, non-gated stories that pass the real reel preflight and have approved exact-version art. Festival matches get priority once; otherwise rotate without repeats.',
  days: ordered
};

writeFileSync(
  calendarPath,
  JSON.stringify(output, null, 2) + '\n'
);

console.log(`social plan: PASS — ${DAYS} day window from ${today}`);
console.log(`reel-gated campaign-ready stories: ${candidates.length}`);
console.log(`rejected by campaign readiness: ${rejected.length}`);
console.log(`wrote: content/social-calendar.json`);
console.log(RESET ? 'mode: RESET future plan\n' : '');

for (let i = 0; i < DAYS; i++) {
  const date = addDays(today, i);
  const row = ordered[date];
  console.log(`${date}  ${row.storyId.padEnd(24)} ${row.reason}`);
}

if (rejected.length) {
  console.log('\nNot scheduled until fixed:');
  for (const [id, reason] of rejected) {
    console.log(`  ${id.padEnd(26)} ${reason}`);
  }
}

console.log('\nReview content/social-calendar.json before committing it.');
