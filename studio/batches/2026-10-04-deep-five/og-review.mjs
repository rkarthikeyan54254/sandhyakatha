// Draw draft OG/share-card concepts for the editorial proof only.
// Production public/og remains untouched until exact text and art are approved.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { createHash } from 'node:crypto';
const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../..');
const out = path.join(batch, 'og'); fs.mkdirSync(out, { recursive: true });
const entries = [
  ['nrga-well', 'Bhāgavata Purāṇa', '10.64'],
  ['indra-virocana', 'Chāndogya Upaniṣad', '8.7–12'],
  ['dharma-vyadha', 'Mahābhārata · Vana Parva', '205–214'],
  ['mainaka-welcome', 'Vālmīki Rāmāyaṇa', 'Sundara 5.1'],
  ['devi-messenger', 'Devī Māhātmya', '5–6'],
];
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const wrap = (title, width, size) => {
  const lines=[]; let line='';
  for (const word of title.split(/\s+/)) {
    if ((line ? line+' '+word : word).length * size * .47 > width && line) { lines.push(line); line=word; }
    else line=line ? line+' '+word : word;
  }
  if (line) lines.push(line);
  return lines;
};
const titleFrom = id => fs.readFileSync(path.join(batch,'en',`${id}.md`),'utf8').split('\n')[0].replace(/^#\s*/, '').replace(/\s+[—–]\s+English.*$/,'');
const artFile = id => path.join(batch,'art', ['dharma-vyadha','indra-virocana'].includes(id) ? `${id}-candidate-v2.webp` : `${id}-candidate.webp`);
const manifest=[];
for (const [id,work,locus] of entries) {
  const title=titleFrom(id);
  const art=artFile(id);
  const png=path.join(os.tmpdir(),`sk-deep-five-${id}.png`);
  const rendered=path.join(os.tmpdir(),`sk-deep-five-card-${id}.png`);
  try {
    execFileSync('dwebp',[art,'-o',png],{stdio:'ignore'});
    const uri='data:image/png;base64,'+fs.readFileSync(png).toString('base64');
    let size=54, lines=wrap(title,590,size);
    for (const s of [54,49,44,39]) { const candidate=wrap(title,590,s); if(candidate.length<=3){size=s;lines=candidate;break;} }
    const titleY=228-(lines.length-1)*size*.5;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#251d32"/><stop offset="1" stop-color="#15111c"/></linearGradient><linearGradient id="fade"><stop stop-color="#15111c" stop-opacity="0"/><stop offset="1" stop-color="#15111c"/></linearGradient><clipPath id="art"><rect x="0" y="0" width="490" height="630"/></clipPath></defs><rect width="1200" height="630" fill="url(#bg)"/><image href="${uri}" x="0" y="0" width="490" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#art)"/><rect x="395" y="0" width="95" height="630" fill="url(#fade)"/><path d="M530 60 C538 72 538 80 530 91 C522 80 522 72 530 60" fill="#e9a64d"/><text x="558" y="82" font-family="Karla" font-size="22" font-weight="700" letter-spacing="1.4" fill="#f3e7d3">SANDHYA KATHA</text><text x="530" y="128" font-family="Karla" font-size="15" font-weight="700" letter-spacing="1.5" fill="#f0b458">EDITORIAL REVIEW · NOT LIVE</text>${lines.map((l,i)=>`<text x="530" y="${titleY+i*size*1.15}" font-family="Gentium Book Plus" font-size="${size}" fill="#f3e7d3">${esc(l)}</text>`).join('')}<line x1="530" y1="490" x2="1140" y2="490" stroke="#68516a"/><text x="530" y="537" font-family="Karla" font-size="24" fill="#f0b458">${esc(work)}</text><text x="530" y="575" font-family="Gentium Book Plus" font-size="23" fill="#cbbacd">${esc(locus)} · full reading timing pending</text></svg>`;
    const r=new Resvg(svg,{fitTo:{mode:'width',value:1200},font:{fontDirs:[path.join(root,'assets/fonts')],loadSystemFonts:false,defaultFontFamily:'Gentium Book Plus'}});
    fs.writeFileSync(rendered,r.render().asPng());
    const dest=path.join(out,`${id}-candidate.jpg`);
    execFileSync('ffmpeg',['-y','-loglevel','error','-i',rendered,'-frames:v','1','-q:v','4',dest],{stdio:'ignore'});
    const data=fs.readFileSync(dest);
    manifest.push({storyId:id,file:path.relative(batch,dest),title,work,locus,width:1200,height:630,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),status:'candidate—human review pending'});
    console.log(`${id}: ${data.length} bytes`);
  } finally { fs.rmSync(png,{force:true}); fs.rmSync(rendered,{force:true}); }
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({publicationStatus:'not approved or live',cards:manifest},null,2)+'\n');
