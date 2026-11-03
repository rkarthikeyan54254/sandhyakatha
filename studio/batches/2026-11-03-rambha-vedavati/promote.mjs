import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gitBlobSha1} from '../../../scripts/lib/locale-content.mjs';
const batch=new URL('.',import.meta.url),root=new URL('../../../',batch);
const read=(p,b=root)=>JSON.parse(fs.readFileSync(new URL(p,b),'utf8'));
const write=(p,d,b=root)=>fs.writeFileSync(new URL(p,b),JSON.stringify(d,null,2)+'\n');
const a=read('approval.json',batch),ids=['rambha-sevenfold-curse','vedavati-hair-and-vow'];
if(!['text-approved-awaiting-generated-art','text-approved-assets-generated'].includes(a.status)||a.reviewer!=='rama')throw Error('Missing user text approval');
for(const [p,hash] of Object.entries(a.reviewedFiles))if(createHash('sha256').update(fs.readFileSync(new URL(p,batch))).digest('hex')!==hash)throw Error('Reviewed file changed: '+p);
const canon=read('content/canon.json'),lex=read('content/lexicon.json'),media=read('content/media.json');
for(const id of ids){if(canon.canon.some(c=>c.id===id)||fs.existsSync(new URL(`content/stories/${id}.json`,root)))throw Error('Refusing overwrite '+id);}
const gate={status:'approved',reviewer:a.reviewer,reviewedOn:a.date};
const framing=read('parent-framing.json',batch);
// Preflight every input before writes. Artwork review is performed by the agent,
// under the user's instruction to generate matching art and publish afterward.
for(const id of ids){for(const asset of [`art/${id}/hero.webp`,...['en','hi','ta'].map(l=>`og/${id}-${l}.jpg`)])if(!fs.existsSync(new URL(asset,batch)))throw Error('Missing '+asset);}
for(const[key,entry]of Object.entries(read('lexicon-candidates.json',batch).entries)){
 if(lex[key])throw Error('Lexicon conflict '+key);
 const e=structuredClone(entry);e.native.taml=e.native.tamil;delete e.native.tamil;
 if(key==='Himālayas')e.gloss='The Himalayan mountain region where Vedavatī performs tapas.';
 if(key==='Kuśadhvaja')e.gloss='Vedavatī’s father, the sage described in Uttara Kāṇḍa 17.';
 lex[key]=e;
}
write('content/lexicon.json',lex);
const transformations=[];
for(const id of ids){
 const d=read(`en/${id}.json`,batch);d.source.work='Vālmīki Rāmāyaṇa';d.status='published';d.source.reviewedBy=a.reviewer;d.source.reviewedOn=a.date;
 // Carry the exact approved parent-only review framing into the reader as an
 // aside, excluded from speech and word-count timing. No narrated text changes.
 for(const r of Object.values(d.lengths))r.blocks.splice(1,0,{t:'aside',text:framing.en[id].text});
 write(`content/stories/${id}.json`,d);
 const pin=gitBlobSha1(fs.readFileSync(new URL(`content/stories/${id}.json`,root),'utf8'));
 canon.canon.push({n:Math.max(...canon.canon.map(c=>c.n))+1,id,title:d.title,corpus:d.source.corpus,tradition:d.source.tradition,work:d.source.work,locus:d.source.locus,stability:d.source.stability,minAge:d.audience.minAge,sensitivity:d.audience.sensitivity,value:d.values[0],hook:d.tease,festivals:[],status:'published',wave:5,gated:true});
 const hero=`/media/stories/${id}/hero.webp`;fs.mkdirSync(new URL(`public/media/stories/${id}/`,root),{recursive:true});fs.copyFileSync(new URL(`art/${id}/hero.webp`,batch),new URL('public'+hero,root));
 media.stories[id]={canonStatus:'published',storyVersion:d.version,image:{status:'approved',type:'illustration',file:hero,reviewedBy:'codex-art-review',reviewedOn:a.date},voiceover:{en:{status:'not_started',file:null}}};
 for(const lang of ['hi','ta']){
  const l=read(`locales/${lang}/${id}.json`,batch);l.status='approved';l.sourceBlobSha1=pin;
  for(const[length,r]of Object.entries(l.lengths)){
   r.measuredSeconds=a.measuredSeconds[length];l.review.nativeReadAloud[length]={...gate};
   const scene=`${length}-parent-framing`;
   r.blocks.splice(1,0,{t:'aside',scene,text:framing[lang][id].text});l.sourceMap.scenes[scene]=id.startsWith('rambha')?[2,3,4,5]:[3,4,5];
  }
  l.review.languageEditor={...gate};l.review.sourceFidelity={...gate};write(`content/locales/${lang}/${id}.json`,l);
 }
 for(const lang of ['en','hi','ta'])fs.copyFileSync(new URL(`og/${id}-${lang}.jpg`,batch),new URL(`public/og/${id}${lang==='en'?'':'-'+lang}.jpg`,root));
 transformations.push({id,narration:'unchanged',parentFraming:'Exact reviewed text moved into aside in each rendition; not spoken.',reviewMetadata:'User approval and whole-minute reported durations',sourcePin:pin,gating:'gated=true; no public/archive/preview registrations; runtime editions auto-discovered'});
}
write('content/canon.json',canon);write('content/media.json',media);
write('promotion-record.json',{date:a.date,status:'registered-locally-not-deployed',transformations,artReview:{reviewer:'codex-art-review',basis:'User authorized style-matched generation followed by publication. Agent inspected both outputs against two existing site references: no nudity, graphic assault, fire death, textual errors or hand/face defects apparent. Not represented as a human image approval.',userImageApproval:false}},batch);
console.log('Registered both approved stories and four locale editions; parental gating preserved. Run locks, all gates and build before deployment.');
