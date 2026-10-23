import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
import {renditionParityErrors} from '../../../scripts/lib/rendition-parity.mjs';
import {gitBlobSha1,localeContentHash} from '../../../scripts/lib/locale-content.mjs';
import {renderPublicRenditions,publicRenditionErrors} from '../../../scripts/lib/public-renditions.mjs';
const batch=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(batch,'../../..'),id='ravana-last-rites';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const source=read(`content/stories/${id}.json`),report={scope:'New story only; isolated runtime/static fixture. Does not bypass or certify catalog-wide production release.',checks:[]};
const lock=read('content/locale.lock.json'),media=read('content/media.json');
for(const language of ['hi','ta']){
 const doc=read(`content/locales/${language}/${id}.json`);assert.deepEqual(renditionParityErrors(source,doc),[]);
 assert.equal(doc.sourceBlobSha1,gitBlobSha1(fs.readFileSync(path.join(root,`content/stories/${id}.json`),'utf8')));
 assert.equal(lock.locales[`${language}-IN/${id}`].hash,localeContentHash(doc));
 report.checks.push(`${language}: full/short, timings, approvals, exact source pin and lock PASS`);
}
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'sk-ravana-qa-'));const copy=p=>{fs.mkdirSync(path.dirname(path.join(fixture,p)),{recursive:true});fs.copyFileSync(path.join(root,p),path.join(fixture,p));};
try{
 const scripts=['build-runtime-locales','runtime-locale-gates','prerender-public-locales','public-locale-gates'];
 for(const file of [...scripts.map(s=>`scripts/${s}.mjs`),...['media','locale-content','locale-paths','rendition-parity','public-renditions','runtime-locale-editions','release-rendition-parity','legacy-parity-seal'].map(s=>`scripts/lib/${s}.mjs`),'content/locale.lock.json',`content/stories/${id}.json`,...['hi','ta'].map(l=>`content/locales/${l}/${id}.json`),`public/og/${id}.jpg`,...['hi','ta'].map(l=>`public/og/${id}-${l}.jpg`),`public/media/stories/${id}/hero.webp`])copy(file);
 const cfg=read('content/locale-public.json');cfg.editions=cfg.editions.filter(e=>e.storyId===id);fs.writeFileSync(path.join(fixture,'content/locale-public.json'),JSON.stringify(cfg));
 fs.writeFileSync(path.join(fixture,'content/media.json'),JSON.stringify({stories:{[id]:media.stories[id]}}));
 const dist=path.join(fixture,`dist/s/${id}`);fs.mkdirSync(dist,{recursive:true});
 const en=renderPublicRenditions(source.lengths,{full:'Full',short:'Short',minutes:'min'},(_key,r)=>r.blocks.map(b=>`<p${b.t==='slow'?' class="slow"':''}>${b.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p>`).join(''));
 assert.deepEqual(publicRenditionErrors(en,source.lengths,s=>s),[]);
 fs.writeFileSync(path.join(dist,'index.html'),`<html><head></head><body><nav class="locale-public-switch" data-locale-switch></nav>${en}</body></html>`);
 fs.writeFileSync(path.join(fixture,'dist/sitemap.xml'),'<urlset></urlset>');
 for(const script of scripts){const result=spawnSync(process.execPath,[path.join(fixture,`scripts/${script}.mjs`)],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);report.checks.push(`${script}: PASS in new-story fixture`);}
 for(const language of ['hi','ta']){
  const runtime=JSON.parse(fs.readFileSync(path.join(fixture,`public/data/l/${language}/${id}.json`),'utf8'));
  const doc=read(`content/locales/${language}/${id}.json`);
  for(const length of ['short','full'])assert.deepEqual(runtime.lengths[length].blocks,doc.lengths[length].blocks);
  const out=path.join(batch,`evidence/rendered/${language}`);fs.mkdirSync(out,{recursive:true});
  fs.copyFileSync(path.join(dist,language,'index.html'),path.join(out,'index.html'));
 }
 report.checks.push('All native runtime blocks match reviewed Short and Full; actual public renderers/gates PASS');
 report.checks.push('English public rendition sections preserve both complete tellings PASS');
 fs.writeFileSync(path.join(batch,'evidence/new-story-verification.json'),JSON.stringify(report,null,2)+'\n');
 console.log(report.checks.join('\n'));
}finally{fs.rmSync(fixture,{recursive:true,force:true});}
