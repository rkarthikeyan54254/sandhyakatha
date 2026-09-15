#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { audienceText } from './lib/lexicon-display.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SOCIAL = join(ROOT, 'social');
const CAMPAIGNS = join(SOCIAL, 'campaigns');

const argv = process.argv.slice(2);
const openBundle = argv.includes('--open');
const id = argv.find(a => !a.startsWith('--'));

if (!id) {
  console.error('usage: npm run campaign -- <story-id> [--open]');
  process.exit(1);
}

const storyPath = join(ROOT, 'content', 'stories', `${id}.json`);
if (!existsSync(storyPath)) {
  console.error(`FAIL campaign: story not found: content/stories/${id}.json`);
  process.exit(1);
}

const story = JSON.parse(readFileSync(storyPath, 'utf8'));
if (story.status !== 'published') {
  console.error(`FAIL campaign: ${id} is ${story.status}, not published`);
  process.exit(1);
}

const lex = JSON.parse(readFileSync(join(ROOT, 'content', 'lexicon.json'), 'utf8'));
const canon = JSON.parse(readFileSync(join(ROOT, 'content', 'canon.json'), 'utf8')).canon;
const canonRow = canon.find(row => row.id === id);
const plain = value => audienceText(String(value ?? ''), lex).trim();

function runNode(script, args = []) {
  execFileSync(
    process.execPath,
    [join(ROOT, 'scripts', script), ...args],
    { cwd: ROOT, stdio: 'inherit' }
  );
}

console.log(`\n==> Campaign preflight: ${id}`);
runNode('reel.mjs', ['--check', id]);

console.log(`\n==> Generate gated reel`);
runNode('reel.mjs', [id]);

console.log(`\n==> Generate source-backed carousel`);
runNode('social.mjs', [id]);

const reel = join(SOCIAL, `${id}-reel.mp4`);
const reelCover = join(SOCIAL, `${id}-reel-cover.png`);
const carouselDir = join(SOCIAL, id);
const carouselCaption = join(carouselDir, 'caption.txt');
const carouselLink = join(carouselDir, 'link.txt');

for (const p of [reel, reelCover, carouselDir, carouselCaption, carouselLink]) {
  if (!existsSync(p)) {
    console.error(`FAIL campaign: expected generator output missing: ${p}`);
    process.exit(1);
  }
}

const carouselSlides = readdirSync(carouselDir)
  .filter(name => /^\d\d\.png$/.test(name))
  .sort();

if (carouselSlides.length < 4) {
  console.error(`FAIL campaign: expected carousel slides, found ${carouselSlides.length}`);
  process.exit(1);
}

if (statSync(reel).size < 100_000) {
  console.error('FAIL campaign: reel file is suspiciously small');
  process.exit(1);
}

const campaignDir = join(CAMPAIGNS, id);
const instagramDir = join(campaignDir, 'instagram');
const instagramCarouselDir = join(instagramDir, 'carousel');
const whatsappDir = join(campaignDir, 'whatsapp');

rmSync(campaignDir, { recursive: true, force: true });
mkdirSync(instagramCarouselDir, { recursive: true });
mkdirSync(whatsappDir, { recursive: true });

copyFileSync(reel, join(instagramDir, 'reel.mp4'));
copyFileSync(reelCover, join(instagramDir, 'reel-cover.png'));

for (const name of carouselSlides) {
  copyFileSync(join(carouselDir, name), join(instagramCarouselDir, name));
}

const igCarouselCaption = readFileSync(carouselCaption, 'utf8').trim() + '\n';
const igTracked = readFileSync(carouselLink, 'utf8').trim();

writeFileSync(join(instagramDir, 'carousel-caption.txt'), igCarouselCaption);
writeFileSync(join(instagramDir, 'tracked-link.txt'), igTracked + '\n');

const hook = plain(canonRow?.hook || story.tease);
const sourceLine = `${story.source.work} — ${story.source.locus}`;

