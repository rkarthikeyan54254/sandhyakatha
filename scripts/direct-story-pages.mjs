import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('..',import.meta.url).pathname;
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const catalog={schemaVersion:'1.0',stories:{}};
const cards=read('public/data/index.json').stories;
const native=read('public/data/locale-catalog.json').locales;
const config=read('content/direct-story-links.json');
if(config.schemaVersion!=='1.0'||new Set(config.storyIds).size!==config.storyIds.length)throw Error('Invalid direct-link allowlist');
for(const id of config.storyIds){
 const card=cards.find(c=>c.id===id&&c.gated);if(!card)throw Error('Direct link must name a published gated story: '+id);
 const editions={};
 for(const lang of ['en','hi','ta']){
  const source=read(`public/data/${lang==='en'?'s':`l/${lang}`}/${card.id}.json`);
  if(source.status!=='published'||!source.audience?.gated||!source.audience.careNote)throw Error('Invalid direct entry '+card.id+'/'+lang);
  const revision=lang==='en'?card.storyRevision:native[`${lang}-IN`].stories.find(s=>s.id===card.id)?.storyRevision;
  if(!revision)throw Error('Missing current runtime revision '+card.id+'/'+lang);
  editions[lang]={title:source.title,tease:source.tease,minAge:source.audience.minAge,careNote:source.audience.careNote,...(source.hero?{hero:source.hero}:{}),href:`/read/${card.id}/${lang==='en'?'':lang+'/'}`,runtimePath:`/data/${lang==='en'?'s':`l/${lang}`}/${card.id}.json?v=${revision}`};
 }
 catalog.stories[card.id]=editions;
}
writeFileSync(join(root,'public/data/direct-stories.json'),JSON.stringify(catalog));
if(process.argv.includes('--catalog')){console.log('Direct-story catalog: '+Object.keys(catalog.stories).length+' parent-gated stories; metadata only.');process.exit(0);}
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const shell=readFileSync(join(root,'dist/index.html'),'utf8');
let count=0;
for(const[id,editions]of Object.entries(catalog.stories))for(const[lang,e]of Object.entries(editions)){
 const url='https://sandhyakatha.com'+e.href;
 const card=`/og/${id}${lang==='en'?'':'-'+lang}.jpg`;
 if(!existsSync(join(root,'dist',card)))throw Error('Missing direct share card '+card);
 let html=shell.replace(/<html lang="[^"]*"/,`<html lang="${lang}"`)
  .replace(/<title>[^<]*<\/title>/,`<title>${esc(e.title)} | Sandhya Katha</title>`)
  .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${esc(e.tease)}">`)
  .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${url}">`)
  .replace(/<link rel="alternate"[^>]*>/g,'')
  .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${esc(e.title)}">`)
  .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${esc(e.tease)}">`)
  .replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${url}">`)
  .replace(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="https://sandhyakatha.com${card}">`)
  .replace(/<meta property="og:image:(?:width|height|type)"[^>]*>/g,'')
  .replace(/<meta name="twitter:title"[^>]*>/,`<meta name="twitter:title" content="${esc(e.title)}">`)
  .replace(/<meta name="twitter:description"[^>]*>/,`<meta name="twitter:description" content="${esc(e.tease)}">`)
  .replace(/<meta name="twitter:image"[^>]*>/,`<meta name="twitter:image" content="https://sandhyakatha.com${card}">`);
 // The homepage shell includes discovery content for crawlers. None belongs on
 // a gated story link: only metadata is served before explicit parent consent.
 html=html.replace(/<div id="root">[\s\S]*?<\/div>/, '<div id="root"></div>');
 html=html.replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
 html=html.replace('</head>',`<meta name="robots" content="noindex,nofollow"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">${Object.values(editions).map(a=>`<link rel="alternate" hreflang="${a===editions.en?'en':a===editions.hi?'hi':'ta'}" href="https://sandhyakatha.com${a.href}">`).join('')}</head>`);
 const dir=join(root,'dist',e.href);mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'index.html'),html);count++;
}
writeFileSync(join(root,'dist/data/direct-stories.json'),JSON.stringify(catalog));
console.log(`Direct story pages: ${count} noindex, parent-opt-in entries, using the shared Reader.`);
