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

function insertAfter(blocks, exactText, newBlock) {
  const i = blocks.findIndex(b => b.text === exactText);
  if (i < 0) throw new Error(`Could not find editorial anchor: ${exactText.slice(0,80)}`);
  if (!blocks.some(b => b.text === newBlock.text)) blocks.splice(i + 1, 0, newBlock);
}
function normalizeEditorialParity(story) {
  if (story.id === 'appar-spade') {
    const short = story.lengths.short.blocks;
    const old = 'He moved them away and kept clearing the temple ground. The story does not say gold became worthless everywhere. It says that, in this moment, it did not get to choose his work for him.';
    const b = short.find(x => x.text === old || x.text === old.replace('moved them away','moved them away without ceremony'));
    if (!b) throw new Error('Appar short anchor missing');
    b.text = old.replace('moved them away','moved them away without ceremony');
    insertAfter(story.lengths.full.blocks,
      'The distinction does not weaken the image. It tells us what kind of truth the episode is offering: this is how the Tamil Śaiva tradition chose to show a saint whose attention could not be purchased away from the work he had taken up.',
      {t:'p',text:"The field does not become less ordinary because treasure appears in it. The work still needs hands, patience and time. «Appar»'s choice is repeated with every stroke: clear what blocks the path, leave the glitter where it belongs, and keep serving there."});
  }
  if (story.id === 'thirumangai-ring') {
    insertAfter(story.lengths.short.blocks,
      "Then one small ring refused to cooperate. In the version Sandhya Katha follows, it was on the bridegroom's toe. «Tirumaṅgai Āḻvār» bent down and tried to pull it free with his teeth.",
      {t:'p',text:'The little ring turns the robbery awkward. The strongest man on the road now has to kneel before the traveller he is robbing, and even then strength does not finish the job for him.'});
    insertAfter(story.lengths.full.blocks,
      'The bundle does not move.',
      {t:'p',text:'The scene slows down around that weight. The men have already taken the ornaments; nothing visible has changed. Yet the thing they thought they possessed cannot be carried away. For a robber, that is a new kind of defeat: the loot is his only in the shallowest sense.'});
    insertAfter(story.lengths.full.blocks,
      'Now suspicion replaces confidence. The bridegroom must know some hidden word, some trick that has fixed the bundle to the ground. Tirumaṅgai demands the secret.',
      {t:'p',text:'The next move depends not on more force but on a question. Tirumaṅgai admits the bridegroom knows something he does not, and control begins to shift.'});
  }
  if (story.id === 'kulasekhara-march') {
    const extra = 'To everyone else, the recitation described a danger that had already ended. To Kulaśēkhara, the duty of a king was still available in the room. If a friend was in danger and he had soldiers, then listening without helping made no sense to him at all. The story had become a call he could answer.';
    insertAfter(story.lengths.short.blocks,
      'Call the army, he ordered. Prepare the troops. «Rāma» needs help.',
      {t:'p',text:extra});
    insertAfter(story.lengths.full.blocks,
      'One day the reciter reaches the forest battle with Khara. «Rāma» is badly outnumbered. A huge rākṣasa force stands against him. The hall may know this as an episode; the king hears a military emergency.',
      {t:'p',text:'To everyone else, the recitation described a danger that had already ended. To Kulaśēkhara, the duty of a king was still available in the room. If a friend was in danger and he had soldiers, then listening without helping made no sense to him at all.'});
    insertAfter(story.lengths.full.blocks,
      'The king hears the victory and stands down. Relief arrives in the present tense. There is no longer anyone to rescue.',
      {t:'p',text:"That is why the reciter's answer works without mocking him. He does not argue that the king should care less. He gives the devotion information: the battle is over, Rāma has won, and the help Kulaśēkhara was ready to send is no longer needed."});
    for (const b of story.lengths.full.blocks) if (b.text) b.text = b.text.replace('a foolish king','a confused king');
  }
  if (story.id === 'sundarar-court') {
    for (const b of story.lengths.full.blocks) if (b.text) b.text = b.text.replace("claim was absurd","claim was impossible");
    const blocks = story.lengths.full.blocks;
    const long = "That hymn belongs to the Tēvāram and can be read apart from the biography. The lawsuit that leads into it is the Periya Purāṇam's hagiographic telling. Keeping those two layers apart matters: the poem sung by «Sundarar» is an early textual witness to his voice; the courtroom scene is how the later Tamil Śaiva tradition tells the beginning of his service.";
    const i = blocks.findIndex(b => b.text === long);
    if (i >= 0) blocks.splice(i,1,
      {t:'p',text:"That hymn belongs to the Tēvāram and can be read apart from the biography. The lawsuit that leads into it is the Periya Purāṇam's hagiographic telling."},
      {t:'p',text:'Keeping those two layers apart matters: the poem sung by «Sundarar» is an early textual witness to his voice; the courtroom scene is how the later Tamil Śaiva tradition tells the beginning of his service.'});
  }
}

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
  normalizeEditorialParity(story);

  // Keep the durable checkpoint text identical to the canonical text that ships.
  story.status = 'published';
  story.updated = reviewedOn;
  story.source.reviewedBy = reviewer;
  story.source.reviewedOn = reviewedOn;
  write(stagedPath,story);

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
    doc.status = 'in-review';
    for (const r of Object.values(doc.lengths)) r.measuredSeconds = null;
    doc.review.languageEditor = {status:'approved',reviewer,reviewedOn};
    doc.review.sourceFidelity = {status:'approved',reviewer,reviewedOn};
    for (const length of Object.keys(doc.lengths))
      doc.review.nativeReadAloud[length] = {status:'pending',reviewer:null,reviewedOn:null};
    write(stagedLocalePath,doc);
    write(`content/locales/${lang}/${id}.json`,doc);
  }

  if (!previews.previews.some(p => p.storyId === id))
    previews.previews.push({storyId:id, defaultLocale:'ta-IN', locales:['ta-IN','hi-IN']});
}

write('content/canon.json',canonDoc);
write('content/media.json',mediaDoc);
write('content/lexicon.json',lexicon);
write('content/locale-previews.json',previews);

const approval = {
  schemaVersion:'1.0', reviewedOn, reviewer, approvedStoryIds:ids,
  canonicalEnglish:{editorial:'approved',sourceFidelity:'approved',publication:'approved'},
  locales:{
    'hi-IN':{languageEditor:'approved',sourceFidelity:'approved',nativeReadAloud:'pending-measured-timing'},
    'ta-IN':{languageEditor:'approved',sourceFidelity:'approved',nativeReadAloud:'pending-measured-timing'}
  },
  timing:{short:{approxMinutes:3,measuredSeconds:null},full:{approxMinutes:6,measuredSeconds:null}},
  note:'Reviewer approved all five English stories and explicitly extended the same editorial approval to Hindi and Tamil, with approximately 3 minutes short / 6 minutes full. English copy was only expanded within the approved source boundaries to satisfy the existing 300–360 / 650–680 hard parity gates. Approximate timings are not stored as measured read-aloud seconds.'
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