const reelUrl = new URL(`https://sandhyakatha.com/s/${id}/`);
reelUrl.searchParams.set('utm_source', 'instagram');
reelUrl.searchParams.set('utm_medium', 'reel');
reelUrl.searchParams.set('utm_campaign', 'daily_story');
reelUrl.searchParams.set('utm_content', id);

const reelCaption = `${hook}

📜 ${sourceLine}

Read the complete ${story.lengths.full.minutes}-minute telling tonight:
${reelUrl.toString()}

#SandhyaKatha #IndianStories #StoriesForKids
`;
writeFileSync(join(instagramDir, 'reel-caption.txt'), reelCaption);

const waUrl = new URL(`https://sandhyakatha.com/s/${id}/`);
waUrl.searchParams.set('utm_source', 'whatsapp');
waUrl.searchParams.set('utm_medium', 'channel');
waUrl.searchParams.set('utm_campaign', 'daily_story');
waUrl.searchParams.set('utm_content', id);

const waPost = `🌙 *Tonight’s Sandhya Katha*

*${story.title}*

${hook}

A ${story.lengths.full.minutes}-minute, source-checked story to read aloud tonight.

📜 ${sourceLine}

${waUrl.toString()}
`;

writeFileSync(join(whatsappDir, 'channel-post.txt'), waPost);
writeFileSync(join(whatsappDir, 'tracked-link.txt'), waUrl.toString() + '\n');

copyFileSync(join(carouselDir, carouselSlides[0]), join(whatsappDir, 'share-image.png'));
copyFileSync(reel, join(whatsappDir, 'reel.mp4'));

const checklist = `SANDHYA KATHA — DAILY SOCIAL CAMPAIGN
Story: ${story.title}
Slug: ${id}

INSTAGRAM — REEL
[ ] Upload instagram/reel.mp4
[ ] Choose instagram/reel-cover.png as cover
[ ] Paste instagram/reel-caption.txt
[ ] Keep silent unless using approved narration
[ ] Publish

INSTAGRAM — CAROUSEL
[ ] Upload instagram/carousel/*.png in filename order
[ ] Paste instagram/carousel-caption.txt
[ ] Publish only when you want a second Instagram post for this story

WHATSAPP PUBLIC CHANNEL
[ ] Paste whatsapp/channel-post.txt
[ ] Let the story URL render its preview
[ ] Optional: attach whatsapp/share-image.png
[ ] Optional instead: post whatsapp/reel.mp4 as the visual
[ ] Publish

FINAL HUMAN GATE
[ ] Reel local review looked right
[ ] Source/locus visible
[ ] No invented moral or unsupported claim
[ ] All URLs point to /s/${id}/
`;

writeFileSync(join(campaignDir, 'POSTING-CHECKLIST.txt'), checklist);

const manifest = {
  storyId: id,
  storyVersion: story.version,
  title: story.title,
  source: {
    work: story.source.work,
    locus: story.source.locus
  },
  instagram: {
    reel: 'instagram/reel.mp4',
    reelCover: 'instagram/reel-cover.png',
    carouselSlides: carouselSlides.map(name => `instagram/carousel/${name}`),
    reelCaption: 'instagram/reel-caption.txt',
    carouselCaption: 'instagram/carousel-caption.txt',
    trackedLink: igTracked
  },
  whatsapp: {
    channelPost: 'whatsapp/channel-post.txt',
    shareImage: 'whatsapp/share-image.png',
    reel: 'whatsapp/reel.mp4',
    trackedLink: waUrl.toString()
  }
};

writeFileSync(
  join(campaignDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);

console.log(`\nCampaign gate: PASS`);
console.log(`bundle: social/campaigns/${id}/`);
console.log(`  Instagram Reel + cover`);
console.log(`  Instagram carousel: ${carouselSlides.length} slides`);
console.log(`  Instagram reel + carousel captions`);
console.log(`  WhatsApp Channel post + share image + reel`);
console.log(`  Platform-specific tracked links`);
console.log(`  Posting checklist`);

if (openBundle && process.platform === 'darwin') {
  execFileSync('open', [campaignDir]);
}
