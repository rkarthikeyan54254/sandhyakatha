import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {Resvg} from '@resvg/resvg-js';
const B=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(B,'../../..');
const read=p=>fs.readFileSync(path.join(B,p),'utf8'), json=p=>JSON.parse(read(p));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(B,p))).digest('hex');
const batch=json('batch.json'),meta=json('editorial-metadata.json'),scenes=json('evidence/paragraph-scenes.json'),tradition=json('tradition-notes.json');
const policy=JSON.parse(fs.readFileSync(path.join(root,'content/native-language-moat.json')));
const lex={...JSON.parse(fs.readFileSync(path.join(root,'content/lexicon.json'))),...json('lexicon-candidates.json').entries};
const checks=[],fingerprints={};
function check(name,condition){assert(condition,name);checks.push({name,result:'pass'});}
function file(p){check('file '+p,fs.existsSync(path.join(B,p)));fingerprints[p]=hash(p);return p;}
const claimsFor=(st,scene)=>scene==='landing'?st.claims:scene==='first-visit'?['R2','R3']:[scene];
const titles={en:'English',hi:'\u0939\u093f\u0928\u094d\u0926\u0940',ta:'\u0ba4\u0bae\u0bbf\u0bb4\u0bcd'};
const stories=[];
const existingCanon=JSON.parse(fs.readFileSync(path.join(root,'content/canon.json'))).canon;
check('five unique new canon IDs',batch.stories.length===5&&new Set(batch.stories.map(s=>s.id)).size===5&&batch.stories.every(s=>!existingCanon.some(c=>c.id===s.id)&&!fs.existsSync(path.join(root,'content/stories',s.id+'.json'))));
for(const st of batch.stories){
 const sourceFile=file('source-notes/'+st.id+'.md'), sourceText=read(sourceFile);
 const sourceClaims=Object.fromEntries([...sourceText.matchAll(/^- ([A-Z]\d+) [\u2014-] (.*)$/gm)].map(m=>[m[1],m[2]]));
 check(st.id+' complete source ledger',st.claims.every(c=>sourceClaims[c]));
 const editions={};
 for(const lang of batch.languages){
  const mdFile=file((lang==='en'?'en':'locales/'+lang)+'/'+st.id+'.md'),md=read(mdFile),sec=md.split('## ');
  check(st.id+'/'+lang+' two lengths and parent close',sec.length===4);
  const title=sec[0].split('\n')[0].replace(/^# /,'').replace(/ \u2014 English.*$/,'');
  const parentNote=sec[0].split('\n\n').slice(1).join('\n\n').trim();
  const lengths={};
  for(const [i,length] of [[1,'short'],[2,'full']]){
   const paras=sec[i].trim().split('\n\n').slice(1),map=scenes[st.id+'/'+lang][length];
   check(st.id+'/'+lang+'/'+length+' scene-map completeness',map.length===paras.length);
   const unique=[...new Set(map.map(p=>p.scene))].filter(s=>s!=='landing');
   const turns=new Set([unique[Math.floor(unique.length/3)],unique[Math.floor(unique.length*2/3)],unique.at(-1)]);
   let previous='',beats=0,blocks=[];
   for(const [idx,text] of paras.entries()){
    const scene=map[idx].scene,claims=map[idx].claims||claimsFor(st,scene);
    check(st.id+'/'+lang+'/'+length+'/'+idx+' source IDs valid',claims.every(c=>st.claims.includes(c)));
    check(st.id+'/'+lang+'/'+length+'/'+idx+' <=3 sentences',(text.match(/[.!?\u0964](?=[ _\u2019\u201d\u00bb]|$)/gu)||[]).length<=3);
    check(st.id+'/'+lang+'/'+length+'/'+idx+' balanced speech',text.split('_').length%2===1);
    if(scene!==previous&&idx&&turns.has(scene)&&scene!=='landing') {blocks.push({t:'beat',scene});beats++;}
    blocks.push({t:idx===paras.length-1?'slow':'p',text,scene,claims,draftParagraph:map[idx].draftParagraph});previous=scene;
   }
   const words=paras.join(' ').trim().split(/\s+/u).length,estimatedMinutes=Math.round(words/110+beats*0.05);
   if(lang==='en')check(st.id+'/'+length+' English length band',length==='short'?words>=300&&words<=360:words>=650&&words<=680);
   if(lang==='en')check(st.id+'/'+length+' estimated label',estimatedMinutes===(length==='short'?3:6));
   check(st.id+'/'+lang+'/'+length+' one final landing',blocks.filter(b=>b.t==='slow').length===1&&blocks.at(-1).t==='slow');
   for(const m of paras.join(' ').matchAll(/\u00ab([^\u00bb]+)\u00bb/gu))check(st.id+' pronunciation '+m[1],!!lex[m[1]]?.say&&!!lex[m[1]]?.native?.deva);
   lengths[length]={targetMinutes:length==='short'?3:6,measuredSeconds:null,words,estimatedMinutes:lang==='en'?estimatedMinutes:null,blocks};
  }
  const closeText=sec[3].trim(),bullets=closeText.split('\n').filter(s=>s.startsWith('- '));
  check(st.id+'/'+lang+' question seed and three follow-ups',bullets.length===5);
  const reader=[title,meta[st.id].teases[lang],parentNote,tradition[st.id][lang],...Object.values(lengths).flatMap(x=>x.blocks.map(b=>b.text||'')),closeText].join('\n');
  if(lang!=='en'){
   check(st.id+'/'+lang+' no Latin in reader copy',!/[A-Za-z\u00c0-\u024f\u1e00-\u1eff]/u.test(reader));
   check(st.id+'/'+lang+' no known native regressions',!policy.languages[lang].regressionPhrases.some(p=>reader.includes(p)));
  }
  editions[lang]={status:'draft',language:lang,title,tease:meta[st.id].teases[lang],parentNote,traditionNote:tradition[st.id][lang],lengths,close:{question:bullets[0].slice(2),seed:bullets[1].slice(2),ifTheyAsk:bullets.slice(2).map(s=>s.slice(2))},sourceMap:{scenes:Object.fromEntries([...new Set(Object.values(lengths).flatMap(x=>x.blocks.map(b=>b.scene)))].map(s=>[s,[...new Set(Object.values(lengths).flatMap(x=>x.blocks.filter(b=>b.scene===s).flatMap(b=>b.claims||[])))]]))},review:{languageEditor:{status:'pending',reviewer:null},readAloud:{status:'pending',measuredSeconds:null},sourceParity:{status:'self-audited',humanApproval:'pending'},nativeVoice:{status:'pending-human-review'}},files:{markdown:mdFile,sha256:hash(mdFile)}};
  file('og/'+st.id+'-'+lang+'-candidate.jpg');file('og/'+st.id+'-'+lang+'-candidate.png');
  const imagePath=path.join(B,'og',st.id+'-'+lang+'-candidate.jpg');
  const size=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_streams','-of','json',imagePath],{encoding:'utf8'})).streams[0];
  check(st.id+'/'+lang+' 1200x630 share card',size.width===1200&&size.height===630);
 }
 const hero=file('art/'+st.id+'-candidate.webp');file('art/'+st.id+'-original.png');
 stories.push({...st,...meta[st.id],status:'draft',audience:{minAge:st.minAge,gated:false,sensitivity:meta[st.id].sensitivity},source:{work:st.work,locus:st.locus,stability:st.id==='mudgala-choice'?'variant':null,classificationStatus:st.id==='mudgala-choice'?'variant proposal; human confirmation pending':'named-witness draft; final classification pending',sourceClaims,ledger:sourceText,ledgerFile:sourceFile,checkedDate:'2026-10-08'},media:{hero,alt:meta[st.id].alt,og:Object.fromEntries(batch.languages.map(l=>[l,'og/'+st.id+'-'+l+'-candidate.jpg'])),approval:'pending'},editions});
}
for(const p of ['batch.json','tradition-notes.json','editorial-metadata.json','lexicon-candidates.json','art/prompts.json','evidence/paragraph-scenes.json'])file(p);
const review={schemaVersion:'review-batch-1.0',prepared:'2026-10-08',status:'prepared-for-human-review',languages:batch.languages,stories,lexicon:lex,approvalPolicy:'No publication or production locks until human review. Native languageEditor, measured reading times, art approval and final source classification remain pending.',fingerprints};
fs.writeFileSync(path.join(B,'review-data.json'),JSON.stringify(review,null,2)+'\n');
const validation={checkedOn:'2026-10-08',scope:'Draft batch only; these checks do not constitute native-language or source-editor approval.',passed:checks.length,checks,storyCount:stories.length,editionCount:stories.length*3,renditionCount:stories.length*6,heroCount:5,ogCount:15,pending:['human source/editorial review and recension classification','human native-language editors','full spoken read-aloud and measured native timings','human visual approval','runtime serialization, production validators and locks after approval'],fingerprints};
fs.writeFileSync(path.join(B,'evidence/validation.json'),JSON.stringify(validation,null,2)+'\n');
const payload=JSON.stringify(review).replaceAll('<','\\u003c');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Five new stories - review</title><style>
@font-face{font-family:English;src:url('../../../assets/fonts/GentiumBookPlus-Regular.ttf')}@font-face{font-family:Hindi;src:url('../../../assets/fonts/TiroDevanagariSanskrit-Regular.ttf')}@font-face{font-family:Tamil;src:url('../../../assets/fonts/NotoSerifTamil-Variable.ttf')}
:root{color-scheme:dark;--paper:#f5ecdc;--gold:#ebbb70;--line:#51434b}*{box-sizing:border-box}body{margin:0;background:#17131e;color:var(--paper);font-family:Georgia,serif;line-height:1.7}header,main,footer{max-width:1080px;margin:auto;padding:24px}h1{font-size:clamp(28px,5vw,44px);line-height:1.25;margin:10px 0}h2{font-size:28px;line-height:1.5}h3{line-height:1.5}a{color:var(--gold)}nav{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}button{cursor:pointer;background:#29222e;color:var(--paper);border:1px solid var(--line);padding:10px 14px;border-radius:8px;font-size:16px;line-height:1.5}button[aria-pressed=true]{background:var(--gold);color:#17131e}.badge{font:13px Arial;color:var(--gold);letter-spacing:1px}.notice{padding:14px 18px;background:#2e2430;border-left:3px solid var(--gold);font:15px/1.7 Arial}.hero{width:100%;max-height:550px;object-fit:contain;border-radius:14px;background:#221c27}article{max-width:760px;margin:32px auto}.prose{font-size:23px;line-height:1.9}.hi{font-family:Hindi,serif}.ta{font-family:Tamil,serif}.en{font-family:English,Georgia,serif}.prose p{margin:0 0 20px}.slow{font-weight:bold;border-left:2px solid var(--gold);padding-left:18px}.beat{text-align:center;color:var(--gold);margin:30px 0}.source-tag{display:none;font:11px Arial;color:var(--gold);margin:0 0 3px}.show-maps .source-tag{display:block}details{border:1px solid var(--line);border-radius:8px;padding:14px;margin:16px 0}summary{cursor:pointer;font-size:18px;font-weight:bold}.parent{font-size:20px;line-height:1.9}.source{font:16px/1.8 Arial;overflow-wrap:anywhere}.og{width:100%;border-radius:10px}small{font:13px/1.6 Arial;color:#c6b6b8}.gloss{border-bottom:1px dotted var(--gold)}.toolbar{position:sticky;top:0;background:#17131ef5;padding:10px 0;z-index:2;border-bottom:1px solid var(--line)}.toolbar nav{margin:5px 0}.tease{font-size:22px;color:#d7c4aa}.index{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.index button{text-align:left}.index small{display:block;margin-top:6px}.index button[aria-pressed=true] small{color:#33283d}@media(max-width:600px){header,main,footer{padding:16px}.prose{font-size:21px}.toolbar button{font-size:14px;padding:8px}h2{font-size:24px}}
</style></head><body><header><div class="badge">SANDHYA KATHA / OCTOBER 8 REVIEW</div><h1>Five new stories, three languages</h1><p>Thirty tellings. Five hero illustrations. Fifteen social cards. Select a story, language and length.</p><div class="notice">Prepared drafts for your review. Human native-language approval, spoken timings, final source classification and visual approval are pending. Nothing in this bundle is published.</div><div id="index" class="index"></div></header><main><div class="toolbar"><nav id="languages"></nav><nav id="lengths"></nav><label><input id="maps" type="checkbox"> Show source-claim references</label></div><div id="story"></div></main><footer><p><a href="README.md">Batch handoff</a> · <a href="evidence/EDITORIAL-QA.md">Editorial checks</a> · <a href="evidence/validation.json">Validation evidence</a> · <a href="lexicon-candidates.json">Pronunciation candidates</a> · <a href="review-data.json">Structured review data</a></p></footer><script type="application/json" id="data">${payload}</script><script>
const data=JSON.parse(document.getElementById('data').textContent);let id=data.stories[0].id,lang='en',length='short';const labels=${JSON.stringify(titles)};
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function prose(t){return esc(t).replace(/\u00ab([^\u00bb]+)\u00bb/g,(_,name)=>'<span class="gloss" title="'+esc((data.lexicon[name]?.say||'')+' — '+(data.lexicon[name]?.gloss||''))+'">'+esc(name)+'</span>').replace(/_([^_]+)_/g,'<em>$1</em>');}
function md(t){return t.split('\\n\\n').map(p=>{if(p.startsWith('#'))return '<h3>'+prose(p.replace(/^#+ /,''))+'</h3>';return '<p>'+prose(p).replace(/\\[([^\\]]+)\\]\\((https?:[^)]+)\\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>').replaceAll('\\n','<br>')+'</p>'}).join('');}
function render(){const s=data.stories.find(s=>s.id===id),e=s.editions[lang],r=e.lengths[length];document.documentElement.lang=lang;
 document.getElementById('index').innerHTML=data.stories.map(st=>'<button data-story="'+st.id+'" aria-pressed="'+(id===st.id)+'">'+esc(st.editions.en.title)+'<small>'+esc(st.work+' · age '+st.minAge+'+')+'</small></button>').join('');
 document.getElementById('languages').innerHTML=data.languages.map(l=>'<button data-lang="'+l+'" class="'+l+'" aria-pressed="'+(lang===l)+'">'+labels[l]+'</button>').join('');
 document.getElementById('lengths').innerHTML=['short','full'].map(l=>'<button data-length="'+l+'" aria-pressed="'+(length===l)+'">'+(l==='short'?'Short':'Full')+'</button>').join('');
 document.getElementById('story').innerHTML='<h2 class="'+lang+'">'+esc(e.title)+'</h2><p class="tease '+lang+'">'+esc(e.tease)+'</p><img class="hero" src="'+s.media.hero+'" alt="'+esc(s.media.alt[lang])+'"><details open><summary>For the parent · age '+s.minAge+'+</summary><p class="parent '+lang+'">'+prose(e.parentNote)+'</p></details><article class="prose '+lang+'">'+r.blocks.map(b=>b.t==='beat'?'<div class="beat" aria-label="Pause">· · ·</div>':'<div class="source-tag">'+esc(b.scene+' → '+b.claims.join(', '))+'</div><p class="'+(b.t==='slow'?'slow':'')+'">'+prose(b.text)+'</p>').join('')+'</article><small>'+r.words+' whitespace-delimited words · '+(lang==='en'?'estimated '+r.estimatedMinutes+' minutes':'reading time pending native read-aloud')+' · human approval pending</small><details open><summary>After the story</summary><div class="parent '+lang+'"><p>'+prose(e.close.question)+'</p><p>'+prose(e.close.seed)+'</p>'+e.close.ifTheyAsk.map(q=>'<p>'+prose(q)+'</p>').join('')+'</div></details><details><summary>Exact source, claims and telling boundary</summary><p class="parent '+lang+'">'+prose(e.traditionNote)+'</p><div class="source">'+md(s.source.ledger)+'</div><p><a href="'+s.source.ledgerFile+'">Open source ledger</a></p></details><details><summary>Social card · '+labels[lang]+'</summary><img class="og" src="'+s.media.og[lang]+'" alt="'+esc(e.title)+'"><p><a href="'+s.media.og[lang]+'">Open 1200 × 630 candidate</a></p></details><p><a href="'+e.files.markdown+'">Open editable language draft</a> · <a href="'+s.media.hero+'">Open hero candidate</a></p>';
 document.querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>{id=b.dataset.story;render()});document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;render()});document.querySelectorAll('[data-length]').forEach(b=>b.onclick=()=>{length=b.dataset.length;render()});}
 document.getElementById('maps').onchange=e=>document.body.classList.toggle('show-maps',e.target.checked);render();
</script></body></html>`;
fs.writeFileSync(path.join(B,'review.html'),html);
// A proof sheet is a QA artifact; source JPGs remain unchanged.
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1575">'+stories.flatMap((s,row)=>batch.languages.map((l,col)=>'<image x="'+col*600+'" y="'+row*315+'" width="600" height="315" href="data:image/jpeg;base64,'+fs.readFileSync(path.join(B,s.media.og[l])).toString('base64')+'"/>')).join('')+'</svg>';
fs.writeFileSync(path.join(B,'evidence/og-proof-sheet.png'),new Resvg(svg).render().asPng());
console.log(JSON.stringify({stories:stories.length,editions:15,renditions:30,passed:checks.length,review:path.join(B,'review.html')}));
