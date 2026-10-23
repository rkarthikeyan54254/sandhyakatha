import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {Resvg} from '@resvg/resvg-js';
const batch=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(batch,'../../..');
const font={fontDirs:[path.join(root,'assets/fonts')],loadSystemFonts:false};
const e=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const widths=new Map();
function width(s,family,size){
 const key=family+'/'+size+'/'+s;if(widths.has(key))return widths.get(key);
 const r=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200"><text x="0" y="100" font-family="${family}" font-size="${size}">${e(s)}</text></svg>`,{font});
 const w=r.innerBBox()?.width||0;widths.set(key,w);return w;
}
function text(s,x,y,family,size,fill,lang){
 if(lang==='en')return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}">${e(s)}</text>`;
 // Explicit word positions preserve visible spaces when resvg shapes Indic text.
 let cursor=x;return s.split(/\s+/u).map(word=>{const out=`<text x="${cursor}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}">${e(word)}</text>`;cursor+=width(word,family,size)+size*0.3;return out;}).join('');
}
function lines(s,family,size,lang){
 let result=[],line=[],used=0;const gap=size*0.3;
 for(const word of s.split(/\s+/u)){const w=width(word,family,size);if(used+w+(line.length?gap:0)>510&&line.length){result.push(line.join(' '));line=[];used=0;}line.push(word);used+=w+(line.length>1?gap:0);}
 if(line.length)result.push(line.join(' '));return result;
}

fs.mkdirSync(path.join(batch,'og'),{recursive:true});
const original=path.join(batch,'art/hero.png');
execFileSync('python3',['-c', 'from PIL import Image; import sys; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=88)',original,path.join(batch,'art/hero.webp')]);
const uri='data:image/png;base64,'+fs.readFileSync(original).toString('base64');
for(const lang of ['en','hi','ta']){
 const doc=JSON.parse(fs.readFileSync(path.join(batch,lang==='en'?'en/ravana-last-rites.json':`locales/${lang}/ravana-last-rites.json`)));
 const family=lang==='hi'?'Tiro Devanagari Sanskrit':lang==='ta'?'Noto Serif Tamil':'Gentium Book Plus';
 const size=lang==='ta'?32:lang==='hi'?40:43,wrapped=lines(doc.title,family,size,lang);
 if(wrapped.length>5)throw Error('Title overflow '+lang);
 const source={en:'Vālmīki Rāmāyaṇa',hi:'वाल्मीकि रामायण',ta:'வால்மீகி ராமாயணம்'}[lang];
 const label={en:'READ TOGETHER',hi:'साथ बैठकर सुनाएँ',ta:'சேர்ந்து வாசிக்கலாம்'}[lang];
 const duration={en:'Short · 3 min / Full · 6 min',hi:'छोटी · ३ मिनट / पूरी · ६ मिनट',ta:'சுருக்கம் · ௩ நிமி / முழுவதும் · ௬ நிமி'}[lang];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#17131e"/><image href="${uri}" x="20" y="70" width="560" height="420" preserveAspectRatio="xMidYMid meet"/>${text('SANDHYA KATHA',40,560,'Karla',22,'#ebbb70','en')}${text(label,620,85,family,lang==='ta'?18:22,'#ebbb70',lang)}${wrapped.map((l,i)=>text(l,620,185+i*(size+22),family,size,'#f5ecdc',lang)).join('')}<line x1="620" x2="1150" y1="510" y2="510" stroke="#725c52"/>${text(source,620,550,family,lang==='ta'?19:22,'#d6c2a9',lang)}${text(duration,620,585,family,lang==='ta'?16:20,'#d6c2a9',lang)}</svg>`;
 const out=path.join(batch,'og',`ravana-last-rites-${lang}.png`);
 fs.writeFileSync(out,new Resvg(svg,{font}).render().asPng());
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',out,'-frames:v','1','-q:v','3',out.replace('.png','.jpg')]);
}
console.log('Hero WebP and three native share cards generated.');
