// One-shot approved package registration. Never rerun preparation over approval.
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {gitBlobSha1} from '../../../scripts/lib/locale-content.mjs';
const batch=new URL('.',import.meta.url),root=new URL('../../../',batch);
const read=(p,b=root)=>JSON.parse(fs.readFileSync(new URL(p,b),'utf8'));
const write=(p,d)=>fs.writeFileSync(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const id='ravana-last-rites',approval=read('approval.json',batch),date=approval.date;
const canon=read('content/canon.json');if(canon.canon.some(c=>c.id===id))throw Error('Already registered; refusing overwrite');
for(const [path,sha] of Object.entries(approval.reviewedFiles))if(createHash('sha256').update(fs.readFileSync(new URL(path,batch))).digest('hex')!==sha)throw Error('Approved file changed '+path);
const lex=read('content/lexicon.json');for(const [key,value] of Object.entries(read('lexicon-candidates.json',batch).entries)){if(lex[key])throw Error('Lexicon conflict '+key);lex[key]=value;}
write('content/lexicon.json',lex);
const doc=read(`en/${id}.json`,batch);doc.status='published';doc.values=['stopping when you have won'];doc.source.reviewedBy=approval.reviewer;doc.source.reviewedOn=date;
write(`content/stories/${id}.json`,doc);
const blob=gitBlobSha1(fs.readFileSync(new URL(`content/stories/${id}.json`,root),'utf8'));
canon.canon.push({n:Math.max(...canon.canon.map(c=>c.n))+1,id,title:doc.title,corpus:doc.source.corpus,tradition:doc.source.tradition,work:doc.source.work,locus:doc.source.locus,stability:doc.source.stability,minAge:doc.audience.minAge,sensitivity:doc.audience.sensitivity,value:doc.values[0],hook:doc.tease,festivals:[],status:'published',wave:5,gated:false});
write('content/canon.json',canon);
const media=read('content/media.json'),pub=read('content/locale-public.json'),preview=read('content/locale-previews.json'),social=read('content/social-locales.json');
const hero=`/media/stories/${id}/hero.webp`;fs.mkdirSync(new URL(`public/media/stories/${id}/`,root),{recursive:true});fs.copyFileSync(new URL('art/hero.webp',batch),new URL('public'+hero,root));
media.stories[id]={canonStatus:'published',storyVersion:1,image:{status:'approved',type:'illustration',file:hero,reviewedBy:approval.reviewer,reviewedOn:date},voiceover:{en:{status:'not_started',file:null}}};
const gate={status:'approved',reviewer:approval.reviewer,reviewedOn:date};
for(const lang of ['hi','ta']){
 const d=read(`locales/${lang}/${id}.json`,batch);d.status='approved';d.sourceBlobSha1=blob;
 for(const [length,seconds] of Object.entries(approval.measuredSeconds)){d.lengths[length].measuredSeconds=seconds;d.review.nativeReadAloud[length]={...gate};}
 d.review.languageEditor={...gate};d.review.sourceFidelity={...gate};
 write(`content/locales/${lang}/${id}.json`,d);pub.editions.push({storyId:id,locale:d.locale});
 const indexes=d.lengths.short.blocks.flatMap((b,i)=>b.t==='p'?[i]:[]),selected=[indexes[0],indexes[Math.floor(indexes.length/4)],indexes[Math.floor(indexes.length/2)],indexes[Math.floor(indexes.length*3/4)],indexes.at(-1)];
 social.locales[d.locale].stories[id]={hook:{from:'tease',mode:'firstSentence'},blocks:[...new Set(selected)].map(index=>({index,mode:'firstSentence'}))};
}
preview.previews.push({storyId:id,defaultLocale:'hi-IN',locales:['hi-IN','ta-IN']});
for(const lang of ['en','hi','ta'])fs.copyFileSync(new URL(`og/${id}-${lang}.jpg`,batch),new URL(`public/og/${id}${lang==='en'?'':'-'+lang}.jpg`,root));
for(const [path,d] of [['content/media.json',media],['content/locale-public.json',pub],['content/locale-previews.json',preview],['content/social-locales.json',social]])write(path,d);
console.log('Approved new story registered locally in all three languages; release gates and deployment still required.');
