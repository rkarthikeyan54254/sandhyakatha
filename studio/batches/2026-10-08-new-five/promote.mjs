// Historical one-shot serializer; final schema/facet corrections live in production JSON.
// Never rerun against an existing story or use this to re-approve later edits.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const B=path.dirname(fileURLToPath(import.meta.url)), R=path.resolve(B,'../../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(R,p),'utf8'));
const write=(p,d)=>{fs.mkdirSync(path.dirname(path.join(R,p)),{recursive:true});fs.writeFileSync(path.join(R,p),JSON.stringify(d,null,2)+'\n')};
const review=JSON.parse(fs.readFileSync(path.join(B,'review-data.json')));
const approval=JSON.parse(fs.readFileSync(path.join(B,'approval.json')));
if(read('content/canon.json').canon.some(c=>review.stories.some(s=>s.id===c.id))) throw Error('Already promoted: refusing to overwrite existing editions');
for(const [p,sha] of Object.entries(approval.reviewedFiles)) if(createHash('sha256').update(fs.readFileSync(path.join(B,p))).digest('hex')!==sha)throw Error('Reviewed bytes changed: '+p);
const date=approval.date, gate={status:'approved',reviewer:'rama',reviewedOn:date};
const lex=read('content/lexicon.json'), candidates=JSON.parse(fs.readFileSync(path.join(B,'lexicon-candidates.json')));
for(const [k,v] of Object.entries(candidates.entries)){if(lex[k]&&JSON.stringify(lex[k])!==JSON.stringify(v))throw Error('Lexicon conflict '+k);lex[k]=v;}
for(const [k,v] of Object.entries(candidates.existingEntryNativeCandidates))for(const [script,name] of Object.entries(v)){if(lex[k].native[script]&&lex[k].native[script]!==name)throw Error('Native conflict '+k);lex[k].native[script]=name;}
write('content/lexicon.json',lex);
const canon=read('content/canon.json'), media=read('content/media.json'), pub=read('content/locale-public.json'), preview=read('content/locale-previews.json'), social=read('content/social-locales.json');
const witnesses={
 'ribhu-nidagha':['H. H. Wilson, The Vishnu Purana (1840), II.15–16; https://scriptures.redzambala.com/vishnu-purana/vishnu-purana-book-2-chapter-15.html','Sanskrit Viṣṇu Purāṇa II.15–16; https://www.sanskritsahitya.org/vishnupuranam/2.15; https://www.sanskritsahitya.org/vishnupuranam/2.16'],
 'upakosala-fires':['F. Max Müller, The Upanishads, Part I, SBE 1 (1879), Chāndogya IV.10–15, pp.64–68; https://www.globalgreyebooks.com/online-ebooks/friedrich-max-muller_upanishads-part-1_complete-text.html','Ganganatha Jha (1942), Chāndogya with Śaṅkara commentary, IV.10–13, consulted for ka/kha and fire sequence; https://www.wisdomlib.org/hinduism/book/chandogya-upanishad-shankara-bhashya/d/doc1145273.html'],
 'mudgala-choice':['K. M. Ganguli, Mahābhārata, Vana CCLVIII–CCLIX; https://sacred-texts.com/hin/m03/m03258.htm; https://sacred-texts.com/hin/m03/m03259.htm','Sanskrit Mahābhārata 3.247, especially39–45 (materially different ending); https://mahabharata-online.github.io/sanskrit/3/247.html'],
 'tuladhara-scales':['K. M. Ganguli, Mahābhārata, Śānti CCLXI–CCLXII (opening discussion); https://www.wisdomlib.org/hinduism/book/the-mahabharata-mohan/d/doc826219.html; https://www.wisdomlib.org/hinduism/book/the-mahabharata-mohan/d/doc826220.html','Sanskrit Mahābhārata12.253.23–55 and12.254.6–46; https://mahabharata-online.github.io/sanskrit/12/253.html; https://mahabharata-online.github.io/sanskrit/12/254.html'],
 'gargi-questions':['F. Max Müller, The Upanishads, Part II, SBE15 (1884), BṛhadāraṇyakaIII.8.1–12; https://tianmu.org/good-work-library/hindu/general-texts/the-upanishads-part-ii-max-muller','Bṛhadāraṇyaka Kāṇva text III.8; https://sanskritdocuments.org/doc_upanishhat/bribasic.html','TITUS-derived Mādhyandina/Kāṇva comparison (Weber editions), III.8, PDF pp.47–51; https://sanskritdocuments.org/doc_upanishhat/bri.pdf']
};
const notes={
 'ribhu-nidagha':"Viṣṇu Purāṇa II.15–16, following Wilson (1840), checked against the Sanskrit. These are the two visits, not the later Ṛbhu Gītā. The selected events agree in the witnesses checked; a complete manuscript collation is not claimed.",
 'upakosala-fires':"Chāndogya Upaniṣad4.10–15, following Müller (1879), with Jha's Śaṅkara commentary consulted for joy/space. The teacher's reason for initially leaving is not stated in the base passage. Commentary is not turned into a narrated motive.",
 'mudgala-choice':"We follow Ganguli, Vana258–259: the messenger describes Viṣṇu's supreme abode and Mudgala continues gleaning before liberation. Checked Sanskrit3.247 has a shorter ending and says he gives up gleaning. These tellings remain separate.",
 'tuladhara-scales':"The opening dialogue in Ganguli's Mahābhārata, Śānti261–262, compared with Sanskrit12.253–254. The ritual debate and birds' later testimony continue beyond this telling; a completed transformation for Jājali is not invented.",
 'gargi-questions':"We follow Müller's Kāṇva-based Bṛhadāraṇyaka3.8. Mādhyandina3.8.1 adds Gārgī's warning that Yājñavalkya's head will fall if he cannot answer; Kāṇva omits it. Both retain the two questions. His earlier warning to her in3.6 remains in the parent material."
};
const extra={hi:'यह कथन मूल काण्व पाठ और म्यूलर के अनुवाद के अनुसार है। माध्यंदिन पाठ में इसी संवाद की शुरुआत में गार्गी कहती हैं कि उत्तर न देने पर याज्ञवल्क्य का सिर गिर जाएगा; काण्व पाठ में यह वाक्य नहीं है। दोनों पाठों में दो प्रश्न हैं।',ta:'இக்கதை காண்வ மூலப்பாடத்தையும் முல்லரின் மொழிபெயர்ப்பையும் பின்பற்றுகிறது. மாத்யந்தினப் பாடத்தில் இந்த உரையாடலின் தொடக்கத்திலேயே, பதில் சொல்லாவிட்டால் யாஜ்ஞவல்கியரின் தலை விழும் என்று கார்கி கூறுகிறார். காண்வப் பாடத்தில் அந்த வாக்கியம் இல்லை. இரு பாடங்களிலும் இரண்டு கேள்விகள் உள்ளன.'};
const cleanParent=(t,lang)=>lang==='en'?t.replace(/^Draft;.*?pending\.\s*/,''):lang==='hi'?t.replace(/^.*?बाकी है।\s*/,''):t.replace(/^.*?நிலுவையில் உள்ளன\.\s*/,'');
const cleanClose=(c,lang)=>{
 const trim=t=>t.replace(lang==='en'?/^(?:Open question|Seed, only if needed):\s*/:lang==='hi'?/^(?:खुला प्रश्न|बीज-वाक्य|ज़रूरत हो तभी संकेत):\s*/:/^(?:திறந்த கேள்வி|தேவைப்பட்டால் ஒரு வரி|தேவைப்பட்டால் மட்டும் ஒரு தொடக்கம்):\s*/,'');
 return {question:trim(c.question),seed:trim(c.seed),ifTheyAsk:c.ifTheyAsk.map(t=>{let m;if(lang==='en')m=t.match(/^If they ask, [“‘](.*?)[”’]:\s*([\s\S]*)$/);if(lang==='hi')m=t.match(/^बच्चा पूछे, [“‘](.*?)[”’]:\s*([\s\S]*)$/);if(lang==='ta')m=t.match(/^[“‘](.*?)[”’] என்று கேட்டால்:\s*([\s\S]*)$/);if(!m)throw Error('Follow-up parse '+t);return {q:m[1],a:m[2]};})};
};
// Replace only complete native word forms. Inflected forms stay literally as reviewed.
const mark=(t,names)=>{for(const [key,native] of Object.entries(names).sort((a,b)=>b[1].length-a[1].length)){const escaped=native.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');t=t.replace(new RegExp('(?<![\\p{L}\\p{M}«])'+escaped+'(?![\\p{L}\\p{M}»])','gu'),'«'+key+'»');}return t;};
let n=Math.max(...canon.canon.map(c=>c.n));
for(const s of review.stories){
 const e=s.editions.en, corpus=s.id==='ribhu-nidagha'?'vishnu-purana':s.corpus;
 const stability=['mudgala-choice','gargi-questions'].includes(s.id)?'variant':'stable';
 const source={corpus,tradition:'sanskrit',work:s.work.replace(' · Vana','').replace(' · Śānti',''),locus:s.locus,stability,traditionNote:notes[s.id],checkedAgainst:witnesses[s.id],sourcing:Object.entries(s.source.sourceClaims).map(([claimId,claim])=>({claim,locus:s.work+' '+s.locus+' · '+claimId})),reviewedBy:'rama',reviewedOn:date};
 if(stability==='variant')source.variants=[s.id==='mudgala-choice'?{differs:'Messenger’s final teaching and whether gleaning continues',tellings:'Ganguli includes the supreme Viṣṇu abode and continued gleaning; checked Sanskrit3.247.39–45 is shorter and says gleaning is given up.',weTell:'Ganguli Vana258–259 consistently in all three languages.'}:{differs:'Gārgī’s opening warning and extent of the negation list',tellings:'Mādhyandina3.8.1 includes her head-fall warning; Kāṇva omits it.3.8.8 has a longer Mādhyandina negation list.',weTell:'The Kāṇva-based Müller witness; no added warning in the spoken lane.'}];
 const text=Object.values(e.lengths).flatMap(r=>r.blocks.map(b=>b.text||'')).join(' ');
 const characters=[...new Set([...text.matchAll(/«([^»]+)»/g)].map(m=>m[1]))].filter(k=>['person','being'].includes(lex[k]?.kind)).map((ref,i)=>({ref,role:i<2?'lead':'mentioned'}));
 const sensitivities={'ribhu-nidagha':[],'upakosala-fires':['death'],'mudgala-choice':[],'tuladhara-scales':['violence','social-hierarchy'],'gargi-questions':['death']}[s.id];
 const doc={id:s.id,schemaVersion:'1.0',status:'published',version:1,updated:date,title:e.title,tease:e.tease,source,audience:{minAge:s.minAge,gated:false,sensitivity:sensitivities,careNote:cleanParent(e.parentNote,'en')},values:s.values,themes:s.themes,calendar:{festivals:[],weight:5},characters,lengths:Object.fromEntries(Object.entries(e.lengths).map(([l,r])=>[l,{minutes:r.targetMinutes,words:r.words,blocks:r.blocks.map(b=>b.t==='beat'?{t:'beat'}:{t:b.t,text:b.text.replace(/[“”]/g,'"')})}])),close:cleanClose(e.close,'en')};
 write('content/stories/'+s.id+'.json',doc);
 const bytes=fs.readFileSync(path.join(R,'content/stories/'+s.id+'.json'));const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 const existing=canon.canon.find(c=>c.id===s.id);if(existing)throw Error('ID already promoted '+s.id);
 canon.canon.push({n:++n,id:s.id,title:doc.title,corpus,tradition:'sanskrit',work:source.work,locus:s.locus,stability,minAge:s.minAge,sensitivity:sensitivities,value:s.values[0],hook:e.tease,festivals:[],status:'published',wave:5,gated:false});
 const hero='/media/stories/'+s.id+'/hero.webp';fs.mkdirSync(path.join(R,'public/media/stories',s.id),{recursive:true});fs.copyFileSync(path.join(B,s.media.hero),path.join(R,'public',hero));
 media.stories[s.id]={canonStatus:'published',storyVersion:1,image:{status:'approved',type:'illustration',file:hero,reviewedBy:'rama',reviewedOn:date},voiceover:{en:{status:'not_started',file:null}}};
 fs.copyFileSync(path.join(B,s.media.og.en),path.join(R,'public/og',s.id+'.jpg'));
 const keys=[...new Set([...text.matchAll(/«([^»]+)»/g)].map(m=>m[1]))];
 for(const lang of ['hi','ta']){
  const ed=s.editions[lang], locale=lang+'-IN', names=Object.fromEntries(keys.filter(k=>lex[k]?.native?.[lang==='hi'?'deva':'taml']).map(k=>[k,lex[k].native[lang==='hi'?'deva':'taml']]));
  const indexes=Object.fromEntries(s.claims.map((c,i)=>[c,i]));const refs=cs=>[...new Set(cs.map(c=>indexes[c]))];
  const scenes=Object.fromEntries(Object.entries(ed.sourceMap.scenes).map(([k,v])=>[k,refs(v)]));
  const all=s.claims.map((_,i)=>i);
  const close=cleanClose(ed.close,lang);
  const loc={schemaVersion:'1.0',storyId:s.id,sourceVersion:1,sourceBlobSha1:blob,status:'approved',locale,language:lang,register:lang==='hi'?'सहज, आत्मीय हिन्दी; परिवार में पढ़कर सुनाने की भाषा।':'குடும்பத்தில் இயல்பாக வாசித்துச் சொல்ல ஏற்ற தமிழ் நடை.',title:ed.title,tease:ed.tease,displayNames:names,sourceMap:{tease:all,scenes,parentNote:all,traditionNote:all,ifTheyAsk:close.ifTheyAsk.map(()=>all)},lengths:Object.fromEntries(Object.entries(ed.lengths).map(([l,r])=>[l,{measuredSeconds:approval.measuredSeconds[l],blocks:r.blocks.map(b=>b.t==='beat'?{t:'beat',scene:b.scene}:{t:b.t,scene:b.scene,text:mark(b.text,names)})}])),parentNote:cleanParent(ed.parentNote,lang),traditionNote:s.id==='gargi-questions'?extra[lang]+' '+ed.traditionNote:ed.traditionNote,close,review:{nativeReadAloud:{short:{...gate},full:{...gate}},languageEditor:{...gate},sourceFidelity:{...gate}}};
  write('content/locales/'+lang+'/'+s.id+'.json',loc);pub.editions.push({storyId:s.id,locale});
  const blocks=loc.lengths.short.blocks.flatMap((b,i)=>b.t==='p'?[i]:[]);const selected=[...new Set([blocks[0],blocks[Math.floor(blocks.length/4)],blocks[Math.floor(blocks.length/2)],blocks[Math.floor(blocks.length*3/4)],blocks.at(-1)])];
  social.locales[locale].stories[s.id]={hook:{from:'tease',mode:'firstSentence'},blocks:selected.map(index=>({index,mode:'firstSentence'}))};
  fs.copyFileSync(path.join(B,s.media.og[lang]),path.join(R,'public/og',s.id+'-'+lang+'.jpg'));
 }
 preview.previews.push({storyId:s.id,defaultLocale:'hi-IN',locales:['hi-IN','ta-IN']});
}
write('content/canon.json',canon);write('content/media.json',media);write('content/locale-public.json',pub);write('content/locale-previews.json',preview);write('content/social-locales.json',social);
console.log('Promoted five approved packages; next run locks and gates.');
