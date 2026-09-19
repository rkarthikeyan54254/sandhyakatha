#!/usr/bin/env node
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT=new URL('..',import.meta.url).pathname;
const read=rel=>JSON.parse(readFileSync(join(ROOT,rel),'utf8'));
const obs=readdirSync(join(ROOT,'content/observances'))
 .filter(f=>f.endsWith('.json')&&!f.startsWith('_')).map(f=>read(`content/observances/${f}`))
 .filter(o=>o.status!=='retired');
const canon=new Map(read('content/canon.json').canon.map(s=>[s.id,s]));
const map=read('content/observance-story-map.json').mappings??[];

function classify(o){
 const ms=map.filter(m=>m.observanceId===o.id&&m.status!=='retired');
 const pub=ms.filter(m=>canon.get(m.storyId)?.status==='published');
 const drafts=ms.filter(m=>canon.get(m.storyId)?.status!=='published');
 const directPub=pub.filter(m=>m.relevance==='direct');
 const strongPub=pub.filter(m=>m.relevance==='strong-related');
 const relatedPub=pub.filter(m=>m.relevance==='related');
 let coverage='missing';
 if(directPub.length) coverage='direct-published';
 else if(strongPub.length||relatedPub.length) coverage='related-published';
 else if(drafts.length) coverage='draft-only';
 return {
   id:o.id,name:o.names.en,kind:o.kind,tier:o.importance.tier,score:o.importance.score,
   observanceStatus:o.status,coverage,
   mappings:ms.map(m=>({storyId:m.storyId,storyStatus:canon.get(m.storyId)?.status??'missing',
      relevance:m.relevance,mapStatus:m.status}))
 };
}
const rows=obs.map(classify).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
const counts={};
for(const r of rows) counts[r.coverage]=(counts[r.coverage]??0)+1;
const major=rows.filter(r=>['principal','major'].includes(r.tier));
const covered=rows.filter(r=>r.coverage==='direct-published'||r.coverage==='related-published');
const majorCovered=major.filter(r=>r.coverage==='direct-published'||r.coverage==='related-published');
const report={
 generated:new Date().toISOString(),
 totalObservances:rows.length,
 principalOrMajor:major.length,
 counts,
 storyAvailabilityPercent: rows.length ? +(covered.length*100/rows.length).toFixed(1) : 0,
 majorStoryAvailabilityPercent: major.length ? +(majorCovered.length*100/major.length).toFixed(1) : 0,
 note:"Availability counts proposed mappings as editorial candidates. Production Tonight must wait for observance approval and mapping approval.",
 highestPriorityMissing:rows.filter(r=>r.coverage==='missing').slice(0,40),
 rows
};
mkdirSync(join(ROOT,'reports'),{recursive:true});
writeFileSync(join(ROOT,'reports/observance-coverage.json'),JSON.stringify(report,null,2)+'\n');
console.log(`observance coverage: ${rows.length} total`);
console.log(`direct published: ${counts['direct-published']??0}`);
console.log(`related published: ${counts['related-published']??0}`);
console.log(`draft only: ${counts['draft-only']??0}`);
console.log(`missing: ${counts.missing??0}`);
console.log(`story availability: ${report.storyAvailabilityPercent}%`);
console.log(`principal/major availability: ${report.majorStoryAvailabilityPercent}%`);
