// Locale-neutral previews use existing approved artwork without adding translated copy.
import {readFileSync,writeFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {Resvg} from '@resvg/resvg-js';
const root=new URL('../../..',import.meta.url).pathname;
const dir=mkdtempSync(join(tmpdir(),'sk-direct-cards-'));
try {
for(const id of ['sukanya-anthill','blue-jackal','mice-ate-the-scales','parvati-decides','kunti-and-karna']) {
 const png=join(dir,id+'.png');
 execFileSync('dwebp',[join(root,'public/media/stories',id,'hero.webp'),'-o',png],{stdio:'ignore'});
 const uri='data:image/png;base64,'+readFileSync(png).toString('base64');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#17131e"/><image href="${uri}" x="24" y="24" width="1152" height="582" preserveAspectRatio="xMidYMid meet"/></svg>`;
 writeFileSync(png,new Resvg(svg).render().asPng());
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',png,'-frames:v','1','-q:v','3',join(root,'public/og',id+'-direct.jpg')]);
}
} finally {rmSync(dir,{recursive:true,force:true});}
