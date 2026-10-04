// Offline native-language draft proof. It does not grant approval or publish.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const batch = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(batch, 'middle-four', 'locales');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const files = ['hi', 'ta'].map(lang => path.join(dir, lang, 'boy-insults-shiva.json')).filter(fs.existsSync);
const docs = files.map(read);
const markup = (value, doc) => esc(value).replace(/«([^»]+)»/g, (_, key) => `<strong>${esc(doc.displayNames?.[key] || key)}</strong>`).replace(/_([^_]+)_/g, '<em>$1</em>');
const blocks = (rendition, doc) => rendition.blocks.map(block => {
  if (block.t === 'beat') return '<div class="beat" aria-hidden="true">· · ·</div>';
  if (block.t === 'aside') return `<aside><b>Parent note, not read aloud</b><p>${markup(block.text, doc)}</p></aside>`;
  return `<p class="${block.t === 'slow' ? 'slow' : ''}">${markup(block.text, doc)}</p>`;
}).join('');
const articles = docs.map(doc => `<article lang="${esc(doc.language)}" id="${esc(doc.language)}"><p class="eyebrow">${doc.language === 'hi' ? 'हिन्दी' : 'தமிழ்'} · draft · human language review pending</p><h2>${esc(doc.title)}</h2><p class="tease">${markup(doc.tease, doc)}</p><img class="hero" src="art/boy-insults-shiva-candidate.webp" alt="Unapproved art candidate"><p class="status">The image is a candidate. Both read-aloud durations are unmeasured for this language; the 3/6-minute labels are targets.</p>${['short','full'].map(name => `<details ${name === 'full' ? 'open' : ''}><summary>${name === 'short' ? 'Short' : 'Full'} telling · timing pending</summary><div class="prose">${blocks(doc.lengths[name], doc)}</div></details>`).join('')}<section class="close"><h3>After the story</h3><p>${markup(doc.close.question, doc)}</p><p>${markup(doc.close.seed, doc)}</p>${doc.close.ifTheyAsk.map(item => `<details><summary>${markup(item.q, doc)}</summary><p>${markup(item.a, doc)}</p></details>`).join('')}</section></article>`).join('');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Pārvatī · Hindi and Tamil drafts</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&display=swap"><style>:root{color-scheme:dark;background:#17121c;color:#f4eadb;font:18px/1.75 Georgia,serif}*{box-sizing:border-box}body{margin:0}header,article{max-width:880px;margin:28px auto;padding:24px;border:1px solid #6b5262;background:#211a28}article[lang=hi]{font-family:'Noto Serif Devanagari',serif}article[lang=ta]{font-family:'Noto Serif Tamil',serif}h1,h2{line-height:1.3}.eyebrow{color:#f4bc6d;font:13px system-ui,sans-serif}.status,aside{background:#382934;padding:12px 16px;border-left:4px solid #f4bc6d}.hero{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:8px}.tease{font-size:1.2rem}details{border-top:1px solid #6b5262;padding:12px 0}summary{cursor:pointer}.prose{max-width:690px;margin:24px auto;font-size:1.13rem}.prose p{margin:0 0 1.2em}.beat{text-align:center;color:#f4bc6d;margin:20px}.slow{color:#f4bc6d}.close{max-width:690px;margin:25px auto}</style></head><body><header><h1>Pārvatī · Hindi and Tamil draft proof</h1><p class="status">These are independently authored draft editions for human native-language, source, and timed read-aloud review. English approval does not approve these editions. Nothing here is published.</p><p>${docs.map(doc => `<a href="#${esc(doc.language)}">${doc.language === 'hi' ? 'हिन्दी' : 'தமிழ்'}</a>`).join(' · ')}</p></header>${articles}</body></html>`;
fs.writeFileSync(path.join(batch, 'review-locales.html'), html);
console.log(`Generated locale draft proof for ${docs.length} edition(s).`);
