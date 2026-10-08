import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {Resvg} from '@resvg/resvg-js';
const batch=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(batch,'../../..');
const data=JSON.parse(fs.readFileSync(path.join(batch,'batch.json')));
const font={fontDirs:[path.join(root,'assets/fonts')],loadSystemFonts:false};
const e=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const labels={en:'READ TOGETHER',hi:'\u0938\u093e\u0925 \u092c\u0948\u0920\u0915\u0930 \u0938\u0941\u0928\u093e\u090f\u0901',ta:'\u0b9a\u0bc7\u0bb0\u0bcd\u0ba8\u0bcd\u0ba4\u0bc1 \u0bb5\u0bbe\u0b9a\u0bbf\u0b95\u0bcd\u0b95\u0bb2\u0bbe\u0bae\u0bcd'};
const sourceNames={
 'Viṣṇu Purāṇa':{hi:'विष्णु पुराण',ta:'விஷ்ணு புராணம்'},
 'Chāndogya Upaniṣad':{hi:'छांदोग्य उपनिषद्',ta:'சாந்தோக்ய உபநிஷத்'},
 'Mahābhārata · Vana':{hi:'महाभारत · वनपर्व',ta:'மகாபாரதம் · வன பருவம்'},
 'Mahābhārata · Śānti':{hi:'महाभारत · शांतिपर्व',ta:'மகாபாரதம் · சாந்தி பருவம்'},
 'Bṛhadāraṇyaka Upaniṣad':{hi:'बृहदारण्यक उपनिषद्',ta:'பிருஹதாரண்யக உபநிஷத்'}
};
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
for(const st of data.stories.filter(s=>!process.argv[2]||s.id===process.argv[2])){
 const art=path.join(batch,'art',st.id+'-original.png');if(!fs.existsSync(art))continue;
 const uri='data:image/png;base64,'+fs.readFileSync(art).toString('base64');
 for(const lang of data.languages){
  const md=fs.readFileSync(path.join(batch,lang==='en'?'en':'locales/'+lang,st.id+'.md'),'utf8');
  const title=md.split('\n')[0].replace(/^# /,'').replace(/ — English.*$/,'');
  const family=lang==='hi'?'Tiro Devanagari Sanskrit':lang==='ta'?'Noto Serif Tamil':'Gentium Book Plus';
  const size=lang==='ta'?32:lang==='hi'?40:43,wrapped=lines(title,family,size,lang);
  if(wrapped.length>5)throw new Error('OG title overflow '+st.id+'/'+lang);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#17131e"/><image href="${uri}" x="20" y="70" width="560" height="420" preserveAspectRatio="xMidYMid meet"/>${text('SANDHYA KATHA',40,560,'Karla',22,'#ebbb70','en')}${text(labels[lang],620,85,family,lang==='ta'?18:22,'#ebbb70',lang)}${wrapped.map((l,i)=>text(l,620,185+i*(size+22),family,size,'#f5ecdc',lang)).join('')}<line x1="620" x2="1150" y1="510" y2="510" stroke="#725c52"/>${text(lang==='en'?st.work:sourceNames[st.work][lang],620,550,family,lang==='ta'?19:22,'#d6c2a9',lang)}${text(lang==='en'?st.locus:st.locus.replace('Ganguli ',''),620,585,'Gentium Book Plus',20,'#d6c2a9','en')}</svg>`;
  const png=path.join(batch,'og',st.id+'-'+lang+'-candidate.png');
  fs.writeFileSync(png,new Resvg(svg,{font}).render().asPng());
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',png,'-frames:v','1','-q:v','3',png.replace('.png','.jpg')]);
 }
}
