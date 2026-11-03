import fs from 'node:fs';import react from '@vitejs/plugin-react';import {createServer} from 'vite';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const root=new URL('../../../',import.meta.url),base=new URL('.',import.meta.url);
const vite=await createServer({configFile:false,plugins:[react()],root:root.pathname,server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,entries:[]},appType:'custom'});
try{
 const {default:Reader}=await vite.ssrLoadModule('/src/ui/Reader.tsx');
 const {localeUi}=await vite.ssrLoadModule('/src/lib/app-locale.ts');
 const lex=JSON.parse(fs.readFileSync(new URL('content/lexicon.json',root),'utf8'));
 for(const id of ['rambha-sevenfold-curse','vedavati-hair-and-vow'])for(const lang of ['en','hi','ta'])for(const length of ['short','full']){
  const file=lang==='en'?`dist/data/s/${id}.json`:`dist/data/l/${lang}/${id}.json`;
  const story=JSON.parse(fs.readFileSync(new URL(file,root),'utf8'));
  const markup=renderToStaticMarkup(React.createElement(Reader,{story,lex,len:length,locale:lang==='en'?'en':`${lang}-IN`,next:null,hasProfile:true,backLabel:localeUi(lang==='en'?'en':`${lang}-IN`).shelfTab,onBack:()=>{},onHeard:()=>{},onRead:()=>{},onPersonalize:()=>{}}));
  const css=fs.readFileSync(new URL('src/styles.css',root),'utf8');
  const html=`<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Local reader QA</title><link rel="stylesheet" href="/design-tokens.css"><link rel="stylesheet" href="/story-media.css"><link href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Noto+Serif+Tamil:wght@400;600&family=Tiro+Devanagari+Sanskrit&display=swap" rel="stylesheet"><style>${css}</style><div class="app" data-locale="${lang==='en'?'en-IN':lang+'-IN'}"><main id="main">${markup}</main></div></html>`;
  fs.writeFileSync(new URL(`dist/qa-${id}-${lang}-${length}.html`,root),html);
 }
 console.log('Twelve QA-only real Reader SSR pages rendered; remove dist/qa-* before deployment.');
}finally{await vite.close();}
