import {describe,it,expect} from 'vitest';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {releaseRenditionParityErrors,runtimeRenditionKeys} from '../scripts/lib/release-rendition-parity.mjs';
import {renditionParityErrors} from '../scripts/lib/rendition-parity.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const baseline=read('content/locale-parity-baseline.json'),entry=baseline.entries[0];
const [locale,id]=entry.key.split('/'),lang=locale.split('-')[0];
const source=read(`content/stories/${id}.json`),edition=read(`content/locales/${lang}/${id}.json`);
function fixture(entries){const root=fs.mkdtempSync(path.join(os.tmpdir(),'sk-release-baseline-'));fs.mkdirSync(path.join(root,'content'));fs.writeFileSync(path.join(root,'content/locale-parity-baseline.json'),JSON.stringify({entries}));return root;}
describe('sealed legacy parity release scope',()=>{
 it('allows only the exact existing findings and keeps the strict audit red',()=>{
  const root=fixture([entry]);try{expect(renditionParityErrors(source,edition).length).toBeGreaterThan(0);expect(releaseRenditionParityErrors(root,source,edition)).toEqual([]);expect(runtimeRenditionKeys(root,source,edition)).toEqual(Object.keys(edition.lengths).sort());}finally{fs.rmSync(root,{recursive:true});}
 });
 it('requires full parity after either canonical or locale content changes',()=>{
  const root=fixture([entry]);try{
   expect(releaseRenditionParityErrors(root,{...source,title:source.title+' revised'},edition).length).toBeGreaterThan(0);
   expect(releaseRenditionParityErrors(root,source,{...edition,title:edition.title+' revised'}).length).toBeGreaterThan(0);
  }finally{fs.rmSync(root,{recursive:true});}
 });
 it('never exempts a new story or removed review approval',()=>{
  const root=fixture([entry]);try{
   expect(releaseRenditionParityErrors(root,{...source,id:'new-story'},{...edition,storyId:'new-story'}).length).toBeGreaterThan(0);
   const d=structuredClone(edition);d.review.nativeReadAloud.short.status='pending';
   expect(releaseRenditionParityErrors(root,source,d).join('\n')).toContain('human approval');
  }finally{fs.rmSync(root,{recursive:true});}
 });
 it('rejects expanded/rebound exceptions but allows the baseline to shrink',()=>{
  const forged=fixture([{...entry,key:locale+'/new-story'}]);try{expect(()=>releaseRenditionParityErrors(forged,source,edition)).toThrow('cannot grow or change');}finally{fs.rmSync(forged,{recursive:true});}
  const shrunk=fixture([]);try{expect(releaseRenditionParityErrors(shrunk,source,edition)).toEqual(renditionParityErrors(source,edition));}finally{fs.rmSync(shrunk,{recursive:true});}
 });
});
