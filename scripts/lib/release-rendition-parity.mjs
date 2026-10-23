/** Prospective release gate; full-catalog debt remains visible in the strict audit. */
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {renditionParityErrors} from './rendition-parity.mjs';
import {LEGACY_PARITY_SEALS} from './legacy-parity-seal.mjs';
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const cache=new Map();
function baseline(root){
 if(cache.has(root))return cache.get(root);
 const file=join(root,'content/locale-parity-baseline.json'),entries=existsSync(file)?JSON.parse(readFileSync(file,'utf8')).entries:[];
 if(!Array.isArray(entries))throw Error('Malformed legacy locale parity baseline');
 const map=new Map();
 for(const entry of entries){
  if(!LEGACY_PARITY_SEALS.has(digest(entry)))throw Error('Legacy parity baseline cannot grow or change: '+entry.key);
  if(map.has(entry.key))throw Error('Duplicate legacy parity exception: '+entry.key);
  map.set(entry.key,entry);
 }
 cache.set(root,map);return map;
}
export function legacyParityEntry(root,source,doc){
 const entry=baseline(root).get(`${doc.locale}/${source.id}`);
 return entry&&entry.sourceDigest===digest(source)&&entry.editionDigest===digest(doc)?entry:null;
}
export function releaseRenditionParityErrors(root,source,doc){
 const errors=renditionParityErrors(source,doc),entry=legacyParityEntry(root,source,doc);
 return entry?errors.filter(error=>!entry.errors.includes(error)):errors;
}
export function runtimeRenditionKeys(root,source,doc){
 return Object.keys(legacyParityEntry(root,source,doc)?doc.lengths:source.lengths).sort();
}
