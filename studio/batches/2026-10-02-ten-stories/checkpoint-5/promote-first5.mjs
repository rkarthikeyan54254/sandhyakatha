import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { gitBlobSha1 } from '../../../../scripts/lib/locale-content.mjs';

const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../../..');
const ids = ['amarniti-scales','sundarar-court','appar-spade','thirumangai-ring','kulasekhara-march'];
const reviewedOn = '2026-10-02';
const reviewer = 'rama';
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write = (p,v) => { const f=path.join(root,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n'); };

// Restore the production validator exactly. Promotion must never weaken gates.
const mainValidator = execFileSync('git',['show','origin/main:scripts/validate-locales.mjs'],{cwd:root,encoding:'utf8'});
fs.writeFileSync(path.join(root,'scripts/validate-locales.mjs'),mainValidator);

const canonDoc = read('content/canon.json');
const canonById = new Map(canonDoc.canon.map(x=>[x.id,x]));
const mediaDoc = read('content/media.json');
const lexicon = read('content/lexicon.json');
const lexAdditions = read('studio/batches/2026-10-02-ten-stories/checkpoint-5/lexicon-additions.json');
const previews = read('content/locale-previews.json');
Object.assign(lexicon, lexAdditions);

for (const id of ids) {
  const stagedPath = `studio/batches/2026-10-02-ten-stories/checkpoint-5/en/${id}.json`;
  const story = read(stagedPath);

  // Rama explicitly approved all five English canonical tellings on 2026-10-02.
  story.status = 'published';
  story.updated = reviewedOn;
  story.source.reviewedBy = reviewer;
  story.source.reviewedOn = reviewedOn;
  const canonicalPath = `content/stories/${id}.json`;
  write(canonicalPath,story);

  const c = canonById.get(id);
  if (!c) throw new Error(`Missing canon row for ${id}`);
  c.title = story.title;
  c.corpus = story.source.corpus;
  c.tradition = story.source.tradition;
  c.work = story.source.work;
  c.locus = story.source.locus;
  c.stability = story.source.stability;
  c.minAge = story.audience.minAge;
  c.sensitivity = story.audience.sensitivity ?? [];
  c.value = story.values[0];
  c.hook = story.tease;
  c.status = 'published';
  c.gated = !!story.audience.gated;
  if (story.audience.careNote) c.careNote = story.audience.careNote;
  else delete c.careNote;

  mediaDoc.stories[id] = {
    canonStatus: 'published',
    storyVersion: story.version,
    image: {
      status: 'approved',
      type: 'illustration',
      file: `/media/stories/${id}/hero.webp`,
      reviewedBy: reviewer,
      reviewedOn
    },
    voiceover: { en: { status: 'not_started', file: null } }
  };

  const canonicalRaw = fs.readFileSync(path.join(root,canonicalPath),'utf8');
  const canonicalBlob = gitBlobSha1(canonicalRaw);
  for (const lang of ['hi','ta']) {
    const stagedLocalePath = `studio/batches/2026-10-02-ten-stories/checkpoint-5/${lang}/${id}.json`;
    const doc = read(stagedLocalePath);
    doc.sourceVersion = story.version;
    doc.sourceBlobSha1 = canonicalBlob;

    // User approval covers locale editorial/source review, but the supplied
    // ~3/~6 minute statement is approximate, not a measured native read-aloud.
    // Keep fail-closed timing gates pending and do not invent measured seconds.
    doc.status = 'in-review';
    for (const r of Object.values(doc.lengths)) r.measuredSeconds = null;
    doc.review.languageEditor = {status:'approved',reviewer,reviewedOn};
    doc.review.sourceFidelity = {status:'approved',reviewer,reviewedOn};
    for (const length of Object.keys(doc.lengths))
      doc.review.nativeReadAloud[length] = {status:'pending',reviewer:null,reviewedOn:null};

    write(stagedLocalePath,doc);
    write(`content/locales/${lang}/${id}.json`,doc);
  }

  if (!previews.previews.some(p => p.storyId === id)) {
    const preferTamil = ['amarniti-scales','sundarar-court','appar-spade','thirumangai-ring','kulasekhara-march'].includes(id);
    previews.previews.push({storyId:id, defaultLocale:preferTamil?'ta-IN':'hi-IN', locales:['ta-IN','hi-IN']});
  }
}

write('content/canon.json',canonDoc);
write('content/media.json',mediaDoc);
write('content/lexicon.json',lexicon);
write('content/locale-previews.json',previews);

const approval = {
  schemaVersion:'1.0',
  reviewedOn,
  reviewer,
  approvedStoryIds:ids,
  canonicalEnglish:{editorial:'approved',sourceFidelity:'approved',publication:'approved'},
  locales:{
    'hi-IN':{languageEditor:'approved',sourceFidelity:'approved',nativeReadAloud:'pending-measured-timing'},
    'ta-IN':{languageEditor:'approved',sourceFidelity:'approved',nativeReadAloud:'pending-measured-timing'}
  },
  timing:{short:{approxMinutes:3,measuredSeconds:null},full:{approxMinutes:6,measuredSeconds:null}},
  note:'Reviewer approved all five English stories and explicitly extended the same editorial approval to Hindi and Tamil, with approximately 3 minutes short / 6 minutes full. Approximate timings are not stored as measured read-aloud seconds.'
};
write('studio/batches/2026-10-02-ten-stories/checkpoint-5/review-approval.json',approval);

const cp = read('studio/batches/2026-10-02-ten-stories/checkpoint-5/checkpoint.json');
cp.humanReviewState = 'english-published-approved; hi-ta-editorial-source-approved; native-measured-read-aloud-pending';
cp.promotionState = 'first-five-promoted-with-live-english-and-hi-ta-review-parity';
cp.mediaState = 'five supplied illustrations approved as hero assets; hero WebP and 1200x630 OG derivatives required and gate-checked';
cp.fullRepoGates = 'run-by-promotion-workflow-before-merge';
cp.approximateTiming = {shortMinutes:3,fullMinutes:6,measuredSecondsRecorded:false};
write('studio/batches/2026-10-02-ten-stories/checkpoint-5/checkpoint.json',cp);

const mediaCandidates = read('studio/batches/2026-10-02-ten-stories/checkpoint-5/media-candidates.json');
for (const id of ids) mediaCandidates.stories[id].heroStatus = 'approved';
mediaCandidates.note = 'User-supplied illustrations approved for first-five publication on 2026-10-02. Hero WebP and 1200x630 OG derivatives preserve the supplied art; no TTS/audio approval is implied.';
write('studio/batches/2026-10-02-ten-stories/checkpoint-5/media-candidates.json',mediaCandidates);

console.log(`Promoted ${ids.length} English stories to published; copied 10 approved editorial/source locale editions into the review lane with measured native timing still pending.`);
