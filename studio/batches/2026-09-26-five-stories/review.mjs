// Run from the repository root: node studio/batches/2026-09-26-five-stories/review.mjs
// Offline review only. Does not approve, publish, or modify story content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { gitBlobSha1 } from '../../../scripts/lib/locale-content.mjs';

const batch=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(batch,'../../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ids=['butter-rope','last-grain','banyan-seed','blue-jackal','mice-ate-the-scales'];
const ajv=addFormats(new Ajv({allErrors:true,strict:false}));
const validate=ajv.compile(read(path.join(root,'schema/story-locale.schema.json')));
const lex=read(path.join(root,'content/lexicon.json'));
const errors=[], docs=[];
const assert=(condition,message)=>{if(!condition)errors.push(message);};
const counts=[];
for(const id of ids){
  const raw=fs.readFileSync(path.join(root,`content/stories/${id}.json`),'utf8');
  const en=JSON.parse(raw); docs.push({id,lang:'en',doc:en,en});
  assert(en.status==='in-review',`${id}: expected unpublished review state`);
  counts.push({id,englishWords:Object.fromEntries(Object.entries(en.lengths).map(([k,r])=>[k,r.blocks.filter(b=>b.t!=='aside'&&b.text).map(b=>b.text.replace(/[«»_]/g,'')).join(' ').split(/\s+/).filter(Boolean).length]))});
  for(const lang of ['hi','ta']){
    const d=read(path.join(batch,`locales/${lang}/${id}.json`));
    assert(validate(d),`${lang}/${id}: ${ajv.errorsText(validate.errors)}`);
    assert(d.storyId===id&&d.language===lang&&d.locale===`${lang}-IN`,`${id}: identity mismatch`);
    assert(d.sourceVersion===en.version&&d.sourceBlobSha1===gitBlobSha1(raw),`${lang}/${id}: stale canonical source`);
    assert(d.status==='in-review',`${lang}/${id}: review status must be honest`);
    for(const gate of [d.review.languageEditor,d.review.sourceFidelity,...Object.values(d.review.nativeReadAloud)])
      assert(gate.status==='pending'&&gate.reviewer===null&&gate.reviewedOn===null,`${lang}/${id}: unexpected approval`);
    const refs=[d.sourceMap.tease,d.sourceMap.parentNote,d.sourceMap.traditionNote,...d.sourceMap.ifTheyAsk,...Object.values(d.sourceMap.scenes)];
    for(const list of refs)assert(list.length&&list.every(n=>Number.isInteger(n)&&n>=0&&n<en.source.sourcing.length),`${lang}/${id}: invalid claim reference`);
    assert(d.sourceMap.ifTheyAsk.length===d.close.ifTheyAsk.length,`${lang}/${id}: followup map mismatch`);
    const strings=[d.title,d.tease,d.parentNote,d.traditionNote,d.close.question,d.close.seed,...d.close.ifTheyAsk.flatMap(x=>[x.q,x.a])];
    for(const [length,r] of Object.entries(d.lengths)){
      assert(r.measuredSeconds===null,`${lang}/${id}: timing must await real reading`);
      assert(r.blocks.filter(b=>b.t==='slow').length===1&&r.blocks.at(-1).t==='slow',`${lang}/${id}: invalid landing`);
      for(const b of r.blocks){assert(d.sourceMap.scenes[b.scene]?.length,`${lang}/${id}: unmapped scene`);if(b.text)strings.push(b.text);}
    }
    for(const s of strings){
      assert((s.match(/«/g)||[]).length===(s.match(/»/g)||[]).length,`${lang}/${id}: marker imbalance`);
      assert((s.match(/_/g)||[]).length%2===0,`${lang}/${id}: speech imbalance`);
      for(const m of s.matchAll(/«([^»]+)»/g))assert(lex[m[1]]&&d.displayNames[m[1]],`${lang}/${id}: unresolved ${m[1]}`);
    }
    docs.push({id,lang,doc:d,en});
  }
}
// Apply the unchanged production native-language gate to the staged editions.
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'sandhyakatha-five-native-'));
try{
  fs.mkdirSync(path.join(scratch,'content'));
  fs.symlinkSync(path.join(batch,'locales'),path.join(scratch,'content/locales'));
  for(const file of ['content/native-language-moat.json','EDITORIAL.md','AGENTS.md'])fs.symlinkSync(path.join(root,file),path.join(scratch,file));
  execFileSync(process.execPath,[path.join(root,'scripts/native-language-gates.mjs'),'--strict'],{env:{...process.env,SANDHYAKATHA_ROOT:scratch},stdio:'pipe'});
}catch(e){errors.push(`Native gate failed: ${e.stdout||e.message}`);}
finally{fs.rmSync(scratch,{recursive:true,force:true});}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const markup=(s,d)=>esc(s).replace(/«([^»]+)»/g,(_,k)=>`<b>${esc(d.displayNames?.[k]||lex[k]?.display||k)}</b>`).replace(/_([^_]+)_/g,'<em>$1</em>');
const paragraphs=(r,d)=>r.blocks.map(b=>b.t==='beat'?'<div class="beat">· · ·</div>':b.t==='aside'?`<aside class="note"><span>For the parent, not aloud</span><p>${markup(b.text,d)}</p></aside>`:`<p class="${b.t==='slow'?'slow':''}">${markup(b.text,d)}${b.scene?` <a class="claim" href="#${d.storyId}-claim-${d.sourceMap.scenes[b.scene][0]}">[${d.sourceMap.scenes[b.scene].map(n=>n+1).join(', ')}]</a>`:''}</p>`).join('');
const cards=docs.map(({id,lang,doc:d,en})=>`<article id="${id}-${lang}" class="app review-story" data-locale="${lang}-IN" lang="${lang}">
<div class="story"><p class="eyebrow">${lang==='en'?'English':lang==='hi'?'हिन्दी':'தமிழ்'} · Review draft</p><h1>${esc(d.title)}</h1><p>${esc(d.tease)}</p>
<details class="care"><summary>Parent / tradition notes</summary><p>${esc(d.parentNote||en.audience.careNote)}</p><p>${esc(d.traditionNote||en.source.traditionNote)}</p></details>
${Object.entries(d.lengths).map(([name,r])=>`<details ${name==='short'?'open':''}><summary>${name==='short'?'Short telling':'Full telling'}${lang==='en'?` · ${r.minutes} min estimate`:' · timing pending'}</summary><div class="prose">${paragraphs(r,d)}</div></details>`).join('')}
<div class="prose"><h2>After the story</h2><p>${markup(d.close.question,d)}</p><p>${markup(d.close.seed,d)}</p>${d.close.ifTheyAsk.map(q=>`<details><summary>${esc(q.q)}</summary><p>${markup(q.a,d)}</p></details>`).join('')}</div>
<p><a href="#contents">Back to stories</a></p></div></article>`).join('');
const evidence=ids.map(id=>{const en=docs.find(x=>x.id===id).en;return `<section class="evidence"><h2>${esc(en.title)} — source ledger</h2><p>${esc(en.source.work)} · ${esc(en.source.locus)}</p><ol>${en.source.sourcing.map((c,n)=>`<li id="${id}-claim-${n}"><b>${n+1}.</b> ${esc(c.claim)} <small>${esc(c.locus)}</small></li>`).join('')}</ol><ul>${en.source.checkedAgainst.map(s=>`<li>${esc(s).replace(/https:\/\/[^\s)]+/g,u=>`<a href="${u}">${u}</a>`)}</li>`).join('')}</ul></section>`;}).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Five stories — editorial proof</title><link rel="stylesheet" href="../../../src/styles.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400&family=Karla:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&display=swap"><style>:root{--night:#151020;--night-3:#241b31;--paper:#f4ead9;--paper-dim:#c9bdad;--lamp:#f0b458;--lamp-dim:#c89652;--line:#47384f;--muted:#b8a9bd;--read:'Gentium Book Plus',Georgia,serif;--display:var(--read);--ui:Karla,system-ui,sans-serif}a{color:var(--lamp);overflow-wrap:anywhere}header,.evidence{max-width:860px;margin:32px auto;padding:20px}header li{margin:14px 0}.review-story{margin:32px auto;border:1px solid var(--line);padding-top:20px}.review-story summary{cursor:pointer;padding:12px 0;line-height:1.8}.review-story details{border-top:1px solid var(--line)}.claim{font:12px var(--ui);white-space:nowrap}.evidence li{margin:16px 0;line-height:1.6}.evidence small{display:block;color:var(--paper-dim)}.prose h2{font-size:20px}.care{font-size:15px;line-height:1.8}.status{padding:16px;border:1px solid var(--lamp-dim);line-height:1.6}@media print{details{display:block}article{break-before:page}}</style><header id="contents"><p>SandhyaKatha · 26 September 2026</p><h1>Five stories, three languages</h1><p class="status">Editorial proof — not published. Five English short/full pairs and ten native-language short drafts. Human source review, native editing, read-aloud timings and approved art remain pending. This page uses the existing reader stylesheet; it is not a production rendering certification.</p><ul>${ids.map(id=>`<li>${esc(docs.find(x=>x.id===id).en.title)} — <a href="#${id}-en">English</a> · <a href="#${id}-hi">हिन्दी</a> · <a href="#${id}-ta">தமிழ்</a></li>`).join('')}</ul><p>Bracketed numbers in locale prose link to the source ledger below. Review notes and timings must be recorded by a human after reading these exact files.</p></header>${cards}${evidence}</html>`;
fs.writeFileSync(path.join(batch,'review.html'),html);
fs.writeFileSync(path.join(batch,'validation.json'),JSON.stringify({checkedAt:new Date().toISOString(),base:'63c97f2d8cd5f516ba401730ea8f9390efc75dfa',canonicalStories:5,localeEditions:10,checks:['locale schemas','canonical blob hashes','claim references','entity markers','pending human review provenance','unchanged native-language gate'],counts,publicationReady:false,pending:['human English source and read-aloud review','human Hindi and Tamil language/source review','measured native read-aloud timings','five story-version-approved hero illustrations']},null,2)+'\n');
console.log('PASS: 5 canonical stories, 10 staged locale editions; review.html and validation.json saved.');
