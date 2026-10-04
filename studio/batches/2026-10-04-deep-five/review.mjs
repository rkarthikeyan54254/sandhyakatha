// Offline five-story, fifteen-edition proof. Generates review artifacts only.
// No approval, content lock, public route, OG image, or social publication occurs here.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const batch = path.dirname(fileURLToPath(import.meta.url));
const ids = ['nrga-well', 'indra-virocana', 'dharma-vyadha', 'mainaka-welcome', 'devi-messenger'];
const langs = ['en', 'hi', 'ta'];
const label = { en: 'English', hi: 'हिन्दी', ta: 'தமிழ்' };
const displayNames = Object.fromEntries(['hi', 'ta'].map(lang => {
  const file = path.join(batch, 'locales', lang, 'display-names.json');
  if (!fs.existsSync(file)) throw new Error(`Missing native display-name map: ${file}`);
  return [lang, JSON.parse(fs.readFileSync(file, 'utf8'))];
}));
const esc = s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const sha = s => createHash('sha256').update(s).digest('hex');
const rawFile = (id, lang) => path.join(batch, lang === 'en' ? `en/${id}.md` : `locales/${lang}/${id}.md`);
const artFile = id => path.join(batch, 'art', ['dharma-vyadha','indra-virocana'].includes(id) ? `${id}-candidate-v2.webp` : `${id}-candidate.webp`);
const inline = (s, lang = 'en') => esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>').replace(/«([^»]+)»/g, (_, key) => {
  const value = lang === 'en' ? key : displayNames[lang]?.[key];
  if (!value) throw new Error(`No ${lang} display name for «${key}»`);
  return `<strong>${esc(value)}</strong>`;
}).replace(/_([^_]+)_/g, '<em>$1</em>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const htmlText = (s, lang = 'en') => s.trim().split(/\n\s*\n/).filter(Boolean).map(chunk => {
  const lines = chunk.trim().split('\n');
  if (lines.every(line => line.startsWith('- '))) return `<ul>${lines.map(line => `<li>${inline(line.slice(2), lang)}</li>`).join('')}</ul>`;
  return `<p>${inline(lines.join(' '), lang)}</p>`;
}).join('');
const words = s => s.replace(/[«»_*]/g, '').split(/\s+/).filter(Boolean).length;
function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const title = /^#\s+(.+)$/m.exec(raw)?.[1]?.replace(/\s+[—–-]\s+(English.*|Tamil.*|Hindi.*|source.*|review.*|editorial.*)$/i, '') || path.basename(file, '.md');
  const pieces = raw.split(/^##\s+(.+)\s*$/m);
  if (pieces.length < 7) throw new Error(`${file}: expected Short, Full and Parent notes sections`);
  const section = [];
  for (let i = 1; i < pieces.length; i += 2) section.push({ heading: pieces[i], body: pieces[i + 1].trim() });
  if (!/^Short\b/i.test(section[0].heading) || !/^Full\b/i.test(section[1].heading))
    throw new Error(`${file}: first two ## sections must be Short and Full`);
  return { title, intro: pieces[0].replace(/^#.*\n/, '').trim(), short: section[0].body, full: section[1].body, notes: section.slice(2), raw };
}
const records = [];
const nav = [];
const articles = [];
for (const id of ids) {
  const art = artFile(id);
  if (!fs.existsSync(art)) throw new Error(`Missing candidate art: ${art}`);
  const artRel = path.relative(batch, art).replaceAll(path.sep, '/');
  const sourceRel = `source-notes/${id}.md`;
  const sourcePath = path.join(batch, sourceRel);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing source note: ${sourcePath}`);
  const artHash = sha(fs.readFileSync(art));
  const ogRel = `og/${id}-candidate.jpg`;
  const ogPath = path.join(batch, ogRel);
  if (!fs.existsSync(ogPath)) throw new Error(`Missing OG candidate: ${ogPath}`);
  const ogHash = sha(fs.readFileSync(ogPath));
  const editions = {};
  const cells = [];
  for (const lang of langs) {
    const file = rawFile(id, lang);
    if (!fs.existsSync(file)) throw new Error(`Missing ${lang} draft for ${id}: ${file}`);
    const d = parse(file);
    const shortWords = words(d.short), fullWords = words(d.full);
    editions[lang] = { file: path.relative(batch, file), fileSha256: sha(d.raw), title: d.title, status: 'draft—human review pending', shortWords, fullWords, shortSha256: sha(d.short), fullSha256: sha(d.full), measuredSeconds: { short: null, full: null } };
    cells.push(`<article class="edition" id="${id}-${lang}" lang="${lang}"><div class="edition-tag">${label[lang]} · draft · timing and human review pending</div><h3>${inline(d.title, lang)}</h3><details class="telling"><summary>Short telling <small>${shortWords} whitespace words · timing pending</small></summary><div class="prose">${htmlText(d.short, lang)}</div></details><details class="telling" open><summary>Full telling <small>${fullWords} whitespace words · timing pending</small></summary><div class="prose">${htmlText(d.full, lang)}</div></details><details class="notes"><summary>Parent notes, source boundaries and after-story questions</summary><div>${htmlText(d.intro, lang)}${d.notes.map(n => `<h4>${inline(n.heading, lang)}</h4>${htmlText(n.body, lang)}`).join('')}</div></details><p class="back"><a href="#contents">Back to contents</a></p></article>`);
  }
  const heading = editions.en.title;
  nav.push(`<li><span>${inline(heading)}</span><span>${langs.map(lang => `<a href="#${id}-${lang}">${label[lang]}</a>`).join(' · ')}</span></li>`);
  articles.push(`<section class="story" id="${id}"><div class="story-head"><p class="eyebrow">Story-specific image candidate · approval pending</p><h2>${inline(heading)}</h2><figure><img src="${esc(artRel)}" alt="Unapproved illustration candidate for ${esc(heading)}"><figcaption>${id === 'dharma-vyadha' ? 'Revised market-only scene; original composite candidate rejected. ' : ''}Hero candidate SHA-256: ${artHash.slice(0, 16)}…</figcaption></figure><figure><img class="og" src="${ogRel}" alt="Unapproved share-card candidate for ${esc(heading)}"><figcaption>OG/WhatsApp card concept · review copy, not live · SHA-256: ${ogHash.slice(0, 16)}…</figcaption></figure><p class="source-link"><a href="${sourceRel}">Read claim-by-claim source ledger</a></p></div>${cells.join('')}</section>`);
  records.push({ id, sourceNote: sourceRel, sourceNoteSha256: sha(fs.readFileSync(sourcePath)), art: { file: artRel, sha256: artHash, status: 'candidate—human review pending' }, og: { file: ogRel, sha256: ogHash, status: 'candidate—human review pending' }, editions });
}
const css = `:root{color-scheme:dark;background:#15121c;color:#f2ebdf;font:17px/1.72 Georgia,'Noto Serif Devanagari','Noto Serif Tamil',serif}*{box-sizing:border-box}body{margin:0}a{color:#f6bd77}header,.story{max-width:1040px;margin:28px auto;padding:24px}header{border:1px solid #806548;background:#261d2b}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.15}h2{font-size:clamp(1.7rem,4vw,2.5rem)}h3{font-size:1.7rem}.status{padding:16px 20px;border-left:4px solid #f6bd77;background:#382a38}.eyebrow,.edition-tag{font:600 13px/1.5 system-ui,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#f6bd77}header li{margin:12px 0;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}.story{border-top:2px solid #806548}.story-head img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px}.story-head img.og{aspect-ratio:1200/630;object-fit:contain}.story-head figcaption{font:13px/1.5 system-ui,sans-serif;color:#cbbacd;padding-top:8px}.edition{margin:24px 0;padding:22px;border:1px solid #55435b;background:#211b29;scroll-margin-top:16px}.telling,.notes{border-top:1px solid #55435b;padding:16px 0}.telling summary,.notes summary{font-size:1.2rem;cursor:pointer}.telling small{font:14px system-ui,sans-serif;color:#cbbacd;margin-left:12px}.prose{max-width:740px;margin:20px auto;font-size:1.15rem;line-height:1.88}.prose p{margin:0 0 1.15em}.notes div{max-width:740px;margin:auto}.notes p{margin-bottom:1em}.back{font:14px system-ui,sans-serif}.source-link{font:14px system-ui,sans-serif}@media(max-width:620px){header,.story{padding:16px}.edition{padding:16px}.telling small{display:block;margin:5px 0}}@media print{body{background:white;color:black}.edition{break-before:page;background:white;color:black}.status{background:white;color:black}}`;
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Five deeper stories · fifteen-edition review</title><style>${css}</style></head><body><header id="contents"><p>SandhyaKatha · single review package</p><h1>Five deeper stories in three languages</h1><p class="status">Draft review proof: fifteen language editions, each with short and full tellings, plus five source-specific image candidates. These have not been read aloud or approved by Rama. Word counts are planning signals, not measured durations. No story or image in this proof is live.</p><ol>${nav.join('')}</ol><p>Please review the actual prose in all three languages, both lengths, parent notes and art. The source ledgers are linked under each image. OG/social cards and publication gates come after this editorial and art review.</p></header>${articles.join('')}</body></html>`;
fs.writeFileSync(path.join(batch, 'review.html'), page);
fs.writeFileSync(path.join(batch, 'review-data.json'), JSON.stringify({ generatedAt: new Date().toISOString(), publicationReady: false, reviewStatus: 'pending', stories: records }, null, 2) + '\n');
console.log(`Generated five-story, ${records.length * 3}-edition review proof.`);
