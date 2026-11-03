import fs from 'node:fs';
import {createHash} from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {gitBlobSha1,localeContentHash} from '../../../scripts/lib/locale-content.mjs';
const base=new URL('.',import.meta.url),root=new URL('../../../',base);
const read=(p,b=base)=>JSON.parse(fs.readFileSync(new URL(p,b),'utf8'));
const write=(p,d)=>fs.writeFileSync(new URL(p,base),JSON.stringify(d,null,2)+'\n');
if(fs.existsSync(new URL('approval.json',base)))throw Error('Approved packet is frozen; do not regenerate reviewed files.');
const ids=['rambha-sevenfold-curse','vedavati-hair-and-vow'];
const names={hi:{'Rambhā':'रम्भा','Nalakūbara':'नलकूबर','Rāvaṇa':'रावण','Kubera':'कुबेर','Sītā':'सीता','Kailāsa':'कैलास','Mandākinī':'मंदाकिनी','Vedavatī':'वेदवती','Himālayas':'हिमालय','Kuśadhvaja':'कुशध्वज','Vedas':'वेद','Viṣṇu':'विष्णु','Śambhu':'शम्भु','Nārāyaṇa':'नारायण','Rāma':'राम','Janaka':'जनक','Laṅkā':'लंका','Yuddha Kāṇḍa':'युद्धकाण्ड'},ta:{'Rambhā':'ரம்பை','Nalakūbara':'நளகூபரன்','Rāvaṇa':'ராவணன்','Kubera':'குபேரன்','Sītā':'சீதை','Kailāsa':'கயிலை','Mandākinī':'மந்தாகினி','Vedavatī':'வேதவதி','Himālayas':'இமயமலை','Kuśadhvaja':'குசத்வஜர்','Vedas':'வேதங்கள்','Viṣṇu':'திருமால்','Śambhu':'சம்பு','Nārāyaṇa':'நாராயணன்','Rāma':'ராமர்','Janaka':'ஜனகர்','Laṅkā':'இலங்கை','Yuddha Kāṇḍa':'யுத்த காண்டம்'}};
const pending=()=>({status:'pending',reviewer:null,reviewedOn:null});
const ajv=addFormats(new Ajv({allErrors:true,strict:false}));
const schemas={en:ajv.compile(read('schema/story.schema.json',root)),locale:ajv.compile(read('schema/story-locale.schema.json',root))};
const lex=read('content/lexicon.json',root),missing=new Set(),errors=[],docs=[];
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const native=(s,d)=>s.replace(/«([^»]+)»/g,(_,k)=>d.displayNames?.[k]??k);
const visible=(s,d)=>esc(native(s,d)).replace(/_([^_]+)_/g,'<em>$1</em>');
const results=[];
const framing=read('parent-framing.json');
for(const id of ids){
 const en=read(`en/${id}.json`);docs.push({...en,language:'en'});
 if(!schemas.en(en))errors.push({id,errors:schemas.en.errors});
 for(const [length,r]of Object.entries(en.lengths)){
  const words=r.blocks.filter(b=>b.t!=='aside').reduce((n,b)=>n+(b.text??'').replace(/[«»_]/g,'').split(/\s+/).filter(Boolean).length,0);
  const estimate=Math.round(words/110+r.blocks.filter(b=>b.t==='beat').length*.05);
  const [min,max,target]=length==='short'?[300,360,3]:[650,680,6];
  if(words<min||words>max||estimate!==target||r.minutes!==target)errors.push({id,length,words,estimate});
  results.push({id,language:'en',length,words,estimatedMinutes:estimate,actualTiming:'pending'});
 }
 for(const c of en.characters)if(!lex[c.ref])missing.add(c.ref);
 for(const lang of ['hi','ta']){
  const input=read(`locales-${lang}.json`)[id];
  const map={tease:[1,2],scenes:{},parentNote:id.startsWith('rambha')?[3,4,5]:[2,5,6,7],traditionNote:id.startsWith('rambha')?[5,7]:[7,8],ifTheyAsk:id.startsWith('rambha')?[[4,5],[2,3],[5,7]]:[[4,5],[5,6,7],[7,8]]};
  const lengths={};
  for(const length of ['short','full']){
   lengths[length]={measuredSeconds:null,blocks:input[length].map(([claim,text],i)=>{
    const scene=`${length}-${i+1}`;map.scenes[scene]=[claim];
    return {t:i===input[length].length-1?'slow':'p',scene,text};
   })};
  }
  const d={schemaVersion:'1.0',storyId:id,sourceVersion:en.version,sourceBlobSha1:gitBlobSha1(fs.readFileSync(new URL(`en/${id}.json`,base),'utf8')),locale:`${lang}-IN`,language:lang,status:'in-review',register:lang==='hi'?'सहज पारिवारिक कथन; बड़े बच्चों के लिए संयत, स्पष्ट भाषा।':'குடும்பத்தில் வாசித்துச் சொல்லும் இயல்பான தமிழ்; பெரிய பிள்ளைகளுக்கு ஏற்ற அடக்கமான நடை.',title:input.title,tease:input.tease,displayNames:names[lang],sourceMap:map,lengths,parentNote:input.parentNote,traditionNote:input.traditionNote,close:{question:input.question,seed:input.seed,ifTheyAsk:input.faq.map(([q,a])=>({q,a}))},review:{nativeReadAloud:{short:pending(),full:pending()},languageEditor:pending(),sourceFidelity:pending()}};
  if(id.startsWith('vedavati'))d.sourceMap.tease=[5,6];
  if(!schemas.locale(d))errors.push({id,lang,errors:schemas.locale.errors});
  const reader=[d.title,d.tease,d.parentNote,d.traditionNote,d.close.question,d.close.seed,...d.close.ifTheyAsk.flatMap(x=>[x.q,x.a]),...Object.values(d.lengths).flatMap(x=>x.blocks.map(b=>b.text))].map(x=>native(x,d)).join('\n');
  if(/\p{Script=Latin}|[«»]/u.test(reader))errors.push({id,lang,error:'Latin leakage/unresolved marker'});
  const policy=read('content/native-language-moat.json',root);
  for(const phrase of policy.languages[lang].regressionPhrases)if(reader.includes(phrase))errors.push({id,lang,phrase});
  for(const r of Object.values(d.lengths))for(const b of r.blocks){if(!en.source.sourcing[map.scenes[b.scene][0]])errors.push({id,lang,scene:b.scene});}
  write(`locales/${lang}/${id}.json`,d);docs.push(d);
  for(const[length,r]of Object.entries(d.lengths))results.push({id,language:lang,length,words:r.blocks.reduce((n,b)=>n+b.text.split(/\s+/).length,0),measuredSeconds:null,timing:'Requires actual native read-aloud; no English-speed estimate asserted.'});
 }
}
for(const d of docs){for(const[length,r]of Object.entries(d.lengths)){
 if(r.blocks.filter(b=>b.t==='slow').length!==1||r.blocks.at(-1).t!=='slow')errors.push({id:d.id??d.storyId,length,error:'landing'});
 for(const b of r.blocks){if(((b.text??'').match(/_/g)??[]).length%2)errors.push({error:'unbalanced speech'});for(const m of (b.text??'').matchAll(/«([^»]+)»/g))if(!lex[m[1]])missing.add(m[1]);}
}}
let html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Rambhā and Vedavatī — three-language review</title><style>body{margin:0;background:#fcf7eb;color:#2c2925;font:19px/1.85 Georgia,serif}header,main{max-width:850px;margin:auto;padding:25px}nav{display:flex;gap:15px;flex-wrap:wrap}a{color:#7e281e}article{border-top:3px solid #a45230;margin:48px 0;padding-top:20px}h1,h2,h3{line-height:1.4}.care,aside{padding:18px;background:#eee4cf;border-left:4px solid #a45230}.slow{font-weight:bold;color:#7e281e}details{margin:18px 0}summary{cursor:pointer;font-weight:bold}small{font:14px/1.6 system-ui}article[lang=ta]{line-height:2}button{font:inherit;padding:8px 16px}table{border-collapse:collapse}td,th{border:1px solid #c9bda7;padding:8px}</style><header><small>Sandhya Katha · 3 November 2026 · PRIVATE REVIEW · NOT PUBLISHED</small><h1>Two stories, three languages</h1><p>Rambhā: age 15+, sexual violence. Vedavatī: age 14+, assault, death by fire, parental deaths. Both remain parental opt-in. Review privately before reading to a child.</p><p>All twelve tellings are present. English text bands pass; actual readings are pending in every language. Hindi and Tamil require named human language, read-aloud and source-fidelity review. Vedavatī witness selection also needs approval.</p><p><a href="SOURCE-REVIEW.md">Source findings</a> · <a href="RELEASE-CHECKLIST.md">Release checklist</a> · <a href="evidence/draft-checks.json">Machine checks</a></p><nav>${docs.map(d=>`<a href="#${d.id??d.storyId}-${d.language}">${esc(d.title)} (${d.language})</a>`).join('')}</nav></header><main>`;
for(const d of docs){const id=d.id??d.storyId;const frame=framing[d.language][id];const ravana=d.language==='en'?'Rāvaṇa':d.language==='hi'?'रावण':'ராவண';if(!d.title.includes(ravana))errors.push({id,language:d.language,error:'Ravana missing from title'});if(d.language!=='en'&&/\p{Script=Latin}/u.test(frame.text+frame.locus+framing[d.language].heading))errors.push({id,error:'Latin leakage in parent framing'});html+=`<article lang="${d.language}" id="${id}-${d.language}"><h2>${esc(d.title)}</h2><small>${d.language} · ${id} · IN REVIEW</small><p>${visible(d.tease,d)}</p><div class="care">${visible(d.audience?.careNote??d.parentNote,d)}</div><p><small>${visible(d.source?.traditionNote??d.traditionNote,d)}</small></p>`;
 html+=`<aside><h3>${esc(framing[d.language].heading)}</h3><p>${esc(frame.text)}</p><small>${esc(frame.locus)}</small></aside>`;
 for(const length of ['short','full'])html+=`<details ${length==='full'?'open':''}><summary>${length==='short'?'Short · target 3 minutes':'Full · target 6 minutes'} · actual timing pending</summary>${d.lengths[length].blocks.map(b=>b.t==='beat'?'<p aria-label="pause">◇</p>':b.t==='aside'?`<aside><small>For the parent · not aloud</small><br>${visible(b.text,d)}</aside>`:`<p class="${b.t==='slow'?'slow':''}">${visible(b.text,d)}</p>`).join('')}</details>`;
 html+=`<h3>${d.language==='ta'?'பேசிப் பார்க்கலாம்':d.language==='hi'?'बात करके देखें':'After the telling'}</h3><p>${visible(d.close.question,d)}</p><p>${visible(d.close.seed,d)}</p>${d.close.ifTheyAsk.map(x=>`<details><summary>${visible(x.q,d)}</summary><p>${visible(x.a,d)}</p></details>`).join('')}`;
 if(d.language==='en')html+=`<details><summary>Claim ledger and sources</summary><ol start="0">${d.source.sourcing.map(x=>`<li>${esc(x.claim)} <small>${esc(x.locus)}</small></li>`).join('')}</ol><ul>${d.source.checkedAgainst.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`;
 html+='</article>';
}
html+='</main></html>';fs.writeFileSync(new URL('review.html',base),html);
const hashes=Object.fromEntries(docs.map(d=>{const path=d.language==='en'?`en/${d.id}.json`:`locales/${d.language}/${d.storyId}.json`;return[path,createHash('sha256').update(fs.readFileSync(new URL(path,base))).digest('hex')];}));
hashes['parent-framing.json']=createHash('sha256').update(fs.readFileSync(new URL('parent-framing.json',base))).digest('hex');
write('evidence/draft-checks.json',{checkedOn:'2026-11-03',status:errors.length?'FAIL':'PASS',scope:'Staged schemas; English length bands; native script and known regression phrases; valid claim indices; final landing; balanced speech; Ravana in all six titles; native-script parent framing. Does not certify idiomatic prose, source-fidelity approval, actual timing, visual QA, global repository gates or release readiness.',editions:6,tellings:12,results,missingProductionLexicon:[...missing],reviewedFileHashes:hashes,errors});
write('preparation.json',{status:'in-review-not-published',date:'2026-11-03',stories:ids,languages:['en','hi','ta'],publicationAuthorized:true,humanApprovalRecorded:false,sourceWitnessDecision:'pending: Vedavati ending; Rambha stability assessment',nativeLanguageEditor:'pending',actualReadAloud:'pending all twelve tellings',productionMutation:false,releaseBuild:'not run: staged candidates, no production registration',nextAction:'Review review.html, resolve source witness choice, revise/timing-check native Full/Short, obtain named human language approvals for these exact hashes.'});
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',editions:6,tellings:12,missingProductionLexicon:[...missing],errors}));if(errors.length)process.exitCode=1;
