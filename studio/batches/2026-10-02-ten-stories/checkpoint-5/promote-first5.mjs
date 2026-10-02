import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { gitBlobSha1 } from '../../../scripts/lib/locale-content.mjs';

const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../..');
const ids = ['amarniti-scales','sundarar-court','appar-spade','thirumangai-ring','kulasekhara-march'];
const reviewedOn = '2026-10-02';
const reviewer = 'rama';
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write = (p,v) => { const f=path.join(root,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n'); };

// Restore the unmodified production locale validator. The staging branch briefly
// experimented with allowing review locales to point at review canon; this
// promotion must not weaken the production publication contract.
const mainValidator = execFileSync('git',['show','origin/main:scripts/validate-locales.mjs'],{cwd:root,encoding:'utf8'});
fs.writeFileSync(path.join(root,'scripts/validate-locales.mjs'),mainValidator);

const canonDoc = read('content/canon.json');
const canonById = new Map(canonDoc.canon.map(x=>[x.id,x]));
const mediaDoc = read('content/media.json');
const lexicon = read('content/lexicon.json');
const lexAdditions = read('studio/batches/2026-10-02-ten-stories/checkpoint-5/lexicon-additions.json');
Object.assign(lexicon, lexAdditions);

for (const id of ids) {
  const stagedPath = `studio/batches/2026-10-02-ten-stories/checkpoint-5/en/${id}.json`;
  const story = read(stagedPath);
  story.status = 'in-review';
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
  c.status = 'in-review';
  c.gated = !!story.audience.gated;
  if (story.audience.careNote) c.careNote = story.audience.careNote;
  else delete c.careNote;

  mediaDoc.stories[id] = {
    canonStatus: 'in-review',
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
    const localePath = `studio/batches/2026-10-02-ten-stories/checkpoint-5/${lang}/${id}.json`;
    const doc = read(localePath);
    doc.sourceVersion = story.version;
    doc.sourceBlobSha1 = canonicalBlob;
    doc.status = 'in-review';
    for (const r of Object.values(doc.lengths)) r.measuredSeconds = null;
    doc.review.languageEditor = {status:'approved',reviewer,reviewedOn};
    doc.review.sourceFidelity = {status:'approved',reviewer,reviewedOn};
    for (const length of Object.keys(doc.lengths))
      doc.review.nativeReadAloud[length] = {status:'pending',reviewer:null,reviewedOn:null};
    write(localePath,doc);
  }
}

write('content/canon.json',canonDoc);
write('content/media.json',mediaDoc);
write('content/lexicon.json',lexicon);

const approval = {
  schemaVersion:'1.0',
  reviewedOn,
  reviewer,
  approvedStoryIds:ids,
  canonicalEnglish:{editorial:'approved',sourceFidelity:'approved'},
  locales:{'hi-IN':{languageEditor:'approved',sourceFidelity:'approved',nativeReadAloud:'pending'},'ta-IN':{languageEditor:'approved',sourceFidelity:'approved',nativeReadAloud:'pending'}},
  timing:{short:{approxMinutes:3,measuredSeconds:null},full:{approxMinutes:6,measuredSeconds:null}},
  note:'Reviewer approved all five English stories and stated approximately 3 minutes short / 6 minutes full, applying to Hindi and Tamil as well. Approximate timings are not recorded as measured read-aloud seconds; native read-aloud gates remain pending until timed readings exist.'
};
write('studio/batches/2026-10-02-ten-stories/checkpoint-5/review-approval.json',approval);

const cp = read('studio/batches/2026-10-02-ten-stories/checkpoint-5/checkpoint.json');
cp.humanReviewState = 'editorial-and-source-approved; native-read-aloud-timing-pending';
cp.promotionState = 'first-five-integrated-into-canonical-review-corpus';
cp.mediaState = 'five supplied illustrations promoted as reviewed hero assets; OG derivatives present';
cp.fullRepoGates = 'run-by-promotion-workflow-before-commit';
cp.approximateTiming = {shortMinutes:3,fullMinutes:6,measuredSecondsRecorded:false};
write('studio/batches/2026-10-02-ten-stories/checkpoint-5/checkpoint.json',cp);

const mediaCandidates = read('studio/batches/2026-10-02-ten-stories/checkpoint-5/media-candidates.json');
for (const id of ids) mediaCandidates.stories[id].heroStatus = 'approved';
mediaCandidates.note = 'User-supplied illustrations promoted for the first-five review corpus on 2026-10-02; no TTS/audio approval is implied.';
write('studio/batches/2026-10-02-ten-stories/checkpoint-5/media-candidates.json',mediaCandidates);

console.log(`Promoted ${ids.length} canonical English review stories; recorded Hindi/Tamil editorial+source approval while preserving pending measured native read-aloud gates.`);
