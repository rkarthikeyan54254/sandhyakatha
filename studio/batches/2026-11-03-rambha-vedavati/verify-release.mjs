import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {gitBlobSha1,localeContentHash} from '../../../scripts/lib/locale-content.mjs';
import {approvedHeroUrl} from '../../../scripts/lib/media.mjs';
const root=new URL('../../../',import.meta.url),batch=new URL('.',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const ids=['rambha-sevenfold-curse','vedavati-hair-and-vow'];
const canon=read('content/canon.json').canon,index=read('dist/data/index.json').stories,locales=read('dist/data/locale-catalog.json'),lock=read('content/locale.lock.json'),media=read('content/media.json').stories;
const records=[];
for(const id of ids){
 const source=read(`content/stories/${id}.json`),card=index.find(s=>s.id===id),row=canon.find(s=>s.id===id);
 assert.equal(source.status,'published');assert.equal(source.audience.gated,true);assert.equal(row.gated,true);assert.equal(card.gated,true);assert.equal(card.minAge,id.startsWith('rambha')?15:14);
 const en=read(`dist/data/s/${id}.json`);assert.deepEqual(en.lengths,source.lengths);assert.ok(en.title.includes('Rāvaṇa'));
 assert.ok(approvedHeroUrl({root:root.pathname,story:source,media}));
 assert.ok(!fs.existsSync(new URL(`dist/s/${id}/index.html`,root)),'Gated story must not have public archive page');
 assert.ok(!fs.readFileSync(new URL('dist/sitemap.xml',root),'utf8').includes(`/s/${id}/`));
 const approved=JSON.parse(fs.readFileSync(new URL(`en/${id}.json`,batch),'utf8'));
 const spoken=r=>r.blocks.filter(b=>b.t!=='aside');
 for(const length of ['short','full'])assert.deepEqual(spoken(source.lengths[length]),spoken(approved.lengths[length]));
 for(const lang of ['hi','ta']){
  const d=read(`content/locales/${lang}/${id}.json`),built=read(`dist/data/l/${lang}/${id}.json`);
  assert.equal(d.status,'approved');assert.equal(d.sourceBlobSha1,gitBlobSha1(fs.readFileSync(new URL(`content/stories/${id}.json`,root),'utf8')));
  assert.equal(lock.locales[`${lang}-IN/${id}`].hash,localeContentHash(d));
  assert.equal(built.audience.gated,true);assert.equal(built.title,d.title);assert.equal(built.hero,en.hero);
  assert.ok(locales.locales[`${lang}-IN`].stories.some(s=>s.id===id));
  assert.ok(!read('content/locale-public.json').editions.some(s=>s.storyId===id));
  assert.ok(!read('content/locale-previews.json').previews.some(s=>s.storyId===id));
  const original=JSON.parse(fs.readFileSync(new URL(`locales/${lang}/${id}.json`,batch),'utf8'));
  for(const[length,r]of Object.entries(built.lengths)){
   assert.equal(r.minutes,length==='short'?3:6);assert.equal(r.measuredSeconds,length==='short'?180:360);assert.deepEqual(r.blocks,d.lengths[length].blocks);
   assert.deepEqual(spoken(r),spoken(original.lengths[length]));
   for(const b of r.blocks){const rendered=(b.text??'').replace(/«([^»]+)»/g,(_,k)=>built.displayNames[k]??`UNRESOLVED ${k}`);assert.ok(!/\p{Script=Latin}|[«»]/u.test(rendered));}
  }
 }
 records.push({id,status:'PASS',age:source.audience.minAge,gated:true,languages:['en','hi','ta'],lengths:{short:3,full:6},narration:'byte-for-byte unchanged from approved candidate blocks',publicArchive:'excluded',runtime:'all three present',hero:en.hero});
}
const files={};for(const id of ids)for(const p of [`content/stories/${id}.json`,...['hi','ta'].map(l=>`content/locales/${l}/${id}.json`),`public/media/stories/${id}/hero.webp`,...['','-hi','-ta'].map(l=>`public/og/${id}${l}.jpg`)])files[p]=createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
fs.writeFileSync(new URL('evidence/release-checks.json',batch),JSON.stringify({status:'PASS',records,files},null,2)+'\n');console.log('PASS: six runtime editions / twelve tellings; approved narration unchanged; true parental gates, native script, pins, locks, heroes, archive exclusions.');
