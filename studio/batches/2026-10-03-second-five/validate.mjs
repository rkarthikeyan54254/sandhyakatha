// Review-stage checks only. A PASS does not grant human approval or publication.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { gitBlobSha1 } from '../../../scripts/lib/locale-content.mjs';

const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../..');
const ids = ['lingodbhava-pillar', 'bhagiratha-ganga', 'sukanya-anthill', 'brahmin-and-the-pot', 'ravana-lifts-kailasa'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const ajv = addFormats(new Ajv({ allErrors: true, strict: false }));
const checkSchema = ajv.compile(read(path.join(root, 'schema/story-locale.schema.json')));
const lex = read(path.join(root, 'content/lexicon.json'));
const errors = [];
const counts = [];
const assert = (ok, message) => { if (!ok) errors.push(message); };
const words = rendition => rendition.blocks.filter(block => block.t !== 'aside' && block.text).map(block => block.text.replace(/[«»_]/g, '')).join(' ').split(/\s+/).filter(Boolean).length;

for (const id of ids) {
  const raw = fs.readFileSync(path.join(root, `content/stories/${id}.json`), 'utf8');
  const en = JSON.parse(raw);
  assert(en.status === 'in-review', `${id}: English must remain in-review`);
  const row = { storyId: id, en: Object.fromEntries(Object.entries(en.lengths).map(([name, rendition]) => [name, words(rendition)])) };
  for (const lang of ['hi', 'ta']) {
    const file = path.join(batch, `locales/${lang}/${id}.json`);
    if (!fs.existsSync(file)) { errors.push(`${lang}/${id}: missing edition`); continue; }
    const doc = read(file);
    if (!checkSchema(doc)) errors.push(`${lang}/${id}: ${ajv.errorsText(checkSchema.errors)}`);
    assert(doc.storyId === id && doc.language === lang && doc.locale === `${lang}-IN`, `${lang}/${id}: identity mismatch`);
    assert(doc.sourceVersion === en.version && doc.sourceBlobSha1 === gitBlobSha1(raw), `${lang}/${id}: source hash/version mismatch`);
    assert(['draft', 'in-review'].includes(doc.status), `${lang}/${id}: must remain unapproved`);
    for (const gate of [doc.review?.languageEditor, doc.review?.sourceFidelity, doc.review?.nativeReadAloud?.short, doc.review?.nativeReadAloud?.full])
      assert(gate?.status === 'pending' && gate?.reviewer == null && gate?.reviewedOn == null, `${lang}/${id}: human gate must remain pending`);
    const sourceRefs = [doc.sourceMap?.tease, doc.sourceMap?.parentNote, doc.sourceMap?.traditionNote, ...(doc.sourceMap?.ifTheyAsk || []), ...Object.values(doc.sourceMap?.scenes || {})];
    for (const refs of sourceRefs) assert(Array.isArray(refs) && refs.length > 0 && refs.every(n => Number.isInteger(n) && n >= 0 && n < en.source.sourcing.length), `${lang}/${id}: invalid source map`);
    assert(doc.sourceMap?.ifTheyAsk?.length === doc.close?.ifTheyAsk?.length, `${lang}/${id}: follow-up source map mismatch`);
    const strings = [doc.title, doc.tease, doc.parentNote, doc.traditionNote, doc.close?.question, doc.close?.seed, ...(doc.close?.ifTheyAsk || []).flatMap(item => [item.q, item.a])];
    row[lang] = {};
    for (const name of ['short', 'full']) {
      const rendition = doc.lengths?.[name];
      if (!rendition) { errors.push(`${lang}/${id}: missing ${name}`); continue; }
      const count = words(rendition);
      row[lang][name] = count;
      // Whitespace tokens are not comparable across Hindi and agglutinative Tamil.
      // These are completeness floors, not timing certification; only a human read-aloud can grant that.
      const plausibleDraft = lang === 'hi'
        ? (name === 'short' ? count >= 295 && count <= 325 : count >= 640 && count <= 690)
        : (name === 'short' ? count >= 120 : count >= 220);
      assert(plausibleDraft, `${lang}/${id}: ${name} draft completeness (${count} whitespace tokens)`);
      assert(rendition.measuredSeconds == null, `${lang}/${id}: measurement must be pending`);
      assert(rendition.blocks.at(-1)?.t === 'slow', `${lang}/${id}: ${name} must land on a slow block`);
      for (const block of rendition.blocks) {
        assert(doc.sourceMap?.scenes?.[block.scene]?.length, `${lang}/${id}: unmapped ${name} scene ${block.scene}`);
        if (block.text) strings.push(block.text);
      }
    }
    for (const text of strings.filter(Boolean)) {
      assert((text.match(/«/g) || []).length === (text.match(/»/g) || []).length, `${lang}/${id}: unbalanced marker`);
      assert((text.match(/_/g) || []).length % 2 === 0, `${lang}/${id}: unbalanced spoken emphasis`);
      for (const match of text.matchAll(/«([^»]+)»/g)) assert(lex[match[1]] && doc.displayNames?.[match[1]], `${lang}/${id}: unresolved ${match[1]}`);
    }
  }
  counts.push(row);
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'sandhyakatha-second-five-'));
try {
  fs.mkdirSync(path.join(scratch, 'content'));
  fs.symlinkSync(path.join(batch, 'locales'), path.join(scratch, 'content/locales'));
  for (const file of ['content/native-language-moat.json', 'EDITORIAL.md', 'AGENTS.md']) fs.symlinkSync(path.join(root, file), path.join(scratch, file));
  execFileSync(process.execPath, [path.join(root, 'scripts/native-language-gates.mjs'), '--strict'], { env: { ...process.env, SANDHYAKATHA_ROOT: scratch }, stdio: 'pipe' });
} catch (error) {
  errors.push(`Native-language gate: ${String(error.stdout || error.stderr || error.message)}`);
} finally { fs.rmSync(scratch, { recursive: true, force: true }); }

const evidence = { checkedAt: new Date().toISOString(), status: errors.length ? 'FAIL' : 'PASS: review-stage mechanical checks only', publicationReady: false, humanApprovalPending: true, counts, errors };
fs.writeFileSync(path.join(batch, 'validation.json'), JSON.stringify(evidence, null, 2) + '\n');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`PASS: ${ids.length} English drafts, 10 staged locale drafts; human review remains pending.`);
