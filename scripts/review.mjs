#!/usr/bin/env node
/**
 * The machine half of the review.
 *
 * `validate.mjs` asks whether a story is well formed. This asks the harder
 * mechanical question: is anything in the prose that nobody authorised?
 *
 * It cannot tell you whether the sourcing block is TRUE — checking a draft
 * against sources the drafter chose is marking your own homework, and no
 * amount of tooling changes that. What it can do is close the gap the Gaṇeśa
 * error came through: a detail that is in the telling and in no claim.
 *
 * Everything here is advisory and prints for a human. Nothing blocks a build.
 *
 *   npm run review              # every in-review story
 *   npm run review -- --all     # published ones too
 *   npm run review -- <id>
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const lex = read('content/lexicon.json');
const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter(a => !a.startsWith('-'));

const C = { dim: s => `\x1b[2m${s}\x1b[0m`, red: s => `\x1b[31m${s}\x1b[0m`,
            amber: s => `\x1b[33m${s}\x1b[0m`, green: s => `\x1b[32m${s}\x1b[0m`,
            bold: s => `\x1b[1m${s}\x1b[0m` };

/* Every spelling the lexicon knows, plus the plain forms of its keys. */
const known = new Set();
for (const [k, v] of Object.entries(lex)) {
  if (k === '_readme') continue;
  known.add(k);
  for (const a of v.aliases ?? []) known.add(a);
}
const strip = s => s.normalize('NFD').replace(/[̀-̣̱ͯ]/g, '');
const knownPlain = new Set([...known].map(strip));

const NUMWORD = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\b/gi;

/* Words that look like names but are ordinary English or structural. */
const IGNORE = new Set(['The','A','An','And','But','So','Then','That','This','It','He','She','They','We','I',
  'His','Her','Their','Not','No','Nobody','Now','Which','What','When','Where','Why','How','If','In','On','At',
  'Of','For','To','From','By','With','As','Every','Each','Some','All','One','Two','Three','Nine','Ten','Twelve',
  'Twenty','Four','Hundred','Thousand','God','Gods','Sanskrit','Tamil','Bengali','English','India','Indian',
  'North','South','Nothing','Everyone','Everything','Somebody','Someone','Anyone','Because','After','Before',
  'There','Here','Here.','Nor','Or','Yes','Do','Did','Does','Had','Has','Have','Was','Were','Is','Are','Be',
  'Being','Been','Would','Will','Should','Could','Can','May','Might','Must','Let','Look','Listen','Notice',
  'Worth','Whether','While','Until','Once','Also','Still','Just','Even','Only','Never','Always','Perhaps']);

function textOf(story) {
  return Object.values(story.lengths)
    .flatMap(r => r.blocks.filter(b => b.t !== 'beat').map(b => b.text)).join('\n');
}
const sourcingText = s =>
  [(s.source.sourcing ?? []).map(c => `${c.claim} ${c.locus}`).join(' '),
   s.source.traditionNote ?? '', s.source.work, s.source.locus,
   (s.source.variants ?? []).map(v => `${v.differs} ${v.tellings} ${v.weTell}`).join(' '),
   s.audience.careNote ?? '',
   (s.close.ifTheyAsk ?? []).map(f => `${f.q} ${f.a}`).join(' ')].join(' ');

