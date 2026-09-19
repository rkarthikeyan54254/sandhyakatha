#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=new URL('..',import.meta.url).pathname;
const read=rel=>JSON.parse(readFileSync(join(ROOT,rel),'utf8'));
const STRICT=process.argv.includes('--strict');
const observanceIds=new Set(readdirSync(join(ROOT,'content/observances'))
  .filter(f=>f.endsWith('.json')&&!f.startsWith('_')).map(f=>f.replace(/\.json$/,'')));
const canon=new Map(read('content/canon.json').canon.map(s=>[s.id,s]));
const doc=read('content/observance-story-map.json');
const errors=[],warnings=[],seen=new Set();
const err=m=>errors.push(m), warn=m=>warnings.push(m);
for(const m of doc.mappings??[]){
  const key=`${m.observanceId}|${m.storyId}`;
  if(seen.has(key)) err(`duplicate mapping ${key}`); seen.add(key);
  if(!observanceIds.has(m.observanceId)) err(`unknown observance ${m.observanceId}`);
  if(!canon.has(m.storyId)) err(`unknown story ${m.storyId}`);
  if(!['direct','strong-related','related'].includes(m.relevance)) err(`${key}: invalid relevance ${m.relevance}`);
  if(!['proposed','approved','retired'].includes(m.status)) err(`${key}: invalid status ${m.status}`);
  if(!m.reason?.trim()) err(`${key}: missing human-readable reason`);
  if(m.reason?.length>320) err(`${key}: reason exceeds 320 characters`);
  const story=canon.get(m.storyId);
  if(story && m.storyStateAtProposal && story.status!==m.storyStateAtProposal)
    warn(`${key}: story status moved from ${m.storyStateAtProposal} to ${story.status}; re-review mapping`);
  if(m.status==='approved' && !m.reviewedBy) err(`${key}: approved mapping missing reviewedBy`);
  if(m.status==='approved' && !m.reviewedOn) err(`${key}: approved mapping missing reviewedOn`);
}
for(const w of warnings) console.log(`warn  ${w}`);
for(const e of errors) console.log(`ERROR ${e}`);
console.log(`—\n${doc.mappings?.length??0} observance-story mapping(s)`);
const fail=errors.length||(STRICT&&warnings.length);
console.log(fail?`FAILED — ${errors.length} error(s), ${warnings.length} warning(s)`:`OK — ${warnings.length} warning(s)`);
process.exit(fail?1:0);
