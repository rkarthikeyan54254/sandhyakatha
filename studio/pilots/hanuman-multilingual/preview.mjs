import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const draft = JSON.parse(readFileSync(resolve(here, 'adaptations.json'), 'utf8'));
const sourceText = readFileSync(resolve(here, '../../../content/stories/hanuman-reminded.json'), 'utf8');
const source = JSON.parse(sourceText);
const lexicon = JSON.parse(readFileSync(resolve(here, '../../../content/lexicon.json'), 'utf8'));
assert.equal(source.id, draft.storyId);
assert.equal(source.version, draft.sourceVersion, 'Source changed: adaptations need review');
assert.equal(source.status, 'published');
assert.equal(draft.publicationApproved, false);
assert.equal(draft.rendition, 'short');
const requiredScenes = ['shore', 'limits', 'angada', 'silence', 'reminder', 'childhood', 'call', 'growth', 'declaration', 'promise', 'relief', 'mountain', 'landing'];
for (const lang of ['hi', 'ta']) {
  const edition = draft[lang];
  assert.equal(edition.blocks.filter(b => b.t === 'slow').length, 1);
  assert.equal(edition.blocks.at(-1).t, 'slow');
  assert.equal(edition.blocks.filter(b => b.t === 'beat').length, 2);
  for (const scene of requiredScenes) assert(edition.blocks.some(b => b.scene === scene), `Missing ${scene}`);
  const names = new Set(Object.values(draft.names).map(n => n[lang]));
  for (const b of edition.blocks) {
    assert(['p', 'beat', 'slow'].includes(b.t));
    for (const [, name] of (b.text ?? '').matchAll(/«([^»]+)»/g)) assert(names.has(name), `Unknown ${lang} name: ${name}`);
    assert.equal(((b.text ?? '').match(/_/g) ?? []).length % 2, 0, 'Unpaired speech marker');
  }
  assert.equal(edition.close.ifTheyAsk.length, 3);
  assert((lang === 'hi' ? /\p{Script=Devanagari}/u : /\p{Script=Tamil}/u).test(edition.title));
}
for (const name of Object.keys(draft.names)) assert(lexicon[name], `Missing canonical name: ${name}`);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const prose = s => esc(s).replace(/«([^»]+)»/g, '$1').replace(/_([^_]+)_/g, '<em>$1</em>');
const editions = {
  en: { ...source, blocks: source.lengths.short.blocks, traditionNote: source.source.traditionNote,
    parentNote: 'This telling briefly mentions a broken jaw from Indra’s thunderbolt. Keep it brief; do not elaborate the injury. Yojana is an old unit of distance; no kilometre conversion is needed here.' },
  hi: draft.hi, ta: draft.ta
};
const labels = {
  en: ['English', 'Published baseline · 3-minute edition', 'Pause', 'Slowly', 'After the story', 'Only if your child needs a starting point', 'If they ask', 'For the adult · not aloud', 'Source & tradition'],
  hi: ['हिन्दी', 'संपादकीय प्रारूप · पढ़ने का समय अभी मापा नहीं गया है', 'ठहरें', 'धीरे पढ़ें', 'कहानी के बाद', 'बच्चे को शुरुआत करने में मदद चाहिए, तभी', 'अगर बच्चा पूछे', 'आपके लिए · बच्चे को न पढ़कर सुनाएँ', 'स्रोत और परंपरा'],
  ta: ['தமிழ்', 'ஆய்வுக்கான வரைவு · வாசிக்கும் நேரம் இன்னும் அளவிடப்படவில்லை', 'சற்று நிறுத்தவும்', 'மெதுவாக வாசிக்கவும்', 'கதைக்குப் பிறகு', 'குழந்தைக்குப் பேசத் தொடங்க உதவி தேவைப்பட்டால் மட்டும்', 'குழந்தை கேட்டால்', 'வாசிப்பவருக்கு மட்டும் · குழந்தைக்கு வாசிக்க வேண்டாம்', 'மூலமும் மரபும்']
};
const panels = Object.entries(editions).map(([lang, e]) => {
  const l = labels[lang];
  return `<article id="${lang}" lang="${lang}" ${lang === 'en' ? '' : 'hidden'}><div class="eyebrow">${l[0]} / ${l[1]}</div><h2>${esc(e.title)}</h2><p class="tease">${esc(e.tease)}</p><div class="story">${e.blocks.map(b => b.t === 'beat' ? `<div class="beat" aria-label="${l[2]}">· · · <span>${l[2]}</span></div>` : `<div class="${b.t}">${b.t === 'slow' ? `<span class="cue">${l[3]}</span>` : ''}<p>${prose(b.text)}</p></div>`).join('')}</div><section class="close"><h3>${l[4]}</h3><p>${prose(e.close.question)}</p><details><summary>${l[5]}</summary><p>${prose(e.close.seed)}</p></details></section><section class="notes"><h3>${l[7]}</h3><p>${esc(e.parentNote)}</p><details><summary>${l[8]}</summary><p>${esc(e.traditionNote)}</p><p lang="en">Vālmīki Rāmāyaṇa · Kiṣkindhākāṇḍa 4.63–66. Separate curse background: Uttarakāṇḍa 7.36. Adaptation follows the existing approved source ledger; not a new independent source review.</p></details><h3>${l[6]}</h3>${e.close.ifTheyAsk.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section></article>`;
}).join('');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>One story, three voices · Sandhya Katha pilot</title><style>
*{box-sizing:border-box}body{margin:0;background:#f7f1e6;color:#292820;font-family:Georgia,serif}header{max-width:1100px;margin:auto;padding:48px 24px 24px}.eyebrow{font:12px/1.8 system-ui,sans-serif;letter-spacing:.04em;color:#75654d}h1{font-size:clamp(32px,5vw,52px);font-weight:400;margin:12px 0}header p{max-width:740px;line-height:1.7}.notice{padding:12px 16px;background:#ebe2d1;border-left:3px solid #a65a38;font:14px/1.6 system-ui,sans-serif}nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}button{font:16px/1.5 system-ui,sans-serif;padding:10px 20px;border:1px solid #b7a68a;border-radius:24px;background:transparent;color:#433c2d;cursor:pointer}button[aria-pressed=true]{background:#344d40;border-color:#344d40;color:white}button:focus-visible,summary:focus-visible{outline:3px solid #aa5935;outline-offset:3px}main{max-width:790px;margin:auto;padding:20px 24px 60px}article[hidden]{display:none}article h2{font-size:32px;font-weight:500;line-height:1.6;margin:12px 0}article p{font-size:21px;line-height:1.85;margin:0 0 17px}.tease{color:#73634c;font-style:italic;border-bottom:1px solid #d8cdb9;padding-bottom:25px}.story{padding-top:14px}em{font-style:normal;color:#70462d}.beat{margin:28px 0;color:#9f7751;letter-spacing:8px}.beat span,.cue{font:12px/1.8 system-ui,sans-serif;letter-spacing:0;color:#77654e}.slow{margin:28px 0;padding:18px 22px;border-left:3px solid #a65a38;background:#f0e7d8}.slow p{margin:6px 0}.close{padding-top:16px;border-top:1px solid #cbbda4}.notes{margin-top:32px;border-top:1px solid #cbbda4;padding-top:20px}.notes p,details p{font-size:17px;line-height:1.85}h3{font:600 15px/1.8 system-ui,sans-serif;color:#506052}summary{cursor:pointer;font-size:17px;line-height:1.8;padding:10px 0}details{border-bottom:1px solid #dfd4c0}footer{max-width:1000px;margin:auto;padding:20px 24px 40px;font:12px/1.8 system-ui,sans-serif;color:#75654d}article:lang(hi){font-family:'Kohinoor Devanagari','Noto Serif Devanagari',serif}article:lang(ta){font-family:'Tamil MN','Noto Serif Tamil',serif}article:lang(ta) p{font-size:20px;line-height:2}main.compare{max-width:1600px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px}main.compare article h2{font-size:25px}main.compare article p{font-size:18px}main.compare article{min-width:0}@media(max-width:1000px){main.compare{display:block}main.compare article{padding-bottom:48px;margin-bottom:30px;border-bottom:2px solid #b7a68a}}@media print{nav{display:none}article[hidden]{display:block}article{break-before:page}main.compare{display:block}.notice{background:none}}
</style><header><div class="eyebrow">SANDHYA KATHA / EDITORIAL LAB / ONE-STORY PILOT</div><h1>One story. Three voices.</h1><p>A complete short telling of Jāmbavān and Hanumān. English stays exactly as published; Hindi and Tamil reshape the breath and syntax, not the events.</p><div class="notice">Unpublished language drafts · AI-authored, not native-speaker certified. Hindi and Tamil require native read-aloud and editorial approval. Their duration is not yet measured. Ages 6+.</div><nav aria-label="Reading language"><button data-lang="en" aria-pressed="true">English</button><button data-lang="hi" lang="hi" aria-pressed="false">हिन्दी</button><button data-lang="ta" lang="ta" aria-pressed="false">தமிழ்</button><button data-lang="all" aria-pressed="false">Compare all three</button></nav></header><main>${panels}</main><footer>English: hanuman-reminded v${source.version}, short rendition, unchanged. Source SHA-256: ${createHash('sha256').update(sourceText).digest('hex')}<br>No analytics, network requests, audio synthesis or publication. A mechanical check cannot certify grammar, native voice or fidelity. Review criteria are in the pilot README.</footer><script>document.querySelectorAll('button[data-lang]').forEach(button=>button.addEventListener('click',()=>{const lang=button.dataset.lang;document.querySelectorAll('button[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('main').classList.toggle('compare',lang==='all');document.querySelectorAll('article').forEach(a=>a.hidden=lang!=='all'&&a.id!==lang);}));</script></html>`;
const output = process.argv[2];
assert(output && output.startsWith('/'), 'Provide an absolute output HTML path');
writeFileSync(output, html);
console.log(`Validated pilot structure; generated ${output}. Native read-aloud approval remains pending.`);
