// Mechanical review-package gate. Human editorial, native language and timing review remain separate.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const batch=path.dirname(fileURLToPath(import.meta.url));
const read=rel=>fs.readFileSync(path.join(batch,rel));
const sha=b=>createHash('sha256').update(b).digest('hex');
const proof=JSON.parse(read('review-data.json'));
const html=read('review.html').toString('utf8');
const failures=[],checks=[];
const check=(name,okay,detail='')=>{checks.push({name,pass:!!okay,detail});if(!okay)failures.push(`${name}: ${detail}`)};
check('five stories',proof.stories.length===5,`${proof.stories.length}`);
check('draft only',proof.publicationReady===false&&proof.reviewStatus==='pending');
check('15 edition articles',(html.match(/class="edition"/g)||[]).length===15);
check('no raw canonical name markers',!html.includes('«')&&!html.includes('»'));
check('review-only notice',html.includes('No story or image in this proof is live.'));
for(const story of proof.stories){
  check(`${story.id} source note hash`,sha(read(story.sourceNote))===story.sourceNoteSha256);
  for(const lang of ['en','hi','ta']){
    const ed=story.editions[lang];
    check(`${story.id}/${lang} file hash`,ed&&sha(read(ed.file))===ed.fileSha256);
    check(`${story.id}/${lang} timing unclaimed`,ed?.measuredSeconds?.short===null&&ed?.measuredSeconds?.full===null);
    check(`${story.id}/${lang} anchored`,html.includes(`id="${story.id}-${lang}"`));
    if(lang!=='en'){
      const draft=read(ed.file).toString('utf8');
      const spoken=draft.split(/^##\s+[^\n]*\n/m).slice(1,3).join(' ');
      const latin=/[A-Za-zÀ-žĀ-ž]/u.test(spoken);
      check(`${story.id}/${lang} draft native script`,!latin&&!/[«»]/u.test(spoken),latin?'Latin token in source draft':'native names in source draft');
    }
    if(lang==='en'){
      check(`${story.id} short word band`,ed.shortWords>=300&&ed.shortWords<=360,`${ed.shortWords}`);
      check(`${story.id} full word band`,ed.fullWords>=650&&ed.fullWords<=680,`${ed.fullWords}`);
    }
  }
  for(const kind of ['art','og']){
    const asset=story[kind];
    check(`${story.id} ${kind} hash`,sha(read(asset.file))===asset.sha256);
    const full=path.join(batch,asset.file);
    const probe=execFileSync('sips',['-g','pixelWidth','-g','pixelHeight',full],{encoding:'utf8'});
    const width=Number(/pixelWidth:\s*(\d+)/.exec(probe)?.[1]);
    const height=Number(/pixelHeight:\s*(\d+)/.exec(probe)?.[1]);
    check(`${story.id} ${kind} dimensions`,kind==='og'?width===1200&&height===630:width>=1200&&height>=900,`${width}x${height}`);
    if(kind==='og')check(`${story.id} OG under 300KB`,fs.statSync(full).size<300_000,`${fs.statSync(full).size} bytes`);
  }
}
const nativeArticles=[...html.matchAll(/<article class="edition" id="([^"]+)" lang="(hi|ta)">(.*?)<\/article>/gs)];
check('ten native-language articles',nativeArticles.length===10,`${nativeArticles.length}`);
for(const [,id,lang,article] of nativeArticles){
  const prose=[...article.matchAll(/<div class="prose">(.*?)<\/div>/gs)].map(x=>x[1]).join(' ');
  const visible=prose.replace(/<[^>]+>/g,'');
  const latin=/[A-Za-zÀ-žĀ-ž]/u.test(visible);
  check(`${id} native prose script`,!latin,latin?'Latin token present':'no Latin tokens');
}
const localSources=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('#'));
for(const rel of localSources)check(`local link ${rel}`,fs.existsSync(path.join(batch,rel)));
const report={generatedAt:new Date().toISOString(),scope:'offline 15-edition review package',mechanicalPass:failures.length===0,humanApproval:'pending',measuredReadAloud:'pending',checks,failures};
fs.writeFileSync(path.join(batch,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Review preflight: ${checks.length} checks, ${failures.length} failures`);
for(const f of failures)console.error(f);
if(failures.length)process.exitCode=1;
