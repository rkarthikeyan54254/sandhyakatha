#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT=join(fileURLToPath(new URL('.',import.meta.url)),'..');
const CAL=join(ROOT,'content','social-calendar.json');

function indiaDate(d=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(d);
  const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

if (!existsSync(CAL)) {
  console.error('FAIL: content/social-calendar.json does not exist.');
  console.error('Run: npm run social:plan -- --days 30');
  process.exit(1);
}
const cal=JSON.parse(readFileSync(CAL,'utf8'));
const date=indiaDate();
const row=cal.days?.[date];
if (!row?.storyId) {
  console.error(`FAIL: no social story scheduled for ${date}.`);
  console.error('Refresh the plan: npm run social:plan -- --days 30');
  process.exit(1);
}
console.log(`today: ${date}`);
console.log(`story: ${row.storyId} — ${row.title}`);
console.log(`reason: ${row.reason}`);

const argv=process.argv.slice(2);
const forward=[];
if (argv.includes('--open')) forward.push('--open');
const localeAt=argv.indexOf('--locale');
if (localeAt>=0) {
  const locale=argv[localeAt+1];
  if (!locale || locale.startsWith('--')) {
    console.error('--locale requires a locale');
    process.exit(1);
  }
  forward.push('--locale',locale);
}
execFileSync(process.execPath,[join(ROOT,'scripts','campaign.mjs'),...forward,row.storyId],{
  cwd:ROOT,stdio:'inherit'
});