function reviewStory(s) {
  const findings = [];
  const body = textOf(s);
  const src = sourcingText(s);
  const srcPlain = strip(src).toLowerCase();

  /* 1. Names that are not wrapped. An unwrapped name gets no pronunciation
        card and is read aloud by a voice engine as an English word. */
  const wrapped = new Set([...body.matchAll(/«([^»]+)»/g)].map(m => m[1]));
  const bare = new Map();
  for (const name of known) {
    if (name.length < 4) continue;
    const re = new RegExp(`(?<![«\\w])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w»])`, 'g');
    const hits = (body.match(re) ?? []).length;
    if (!hits) continue;
    const key = Object.keys(lex).find(k => k === name || (lex[k]?.aliases ?? []).includes(name));
    if (!wrapped.has(key)) bare.set(name, hits);
  }
  for (const [name, n] of bare)
    findings.push(['names', `"${name}" appears ${n}× and is never wrapped — no pronunciation card, and TTS will read it as English`]);

  /* 2. Capitalised words mid-sentence that the lexicon has never heard of.
        This is where an invented person or place shows up. */
  const unknown = new Map();
  for (const m of body.matchAll(/(?<![.!?]\s|^|«|\n)\b([A-ZĀĪŪṚṆṢŚṬḌṄÑḶḤṂ][a-zāīūṛṇṣśṭḍṅñḷḥṃ'’]{2,})\b/gm)) {
    const w = m[1];
    if (IGNORE.has(w) || known.has(w) || knownPlain.has(strip(w))) continue;
    if (srcPlain.includes(strip(w).toLowerCase())) continue;   // named in the sourcing
    unknown.set(w, (unknown.get(w) ?? 0) + 1);
  }
  for (const [w, n] of unknown)
    findings.push(['unknown-name', `"${w}" (${n}×) is not in the lexicon and is not named anywhere in the sourcing`]);

  /* 3. Numbers in the prose that no claim accounts for. Invented detail hides
        in quantities more than anywhere else — nine nights, four hundred cows. */
  const nums = new Set();
  for (const m of body.matchAll(NUMWORD)) nums.add(m[0].toLowerCase());
  for (const m of body.matchAll(/\b\d[\d,]*\b/g)) nums.add(m[0]);
  const unsourced = [...nums].filter(n => !srcPlain.includes(n.toLowerCase()));
  if (unsourced.length)
    findings.push(['numbers', `quantities in the prose that no claim mentions: ${unsourced.join(', ')}`]);

  /* 4. Claims nothing in the prose uses. Usually harmless; occasionally the
        sign that the story drifted away from what was authorised. */
  const bodyPlain = strip(body).toLowerCase();
  const stop = new Set(['the','and','of','a','to','in','is','that','it','his','her','he','she','they','with','as','for','on','at','by','from','who','not','be']);
  const unused = (s.source.sourcing ?? []).filter(c => {
    const words = strip(c.claim).toLowerCase().match(/[a-z]{4,}/g) ?? [];
    const meaty = words.filter(w => !stop.has(w));
    const hit = meaty.filter(w => bodyPlain.includes(w)).length;
    return meaty.length && hit / meaty.length < 0.34;
  });
  for (const c of unused) findings.push(['unused-claim', `nothing in the telling uses: "${c.claim}"`]);

  /* 5. The narrator's own voice in a block the parent has to say aloud.
        Rama's question: "am I supposed to read this as well?" If it instructs
        the reader how to read, it belongs in an aside, not in their mouth. */
  for (const [len, r] of Object.entries(s.lengths))
    r.blocks.forEach((b, i) => {
      if (b.t !== 'p' && b.t !== 'slow') return;
      const t = b.text ?? '';
      if (/\b(I would|I am going to|I will tell|I like|worth stopping on|worth imagining|the part to slow down)\b/i.test(t))
        findings.push(['voice', `${len} block ${i}: reads as a note to the parent, not a line of the story — consider an aside: "${t.slice(0, 60)}…"`]);
    });

  /* 5. Age against what is in the story. */
  const heavy = (s.audience.sensitivity ?? []).filter(x => ['death','violence'].includes(x));
  if (heavy.length && s.audience.minAge < 8)
    findings.push(['age', `flagged ${heavy.join(' and ')} but set at ${s.audience.minAge}+ — read that floor again`]);

  /* 6. A story that says it is telling one tradition should not be checked
        only against another. */
  const note = (s.source.traditionNote ?? '').toLowerCase();
  const claimsTradition = /tamil|bengali|northern|north india|kāśī|kasi|regional/.test(note);
  if (claimsTradition && s.source.tradition === 'sanskrit' && s.source.stability === 'stable')
    findings.push(['tradition', 'the note describes a regional telling but the story is marked sanskrit + stable']);

  return findings;
}

/**
 * Which stories actually need Rama, and which only need a skim.
 *
 * The point of the machine half is not to replace the reading-aloud. It is to
 * work out where reading aloud is load-bearing. A stable Sanskrit story with a
 * tight sourcing block and nothing flagged is a different risk from a folk
 * telling with a care note — and treating them the same is what makes one
 * person the bottleneck for the whole collection.
 */
function tierOf(s, findings) {
  const why = [];
  if (s.source.stability !== 'stable') why.push(`${s.source.stability} — a telling, not a text`);
  if (s.audience.gated) why.push('gated');
  if ((s.audience.sensitivity ?? []).some(x => ['death', 'violence'].includes(x))) why.push('death or violence');
  if (s.audience.minAge <= 6) why.push(`written for ${s.audience.minAge}-year-olds`);
  if (findings.some(f => ['unknown-name', 'tradition', 'age'].includes(f[0]))) why.push('the checks flagged something structural');
  if (!(s.source.sourcing ?? []).length) why.push('no sourcing block at all');
  return { tier: why.length ? 'READ ALOUD' : 'skim', why };
}

const files = readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json'));
let total = 0, seen = 0, needsHuman = 0;
console.log(C.bold('\nReview — the machine half\n'));
for (const f of files) {
  const s = read(`content/stories/${f}`);
  if (only.length ? !only.includes(s.id) : (!all && s.status !== 'in-review')) continue;
  seen++;
  const findings = reviewStory(s);
  total += findings.length;
  const { tier, why } = tierOf(s, findings);
  if (tier === 'READ ALOUD') needsHuman++;
  const label = tier === 'READ ALOUD' ? C.amber('READ ALOUD') : C.green('skim      ');
  console.log(`${label}  ${C.bold(s.id)}  ${C.dim(s.source.work + ' · ' + s.source.locus)}`);
  if (why.length) console.log(`              ${C.dim('because ' + why.join('; '))}`);
  for (const [kind, msg] of findings) console.log(`              ${C.dim(kind.padEnd(13))} ${msg}`);
  if (!findings.length) console.log(`              ${C.dim('checks clean')}`);
  console.log('');
}
console.log(C.dim(`\n${seen} checked · ${needsHuman} need reading aloud · ${seen - needsHuman} need only a skim · ${total} thing(s) flagged`));
console.log(C.dim('This cannot tell you the sourcing is true. It tells you the telling did not wander off it.\n'));
