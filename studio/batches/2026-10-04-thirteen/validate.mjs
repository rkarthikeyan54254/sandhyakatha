// Mechanical draft checks only; this cannot grant editorial or language approval.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const schema = read(path.join(root, 'schema/story.schema.json'));
const canon = new Map(read(path.join(root, 'content/canon.json')).canon.map(row => [row.id, row]));
const lexicon = read(path.join(root, 'content/lexicon.json'));
const groups = ['early-four', 'middle-four', 'gated-five'];
const files = groups.flatMap(group => {
  const dir = path.join(batch, group, 'en');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => name.endsWith('.json')).sort().map(name => path.join(dir, name)) : [];
});
const additions = groups.flatMap(group => {
  const file = path.join(batch, group, 'lexicon-additions.json');
  if (!fs.existsSync(file)) return [];
  const data = read(file);
  return Object.keys(data.proposedEntries || data);
});
const names = new Set([...Object.keys(lexicon), ...additions]);
const ajv = addFormats(new Ajv({ allErrors: true, strict: false }));
const check = ajv.compile(schema);
const errors = [];
const counts = [];
const words = rendition => rendition.blocks.filter(block => block.t !== 'aside' && block.text).map(block => block.text.replace(/[«»_]/g, '')).join(' ').split(/\s+/).filter(Boolean).length;
for (const file of files) {
  let doc;
  try { doc = read(file); } catch (error) { errors.push(`${file}: ${error.message}`); continue; }
  const at = path.relative(batch, file);
  if (!check(doc)) errors.push(...check.errors.map(error => `${at}: ${error.instancePath || '/'} ${error.message}`));
  if (doc.id !== path.basename(file, '.json')) errors.push(`${at}: filename and id differ`);
  const row = canon.get(doc.id);
  if (!row || row.status !== 'draft') errors.push(`${at}: expected draft canon entry`);
  if (!['draft', 'in-review'].includes(doc.status)) errors.push(`${at}: candidate must not be published`);
  if (row && Boolean(doc.audience?.gated) !== Boolean(row.gated)) errors.push(`${at}: age gate differs from canon`);
  if (doc.source?.stability !== 'stable' && !doc.source?.traditionNote) errors.push(`${at}: tradition note required`);
  if (doc.source?.stability !== 'stable' && !doc.source?.variants?.length) errors.push(`${at}: source variant boundary required`);
  if (!doc.source?.sourcing?.length || !doc.source?.checkedAgainst?.length) errors.push(`${at}: source ledger incomplete`);
  for (const name of ['short', 'full']) {
    const rendition = doc.lengths?.[name];
    if (!rendition?.blocks) { errors.push(`${at}: missing ${name} rendition`); continue; }
    const count = words(rendition);
    const [minimum, maximum, minutes] = name === 'short' ? [300, 360, 3] : [650, 680, 6];
    if (count < minimum || count > maximum || rendition.minutes !== minutes) errors.push(`${at}: ${name} has ${count} words / ${rendition.minutes} minutes, expected ${minimum}–${maximum} / ${minutes}`);
    const beats = rendition.blocks.filter(block => block.t === 'beat').length;
    if (Math.round(count / 110 + beats * 0.05) !== minutes) errors.push(`${at}: ${name} spoken-time estimate disagrees with label`);
    if (rendition.blocks.at(-1)?.t !== 'slow') errors.push(`${at}: ${name} must end with a slow block`);
    if (rendition.blocks.filter(block => block.t === 'slow').length !== 1) errors.push(`${at}: ${name} needs exactly one slow block`);
    if (rendition.blocks.at(0)?.t === 'aside') errors.push(`${at}: ${name} must not begin with an aside`);
    for (const block of rendition.blocks) {
      for (const match of (block.text || '').matchAll(/«([^»]+)»/g)) if (!names.has(match[1])) errors.push(`${at}: unresolved name ${match[1]}`);
    }
    counts.push({ id: doc.id, rendition: name, spokenWords: count });
  }
}
const evidence = { checkedAt: new Date().toISOString(), purpose: 'candidate mechanical validation', publicationReady: false, candidates: files.length, counts, errors };
fs.writeFileSync(path.join(batch, 'validation.json'), JSON.stringify(evidence, null, 2) + '\n');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${files.length} English candidate(s); human editorial review remains pending.`);
