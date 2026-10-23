import {existsSync} from 'node:fs';
if(existsSync(new URL('approval.json',import.meta.url))) throw new Error('Approved packet is frozen; do not regenerate over reviewed files.');
import {readFileSync,writeFileSync} from 'node:fs';
import Ajv from 'ajv/dist/2020.js';import addFormats from 'ajv-formats';
import {gitBlobSha1,localeContentHash} from '../../../scripts/lib/locale-content.mjs';
const base=new URL('.',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,base),'utf8'));
const id='ravana-last-rites';
const source=read(`en/${id}.json`);
// Source linkage follows the episode's chronological turns; the same source
// supports adjacent breath lines within a speech, without importing English syntax.
const transitions={hi:{short:[[/विभीषण ने रावण को कितनी/,9],[/आज उनका भाई/,0],[/राम ने उन्हें सांत्वना/,1],[/विभीषण ने अपने भाई के अंतिम संस्कार करने की अनुमति/,2],[/तब राम बोले/,3],[/बाद में जब रावण की पत्नी/,4],[/लेकिन अब विभीषण/,5],[/विभीषण ने पुरोहितों/,6],[/रावण के अंतिम संस्कार किए गए/,7],[/राम ने अपना धनुष/,8]],full:[[/विभीषण ने रावण को पहले/,9],[/आज उसी भाई/,0],[/राम ने विभीषण की बात सुनी/,1],[/विभीषण ने फिर अपने भाई/,2],[/तब राम ने कहा/,3],[/मगर लंका के लोगों/,4],[/राम ने विभीषण से कहा/,5],[/विभीषण लंका गए/,6],[/उन्होंने अपने भाई के लिए विधिपूर्वक/,7],[/युद्ध समाप्त हो गया था/,8]]},ta:{short:[[/அண்ணனிடம் எத்தனையோ/,9],[/இப்போது அந்த அண்ணன்/,0],[/ராமர் அவனுக்கு ஆறுதல்/,1],[/தன் அண்ணனுக்குரிய இறுதிச்/,2],[/ராமர் சொன்னார்/,3],[/பிறகு, ராவணனின் மனைவி/,4],[/இறுதிச் சடங்குகளைச் செய்ய வேண்டிய நேரத்தில்/,5],[/புனித நெருப்பும்/,6],[/அண்ணனுக்காக நீர்க்கடன்/,7],[/போர் முடிந்தது/,8]],full:[[/அண்ணனிடம் எத்தனையோ/,9],[/இன்று அந்த அண்ணன்/,0],[/விபீஷணன் புலம்புவதைக்/,1],[/விபீஷணன் மீண்டும் பேசினான்/,2],[/அப்போது ராமர் கூறினார்/,3],[/இலங்கையில் துயரம்/,4],[/அப்போது ராமர் விபீஷணனிடம்/,5],[/விபீஷணன் இலங்கைக்குச்/,6],[/சடங்குகள் முறைப்படி/,7],[/இனி போர் இல்லை/,8]]}};
const docs=[{...source,language:'en'}];
for(const lang of ['hi','ta']){
 const path=`locales/${lang}/${id}.json`,d=read(path);
 for(const [length,r] of Object.entries(d.lengths)){
  let phase=0,passed=new Set();
  for(const b of r.blocks){
   const transition=transitions[lang][length].find(([rx],i)=>!passed.has(i)&&rx.test(b.text));
   if(transition){phase=transition[1];passed.add(transitions[lang][length].indexOf(transition));}
   d.sourceMap.scenes[b.scene]=[phase];
  }
  if(passed.size!==transitions[lang][length].length)throw Error(`Unmapped source turn ${lang}/${length}`);
 }
 writeFileSync(new URL(path,base),JSON.stringify(d,null,2)+'\n');docs.push(d);
}
const ajv=addFormats(new Ajv({allErrors:true,strict:false}));const root=new URL('../../../',base);
const canonV=ajv.compile(JSON.parse(readFileSync(new URL('schema/story.schema.json',root))));
const locV=ajv.compile(JSON.parse(readFileSync(new URL('schema/story-locale.schema.json',root))));
if(!canonV(source))throw Error(JSON.stringify(canonV.errors));
const errors=[];
for(const d of docs){
 if(d.language!=='en'&&!locV(d))errors.push(...locV.errors);
 for(const [length,r] of Object.entries(d.lengths)){
  if(r.blocks.filter(b=>b.t==='slow').length!==1||r.blocks.at(-1).t!=='slow')errors.push(`${d.language}/${length}: landing`);
  for(const b of r.blocks){if((b.text.match(/_/g)||[]).length%2)errors.push(`${d.language}/${length}: speech`);}
  if(d.language!=='en'){
   const prose=r.blocks.map(b=>b.text.replace(/«([^»]+)»/g,(_,key)=>d.displayNames[key]??'UNRESOLVED')).join('\n');
   if(/[«»]|\p{Script=Latin}/u.test(prose))errors.push(`${d.language}/${length}: native script`);
   if(d.sourceBlobSha1!==gitBlobSha1(readFileSync(new URL(`en/${id}.json`,base),'utf8')))errors.push('source pin');
  }
 }
}
if(errors.length)throw Error(JSON.stringify(errors));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const visible=(s,d)=>esc(s.replace(/«([^»]+)»/g,(_,k)=>d.displayNames?.[k]??k)).replace(/_([^_]+)_/g,'<em>$1</em>');
let html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ravana funeral · publication review</title><style>body{margin:0;background:#17111e;color:#f5ead5;font:20px/1.85 Georgia,serif}header,article{max-width:780px;margin:24px auto;padding:24px}img{width:100%;height:auto}h1,h2{line-height:1.35}details{border-top:1px solid #66516c;padding:16px 0}summary{cursor:pointer}a{color:#f0b458}.slow{color:#f0b458}article[lang=ta]{line-height:2}small{font:15px/1.7 system-ui}</style><header><h1>Publication review: Rāvaṇa’s last rites</h1><p>Six tellings; human native-language review and actual Short/Full timings pending. This new story is not covered by the earlier six-story approval.</p><p><a href="SOURCE-REVIEW.md">Source findings and changes</a> · <a href="preparation.json">Preparation record</a></p><img src="art/hero.png" alt="Supplied illustration: Vibhishana mourns Ravana while Rama stands nearby"><p><small>Death and funeral rites, non-graphic narration. Proposed age 9+. Illustration supplied by the user; not a historical reconstruction.</small></p></header>';
for(const d of docs){html+=`<article lang="${d.language}"><h2>${esc(d.title)}</h2>`;for(const [length,r] of Object.entries(d.lengths)){html+=`<details ${length==='full'?'open':''}><summary>${length==='full'?'Full · target 6 minutes':'Short · target 3 minutes'} · timing pending</summary>${r.blocks.map(b=>`<p class="${b.t==='slow'?'slow':''}">${visible(b.text,d)}</p>`).join('')}</details>`;}html+=`<h3>Parent material</h3><p>${visible(d.close.question,d)}</p><p>${visible(d.close.seed,d)}</p>${d.close.ifTheyAsk.map(f=>`<details><summary>${visible(f.q,d)}</summary><p>${visible(f.a,d)}</p></details>`).join('')}</article>`;}
html+='</html>';writeFileSync(new URL('review.html',base),html);
writeFileSync(new URL('evidence/draft-checks.json',base),JSON.stringify({status:'PASS',scope:'Schema, rendition presence, final landing, native script, balanced speech, source pins and source scene mapping. Not human native review/timing or visual QA.',editions:docs.map(d=>({language:d.language,hash:d.language==='en'?gitBlobSha1(JSON.stringify(source)):localeContentHash(d),lengths:Object.keys(d.lengths)})),errors},null,2)+'\n');console.log('PASS: three schemas / six tellings; review.html generated.');
