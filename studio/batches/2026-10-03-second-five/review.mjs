// Offline editorial proof. Generates a local HTML file; never approves or publishes content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const batch = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(batch, '../../..');
const ids = ['lingodbhava-pillar', 'bhagiratha-ganga', 'sukanya-anthill', 'brahmin-and-the-pot', 'ravana-lifts-kailasa'];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const lex = read(path.join(root, 'content/lexicon.json'));
const spoken = rendition => rendition.blocks.filter(block => block.t !== 'aside' && block.text).map(block => block.text.replace(/[«»_]/g, '')).join(' ').split(/\s+/).filter(Boolean).length;
const label = { en: 'English', hi: 'हिन्दी', ta: 'தமிழ்' };
const edition = (id, lang) => lang === 'en'
  ? read(path.join(root, `content/stories/${id}.json`))
  : read(path.join(batch, `locales/${lang}/${id}.json`));
const markup = (text, doc) => esc(text).replace(/«([^»]+)»/g, (_, key) => `<strong>${esc(doc.displayNames?.[key] || lex[key]?.display || key)}</strong>`).replace(/_([^_]+)_/g, '<em>$1</em>');
const paragraphs = (rendition, doc) => rendition.blocks.map(block => {
  if (block.t === 'beat') return '<div class="beat" aria-hidden="true">· · ·</div>';
  if (block.t === 'aside') return `<aside><b>For the parent, not read aloud</b><p>${markup(block.text, doc)}</p></aside>`;
  return `<p class="${block.t === 'slow' ? 'slow' : ''}">${markup(block.text, doc)}</p>`;
}).join('');

const cards = [];
const nav = [];
const validation = { generatedAt: new Date().toISOString(), purpose: 'offline editorial review', publicationReady: false, stories: [] };
for (const id of ids) {
  const en = edition(id, 'en');
  const record = { id, source: `${en.source.work} · ${en.source.locus}`, editions: {} };
  nav.push(`<li><span>${esc(en.title)}</span><span>${['en', 'hi', 'ta'].map(lang => `<a href="#${id}-${lang}">${label[lang]}</a>`).join(' · ')}</span></li>`);
  for (const lang of ['en', 'hi', 'ta']) {
    const doc = edition(id, lang);
    const counts = Object.fromEntries(Object.entries(doc.lengths).map(([name, rendition]) => [name, spoken(rendition)]));
    record.editions[lang] = { status: doc.status, spokenWords: counts, measuredSeconds: Object.fromEntries(Object.entries(doc.lengths).map(([name, rendition]) => [name, rendition.measuredSeconds ?? null])) };
    const gate = lang === 'en' ? 'English editorial approval pending' : 'Native language editor, source fidelity, and timed read-aloud review pending';
    const notes = `<details class="notes"><summary>Parent and source notes</summary><p>${markup(doc.parentNote || en.audience.careNote || '', doc)}</p><p>${markup(doc.traditionNote || en.source.traditionNote || '', doc)}</p></details>`;
    const lengths = ['short', 'full'].map(name => {
      const rendition = doc.lengths[name];
      return `<details class="telling" ${name === 'full' ? 'open' : ''}><summary>${name === 'short' ? 'Short' : 'Full'} telling <span>${counts[name]} spoken words · ${rendition.measuredSeconds == null ? 'timing pending' : `${rendition.measuredSeconds} seconds measured`}</span></summary><div class="prose">${paragraphs(rendition, doc)}</div></details>`;
    }).join('');
    const questions = (doc.close?.ifTheyAsk || []).map(item => `<details><summary>${markup(item.q, doc)}</summary><p>${markup(item.a, doc)}</p></details>`).join('');
    cards.push(`<article id="${id}-${lang}" lang="${lang}" class="edition"><div class="edition-head"><span>${label[lang]} · ${esc(doc.status)}</span><span>${gate}</span></div><h2>${esc(doc.title)}</h2><p class="tease">${markup(doc.tease, doc)}</p>${lang === 'en' ? `<img class="hero" src="art/${id}-candidate.webp" alt="Illustration candidate for ${esc(en.title)}">` : ''}${notes}${lengths}<div class="closing"><h3>After the story</h3><p>${markup(doc.close.question, doc)}</p><p>${markup(doc.close.seed, doc)}</p>${questions}</div><p class="back"><a href="#contents">Back to contents</a></p></article>`);
  }
  validation.stories.push(record);
}

const ledgers = ids.map(id => {
  const en = edition(id, 'en');
  return `<section class="ledger" id="${id}-sources"><h2>${esc(en.title)} · source ledger</h2><p>${esc(en.source.work)} · ${esc(en.source.locus)}</p><p>${esc(en.source.traditionNote || '')}</p><ol>${en.source.sourcing.map(claim => `<li>${esc(claim.claim)} <small>${esc(claim.locus)}</small></li>`).join('')}</ol><h3>Checked against</h3><ul>${en.source.checkedAgainst.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section>`;
}).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Second five stories · editorial review</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:wght@400;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&display=swap"><style>:root{color-scheme:dark;background:#17121c;color:#f4eadb;font:17px/1.7 'Gentium Book Plus','Noto Serif Devanagari','Noto Serif Tamil',serif}*{box-sizing:border-box}body{margin:0}a{color:#f4bc6d}header,.edition,.ledger{max-width:900px;margin:34px auto;padding:24px}header{border:1px solid #8e6846;background:#271d29}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.15}h2{font-size:2rem;line-height:1.3}h3{font-size:1.25rem}header ol{padding-left:24px}header li{margin:12px 0;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.status{padding:16px;border-left:4px solid #f4bc6d;background:#382934}.edition{border:1px solid #5d475f;background:#211a28}.edition-head{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;color:#f4bc6d;font:13px/1.5 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em}.tease{font-size:1.2rem}.hero{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:8px}.notes{margin:20px 0;background:#32283a;padding:12px 18px}.telling{border-top:1px solid #5d475f;padding:14px 0}.telling summary{font-size:1.25rem;cursor:pointer}.telling summary span{font:14px system-ui,sans-serif;color:#cdbdca;margin-left:12px}.prose{max-width:700px;margin:20px auto;font-size:1.2rem;line-height:1.85}.prose p{margin:0 0 1.1em}.prose aside{font-size:.85em;border-left:3px solid #f4bc6d;padding:5px 16px;background:#32283a}.beat{text-align:center;color:#f4bc6d;margin:20px}.slow{color:#f4bc6d}.closing{max-width:700px;margin:28px auto}.closing details{margin:12px 0}.back{font:14px system-ui,sans-serif}.ledger{border-top:1px solid #8e6846}.ledger li{margin:10px 0}.ledger small{display:block;color:#cdbdca}@media print{body{background:white;color:black}.edition{break-before:page;background:white;color:black}}</style></head><body><header id="contents"><p>SandhyaKatha · review proof · 3 October 2026</p><h1>Five stories in three languages</h1><p class="status">These are draft editions for editorial review. Word counts are shown for planning; read-aloud durations have not been measured. The illustrations are candidates. No edition or image on this page is approved for production.</p><ol>${nav.join('')}</ol><p>Review each short and full telling, its parent/source notes, and the five illustrations. Source ledgers follow the stories.</p></header>${cards.join('')}${ledgers}</body></html>`;
fs.writeFileSync(path.join(batch, 'review.html'), html);
fs.writeFileSync(path.join(batch, 'review-data.json'), JSON.stringify(validation, null, 2) + '\n');
console.log(`Generated review.html for ${cards.length} editions.`);
