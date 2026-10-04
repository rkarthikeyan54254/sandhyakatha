// Offline English editorial proof for source-grounded candidates only.
// Generating this page does not approve, promote, or publish a story.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../..');
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const lexicon = read(path.join(root, 'content/lexicon.json'));
const groups = ['early-four', 'middle-four', 'gated-five'];
const files = groups.flatMap(group => {
  const dir = path.join(batch, group, 'en');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(name => name.endsWith('.json')).sort().map(name => path.join(dir, name)) : [];
});
const documents = files.map(read).sort((a, b) => a.id.localeCompare(b.id));
const markup = value => esc(value).replace(/«([^»]+)»/g, (_, key) => `<strong>${esc(lexicon[key]?.display || key)}</strong>`).replace(/_([^_]+)_/g, '<em>$1</em>');
const spokenWords = rendition => rendition.blocks.filter(block => block.t !== 'aside' && block.text).map(block => block.text.replace(/[«»_]/g, '')).join(' ').split(/\s+/).filter(Boolean).length;
const blocks = rendition => rendition.blocks.map(block => {
  if (block.t === 'beat') return '<div class="beat" aria-hidden="true">· · ·</div>';
  if (block.t === 'aside') return `<aside><b>For the parent, not read aloud</b><p>${markup(block.text)}</p></aside>`;
  return `<p class="${block.t === 'slow' ? 'slow' : ''}">${markup(block.text)}</p>`;
}).join('');

const nav = documents.map(doc => `<li><a href="#${esc(doc.id)}">${esc(doc.title)}</a><span>${doc.audience?.gated ? 'Age gated · ' : ''}${esc(doc.status)}</span></li>`).join('');
const articles = documents.map(doc => {
  const tellings = ['short', 'full'].map(name => {
    const rendition = doc.lengths?.[name];
    if (!rendition) return '';
    return `<details class="telling" ${name === 'full' ? 'open' : ''}><summary>${name === 'short' ? 'Short' : 'Full'} telling · ${spokenWords(rendition)} spoken words · ${rendition.measuredSeconds == null ? 'timing pending' : `${rendition.measuredSeconds} seconds measured`}</summary><div class="prose">${blocks(rendition)}</div></details>`;
  }).join('');
  const asks = (doc.close?.ifTheyAsk || []).map(item => `<details><summary>${markup(item.q)}</summary><p>${markup(item.a)}</p></details>`).join('');
  const claims = (doc.source?.sourcing || []).map(item => `<li>${esc(item.claim)} <small>${esc(item.locus)}</small></li>`).join('');
  const checked = (doc.source?.checkedAgainst || []).map(item => `<li>${esc(item)}</li>`).join('');
  return `<article id="${esc(doc.id)}"><p class="eyebrow">${doc.audience?.gated ? `Age ${doc.audience.minAge}+ · gated · ` : ''}English candidate · ${esc(doc.status)}</p><h2>${esc(doc.title)}</h2><p class="tease">${markup(doc.tease)}</p>${doc.audience?.careNote ? `<aside class="care"><b>Parent care note</b><p>${markup(doc.audience.careNote)}</p></aside>` : ''}${tellings}<section class="closing"><h3>After the story</h3><p>${markup(doc.close?.question)}</p><p>${markup(doc.close?.seed)}</p>${asks}</section><section class="sources"><h3>Source ledger</h3><p>${esc(doc.source?.work)} · ${esc(doc.source?.locus)}</p><p>${esc(doc.source?.traditionNote)}</p><ol>${claims}</ol><h4>Checked against</h4><ul>${checked}</ul></section><p><a href="#contents">Back to contents</a></p></article>`;
}).join('');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Thirteen-story queue · English editorial candidates</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:wght@400;700&display=swap"><style>:root{color-scheme:dark;background:#17121c;color:#f4eadb;font:18px/1.7 'Gentium Book Plus',Georgia,serif}*{box-sizing:border-box}body{margin:0}a{color:#f4bc6d}header,article{max-width:900px;margin:34px auto;padding:24px;border:1px solid #6b5262;background:#211a28}h1{font-size:clamp(2rem,5vw,3rem);line-height:1.15}h2{font-size:2rem}h3{font-size:1.3rem}.status,.care{padding:14px 18px;border-left:4px solid #f4bc6d;background:#382934}.eyebrow{color:#f4bc6d;font:13px/1.5 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em}.tease{font-size:1.2rem}header li{margin:10px 0;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.telling{border-top:1px solid #6b5262;padding:15px 0}.telling summary{cursor:pointer;font-size:1.2rem}.prose{max-width:700px;margin:20px auto;font-size:1.2rem;line-height:1.85}.prose p{margin:0 0 1.1em}.prose aside{font-size:.85em;border-left:3px solid #f4bc6d;padding:6px 16px;background:#382934}.beat{text-align:center;color:#f4bc6d;margin:20px}.slow{color:#f4bc6d}.closing,.sources{max-width:700px;margin:30px auto}.sources{border-top:1px solid #6b5262}.sources li{margin:10px 0}.sources small{display:block;color:#d5c2cf}@media print{:root{color-scheme:light;background:white;color:black}header,article{background:white;color:black;break-before:page}}</style></head><body><header id="contents"><p>SandhyaKatha · 4 October 2026</p><h1>English editorial candidates</h1><p class="status">Draft review proof only. No story on this page is approved or published. Word counts are planning figures; read-aloud durations require measurement. Hindi and Tamil native-language reviews, imagery, and release gates remain separate.</p><ol>${nav || '<li>No candidate has passed the source gate yet.</li>'}</ol></header>${articles}</body></html>`;
fs.writeFileSync(path.join(batch, 'review.html'), html);
fs.writeFileSync(path.join(batch, 'review-data.json'), JSON.stringify({ generatedAt: new Date().toISOString(), purpose: 'offline English editorial review', publicationReady: false, candidates: documents.map(doc => ({ id: doc.id, status: doc.status, shortWords: doc.lengths?.short ? spokenWords(doc.lengths.short) : null, fullWords: doc.lengths?.full ? spokenWords(doc.lengths.full) : null })) }, null, 2) + '\n');
console.log(`Generated English review proof for ${documents.length} candidate(s).`);
