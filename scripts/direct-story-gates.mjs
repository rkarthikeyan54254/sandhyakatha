import {readFileSync,existsSync} from 'node:fs';import {join} from 'node:path';
const root=new URL('..',import.meta.url).pathname,read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const catalog=read('dist/data/direct-stories.json'),ids=read('content/direct-story-links.json').storyIds;
const errors=[];let count=0;
if(JSON.stringify(Object.keys(catalog.stories).sort())!==JSON.stringify([...ids].sort()))errors.push('Direct catalog differs from explicit allowlist');
const sitemap=readFileSync(join(root,'dist/sitemap.xml'),'utf8');
for(const id of ids)for(const lang of ['en','hi','ta']){
 const e=catalog.stories[id][lang],html=readFileSync(join(root,'dist',e.href,'index.html'),'utf8');
 const title=e.title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 for(const token of [`<title>${title} | Sandhya Katha</title>`,`content="noindex,nofollow"`,`href="https://sandhyakatha.com${e.href}"`,`/og/${id}${lang==='en'?'':'-'+lang}.jpg`])if(!html.includes(token))errors.push(e.href+' missing '+token);
 if(sitemap.includes(e.href))errors.push('Direct link in sitemap '+e.href);
 const source=read(`dist${e.runtimePath.split('?')[0]}`);
 if(source.id!==id||!source.audience.gated)errors.push('Invalid source '+e.href);
 const prose=source.lengths.full.blocks.find(b=>b.t==='p')?.text;
 if(prose&&html.includes(prose))errors.push('Narration embedded before opt-in '+e.href);
 if('lengths' in e||'close' in e||'blocks' in e)errors.push('Story body leaked into gate catalog '+e.href);
 if(existsSync(join(root,`dist/s/${id}/${lang==='en'?'':lang+'/'}index.html`)))errors.push('Public archive gate bypass '+e.href);
 count++;
}
if(errors.length)throw Error(errors.join('\n'));
console.log(`direct-story gates: PASS — ${count} exact-title/share-card noindex entries; no pre-consent prose or archive bypass.`);
