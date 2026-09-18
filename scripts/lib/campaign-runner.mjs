import {
  copyFileSync, existsSync, mkdirSync, readdirSync, rmSync,
  statSync, writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { campaignLocalesForStory, resolveSocialEdition } from './social-edition.mjs';
import { runCarousel } from './carousel-runner.mjs';

const SITE = 'https://sandhyakatha.com';
const PIPELINE = 'sandhya-campaign-v2';

const esc = value => String(value)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function runReel(root, edition, checkOnly) {
  const args = [join(root,'scripts','reel.mjs')];
  if (checkOnly) args.push('--check');
  if (edition.locale !== 'en') args.push('--locale',edition.locale);
  args.push(edition.id);
  execFileSync(process.execPath,args,{cwd:root,stdio:'inherit',env:process.env});
}

function reelPaths(root, edition) {
  if (edition.locale === 'en') return {
    video:join(root,'social',`${edition.id}-reel.mp4`),
    cover:join(root,'social',`${edition.id}-reel-cover.png`)
  };
  return {
    video:join(root,'social',edition.language,`${edition.id}-reel.mp4`),
    cover:join(root,'social',edition.language,`${edition.id}-reel-cover.png`)
  };
}

function trackedUrl(edition, source, medium) {
  const url = new URL(edition.publicPath,SITE);
  url.searchParams.set('utm_source',source);
  url.searchParams.set('utm_medium',medium);
  url.searchParams.set('utm_campaign','daily_story');
  url.searchParams.set('utm_content',`${edition.id}_${edition.locale}`);
  return url.toString();
}

function sourceLine(edition) {
  return `${edition.sourceWork} — ${edition.sourceLocus}`;
}

function baseCaption(edition, url) {
  return `${edition.title}\n\n${edition.tease}\n\n${edition.closeQuestion}\n\n📜 ${sourceLine(edition)}\n\n${url}\n\n#SandhyaKatha\n`;
}

function youtubeTitle(edition) {
  const value = `${edition.title} | Sandhya Katha`;
  return value.length <= 100 ? value : edition.title.slice(0,96).trimEnd() + '…';
}

function writePlatformMetadata({ dir, edition, platform }) {
  mkdirSync(dir,{recursive:true});
  if (platform === 'instagram') {
    const reelUrl=trackedUrl(edition,'instagram','reel');
    const carouselUrl=trackedUrl(edition,'instagram','carousel');
    writeFileSync(join(dir,'reel-caption.txt'),baseCaption(edition,reelUrl));
    writeFileSync(join(dir,'carousel-caption.txt'),baseCaption(edition,carouselUrl));
    writeFileSync(join(dir,'reel-link.txt'),reelUrl+'\n');
    writeFileSync(join(dir,'carousel-link.txt'),carouselUrl+'\n');
  } else if (platform === 'facebook') {
    const reelUrl=trackedUrl(edition,'facebook','reel');
    const carouselUrl=trackedUrl(edition,'facebook','carousel');
    writeFileSync(join(dir,'reel-caption.txt'),baseCaption(edition,reelUrl));
    writeFileSync(join(dir,'carousel-caption.txt'),baseCaption(edition,carouselUrl));
    writeFileSync(join(dir,'reel-link.txt'),reelUrl+'\n');
    writeFileSync(join(dir,'carousel-link.txt'),carouselUrl+'\n');
  } else if (platform === 'youtube') {
    const url=trackedUrl(edition,'youtube','shorts');
    const title=youtubeTitle(edition);
    const description=`${edition.tease}\n\n📜 ${sourceLine(edition)}\n\n${url}\n\n#SandhyaKatha #Shorts\n`;
    if (title.length > 100) throw new Error('YouTube title exceeds 100 characters');
    if (description.length > 5000) throw new Error('YouTube description exceeds 5000 characters');
    writeFileSync(join(dir,'title.txt'),title+'\n');
    writeFileSync(join(dir,'description.txt'),description);
    writeFileSync(join(dir,'tracked-link.txt'),url+'\n');
  } else if (platform === 'whatsapp') {
    const url=trackedUrl(edition,'whatsapp','channel');
    const post=`🌙 *${edition.title}*\n\n${edition.tease}\n\n📜 ${sourceLine(edition)}\n\n${url}\n`;
    writeFileSync(join(dir,'post.txt'),post);
    writeFileSync(join(dir,'tracked-link.txt'),url+'\n');
  }
}

function assertFile(path,min=1) {
  if (!existsSync(path) || statSync(path).size < min)
    throw new Error(`expected campaign asset missing/small: ${path}`);
}

function copyCarousel(srcDir,dstDir) {
  mkdirSync(dstDir,{recursive:true});
  const slides=readdirSync(srcDir).filter(name=>/^\d\d\.png$/.test(name)).sort();
  if (slides.length < 8 || slides.length > 10)
    throw new Error(`carousel slide count ${slides.length} outside 8-10`);
  for (const name of slides) copyFileSync(join(srcDir,name),join(dstDir,name));
  return slides;
}

function editionManifest(edition, slideNames) {
  return {
    pipeline:PIPELINE,
    storyId:edition.id,
    storyVersion:edition.story.version,
    locale:edition.locale,
    language:edition.language,
    publicPath:edition.publicPath,
    provenance:edition.provenance,
    source:{work:edition.sourceWork,locus:edition.sourceLocus},
    formats:{
      instagram:{reel:'instagram/reel.mp4',cover:'instagram/reel-cover.png',carousel:slideNames.map(x=>`instagram/carousel/${x}`)},
      facebook:{reel:'facebook/reel.mp4',cover:'facebook/reel-cover.png',carousel:slideNames.map(x=>`facebook/carousel/${x}`)},
      youtube:{short:'youtube/short.mp4',title:'youtube/title.txt',description:'youtube/description.txt'},
      whatsapp:{reel:'whatsapp/reel.mp4',shareImage:'whatsapp/share-image.png',post:'whatsapp/post.txt'}
    }
  };
}

function rootReview({ root, id, editions }) {
  const campaignDir=join(root,'social','campaigns',id);
  const sections=editions.map(edition=>{
    const key=edition.locale;
    const carouselDir=join(campaignDir,key,'instagram','carousel');
    const slides=readdirSync(carouselDir).filter(x=>/^\d\d\.png$/.test(x)).sort();
    return `<section><h2>${esc(key)} · ${esc(edition.title)}</h2><video controls muted src="${esc(key)}/instagram/reel.mp4"></video><div class="grid">${slides.map(name=>`<img src="${esc(key)}/instagram/carousel/${name}">`).join('')}</div></section>`;
  }).join('\n');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(id)} campaign review</title><style>body{margin:0;background:#100c17;color:#f3e7d3;font:16px system-ui;padding:30px}h1,h2{font-family:Georgia,serif}section{margin:0 0 56px}video{width:min(340px,90vw);display:block;border-radius:12px;margin:16px 0 24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.grid img{width:100%;border-radius:9px}</style></head><body><h1>Sandhya Katha campaign review · ${esc(id)}</h1>${sections}</body></html>`;
  writeFileSync(join(campaignDir,'review.html'),html);
}

export async function runCampaign({ root, id, requestedLocale = null, checkOnly = false, openReview = false }) {
  const locales=campaignLocalesForStory({root,id,requestedLocale});
  const editions=locales.map(locale=>resolveSocialEdition({root,id,locale}));
  console.log(`campaign editions: ${editions.map(e=>e.locale).join(', ')}`);

  for (const edition of editions) {
    console.log(`\n===== ${edition.locale} · reel =====`);
    runReel(root,edition,true);
    console.log(`\n===== ${edition.locale} · carousel =====`);
    await runCarousel({root,edition,checkOnly:true});
  }

  if (checkOnly) {
    console.log(`\ncampaign preflight: PASS — ${id} · ${editions.map(e=>e.locale).join(' + ')}`);
    return { editions };
  }

  const campaignDir=join(root,'social','campaigns',id);
  rmSync(campaignDir,{recursive:true,force:true});
  mkdirSync(campaignDir,{recursive:true});
  const manifests=[];

  for (const edition of editions) {
    console.log(`\n===== ${edition.locale} · render reel =====`);
    runReel(root,edition,false);
    console.log(`\n===== ${edition.locale} · render carousel =====`);
    const carousel=await runCarousel({root,edition,checkOnly:false});
    const reel=reelPaths(root,edition);
    assertFile(reel.video,100_000);
    assertFile(reel.cover,12_000);

    const out=join(campaignDir,edition.locale);
    rmSync(out,{recursive:true,force:true});
    const ig=join(out,'instagram');
    const fb=join(out,'facebook');
    const yt=join(out,'youtube');
    const wa=join(out,'whatsapp');
    for (const dir of [ig,fb,yt,wa]) mkdirSync(dir,{recursive:true});

    copyFileSync(reel.video,join(ig,'reel.mp4'));
    copyFileSync(reel.cover,join(ig,'reel-cover.png'));
    const slides=copyCarousel(carousel.outDir,join(ig,'carousel'));

    copyFileSync(reel.video,join(fb,'reel.mp4'));
    copyFileSync(reel.cover,join(fb,'reel-cover.png'));
    copyCarousel(carousel.outDir,join(fb,'carousel'));

    copyFileSync(reel.video,join(yt,'short.mp4'));
    copyFileSync(reel.video,join(wa,'reel.mp4'));
    copyFileSync(join(carousel.outDir,slides[0]),join(wa,'share-image.png'));

    writePlatformMetadata({dir:ig,edition,platform:'instagram'});
    writePlatformMetadata({dir:fb,edition,platform:'facebook'});
    writePlatformMetadata({dir:yt,edition,platform:'youtube'});
    writePlatformMetadata({dir:wa,edition,platform:'whatsapp'});

    const manifest=editionManifest(edition,slides);
    writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
    manifests.push(manifest);
  }

  const rootManifest={pipeline:PIPELINE,storyId:id,editions:manifests};
  writeFileSync(join(campaignDir,'manifest.json'),JSON.stringify(rootManifest,null,2)+'\n');
  const checklist=`SANDHYA KATHA — UNIFIED CAMPAIGN\nStory: ${id}\nEditions: ${editions.map(e=>e.locale).join(', ')}\n\nFor each edition:\n[ ] Review review.html\n[ ] Instagram: reel + carousel + matching caption\n[ ] Facebook: reel or carousel + matching caption\n[ ] YouTube: short.mp4 + title.txt + description.txt\n[ ] WhatsApp: post.txt + optional share-image.png or reel.mp4\n[ ] Confirm source/locus is visible\n[ ] Confirm tracked links point to the matching language edition\n[ ] Human visual/language review before posting\n`;
  writeFileSync(join(campaignDir,'POSTING-CHECKLIST.txt'),checklist);
  rootReview({root,id,editions});

  console.log(`\nUNIFIED CAMPAIGN: PASS — ${id} · ${editions.map(e=>e.locale).join(' + ')}`);
  console.log(`bundle: social/campaigns/${id}/`);
  console.log(`review: social/campaigns/${id}/review.html`);
  if (openReview && process.platform === 'darwin')
    execFileSync('open',[join(campaignDir,'review.html')]);
  return { editions, campaignDir };
}
