#!/usr/bin/env node
/**
 * The proof sheet: everything awaiting approval, laid out to be reviewed
 * rather than parsed.
 *
 * The point is the right-hand column. It holds the sourcing block — every
 * claim the draft was allowed to make, with where it came from — beside the
 * prose it produced. That turns review from "is this true?", which needs an
 * expert, into "is anything in the story missing from this list?", which does
 * not. An invented detail has nowhere to hide.
 *
 *   npm run proof          # writes proof/index.html and prints the path
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const lex = read('content/lexicon.json');

const mark = t => esc(t)
  .replace(/«([^»]+)»/g, (_, n) => `<b class="n" title="${esc(lex[n]?.say ?? '')}">${n}</b>`)
  .replace(/_([^_]+)_/g, '<em>$1</em>');

const rendition = r => r.blocks.map(b => b.t === 'beat'
  ? '<div class="beat"><span>pause</span></div>'
  : b.t === 'aside'
    ? `<aside class="note"><span>for you, not aloud</span><p>${mark(b.text)}</p></aside>`
    : `<p${b.t === 'slow' ? ' class="slow"' : ''}>${mark(b.text)}</p>`).join('');

const stories = readdirSync(join(ROOT, 'content/stories'))
  .filter(f => f.endsWith('.json')).map(f => read(`content/stories/${f}`))
  .filter(s => s.status === 'in-review')
  .sort((a, b) => a.id.localeCompare(b.id));

const CHECKS = [
  'The locus is real — I opened the edition and the episode is where it says.',
  'Nothing in the prose is missing from the sourcing block on the right.',
  'Where the tellings differ, the variant we chose is the one the note claims.',
  'Names, relationships and birth order are right for the tradition we are telling.',
  'The age floor is honest — I would read this tonight to a child of exactly that age.',
  'I read both lengths out loud, all the way through, without stumbling.',
  'The closing question cannot be answered right or wrong.',
];

const card = s => {
  const names = new Set();
  for (const L of Object.values(s.lengths)) for (const b of L.blocks)
    for (const m of (b.text ?? '').matchAll(/«([^»]+)»/g)) names.add(m[1]);
  return `
<article class="story" id="${s.id}">
  <header>
    <p class="kick">${esc(s.source.work)} · ${esc(s.source.locus)} · ages ${s.audience.minAge}+ ·
       ${Object.entries(s.lengths).map(([k,v])=>`${k} ${v.minutes} min`).join(' · ')}</p>
    <h2>${esc(s.title)}</h2>
    <p class="tease">${esc(s.tease)}</p>
  </header>

  <div class="cols">
    <div class="prose">
      <p class="lab">The full telling</p>
      ${rendition(s.lengths.full)}
      <p class="lab">Then, to the child</p>
      <div class="close">
        <p class="q">${mark(s.close.question)}</p>
        <p class="seed">If they shrug: <b>${esc(s.close.seed)}</b></p>
        ${(s.close.ifTheyAsk ?? []).map(f => `<details><summary>“${esc(f.q)}”</summary><p>${mark(f.a)}</p></details>`).join('')}
      </div>
      <p class="lab">The short telling</p>
      ${rendition(s.lengths.short)}
    </div>

    <aside class="panel">
      <div class="box">
        <p class="lab">Everything this story was allowed to say</p>
        <ol class="src">${(s.source.sourcing ?? [{claim:'— no sourcing block —',locus:''}])
          .map(c => `<li>${esc(c.claim)}<span>${esc(c.locus)}</span></li>`).join('')}</ol>
        <p class="fine">If a detail in the prose is not on this list, it was invented. That is the whole check.</p>
      </div>

      ${s.source.variants?.length ? `<div class="box">
        <p class="lab">Where the tellings differ</p>
        ${s.source.variants.map(v => `<div class="var"><b>${esc(v.differs)}</b>
          <p>${esc(v.tellings)}</p><p class="we">We tell: ${esc(v.weTell)}</p></div>`).join('')}
      </div>` : ''}

      ${s.audience.careNote ? `<div class="box care">
        <p class="lab">Before a parent begins</p><p>${esc(s.audience.careNote)}</p>
        <p class="fine">Flagged: ${(s.audience.sensitivity ?? []).join(' · ') || 'nothing'}</p></div>` : ''}

      <div class="box">
        <p class="lab">Names, as the parent will hear them</p>
        <ul class="say">${[...names].map(n => `<li><b>${n}</b> <i>${esc(lex[n]?.say ?? '—')}</i></li>`).join('')}</ul>
      </div>

      <div class="box">
        <p class="lab">Checked against the edition</p>
        <ul class="ed">${(s.source.checkedAgainst ?? []).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
      </div>

      <div class="box check">
        <p class="lab">Before approving</p>
        ${CHECKS.map((c,i) => `<label><input type="checkbox" id="${s.id}-${i}"> ${esc(c)}</label>`).join('')}
        <code>npm run approve -- ${s.id}</code>
      </div>
    </aside>
  </div>
</article>`;
};

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Awaiting approval · Sandhya Katha</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Tiro+Devanagari+Sanskrit&display=swap">
<style>
:root{--night:#14101c;--lamp:#f0b458;--lamp-dim:#a97c3a;--ember-lit:#e0937f;--paper:#f3e7d3;--paper-dim:#c9baa4;--muted:#948aa6;--line:#302941}
*{box-sizing:border-box}
body{margin:0;background:var(--night);color:var(--paper);font-family:Karla,system-ui,sans-serif}
.w{max-width:1180px;margin:0 auto;padding:0 24px 80px}
.top{padding:40px 0 20px;border-bottom:1px solid var(--line)}
.top h1{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:38px;margin:8px 0 0}
.top p{color:var(--muted);font-size:14px;line-height:1.6;margin:12px 0 0;max-width:60ch}
.story{padding:44px 0;border-bottom:1px solid var(--line)}
.kick{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--lamp-dim);font-weight:700;margin:0}
.story h2{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:32px;margin:10px 0 0}
.tease{font-family:"Gentium Book Plus",serif;font-size:17px;color:var(--paper-dim);margin:8px 0 0}
.cols{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;margin-top:26px}
@media(min-width:960px){.cols{grid-template-columns:minmax(0,1fr) 360px;gap:44px}
 aside.panel{position:sticky;top:20px;align-self:start;max-height:calc(100vh - 40px);overflow-y:auto}}
.lab{font-size:10px;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:26px 0 10px}
.prose .lab:first-child{margin-top:0}
.prose p{font-family:"Gentium Book Plus",Georgia,serif;font-size:19px;line-height:1.72;margin:0 0 18px}
.prose em{color:#ffe3b0}.prose .n{font-weight:400;color:var(--lamp);cursor:help}
p.slow{border-left:2px solid var(--lamp);padding-left:14px}
.beat{display:flex;align-items:center;gap:10px;margin:0 0 18px;color:var(--lamp-dim)}
.beat:before,.beat:after{content:"";flex:1;height:1px;background:var(--line)}
.beat span{font-size:9px;letter-spacing:.2em;text-transform:uppercase;font-weight:700}
aside.note{margin:0 0 18px;padding:11px 14px;border-left:2px solid var(--line);
  background:rgba(148,138,166,.07);border-radius:0 8px 8px 0}
aside.note span{display:block;font-family:Karla,system-ui,sans-serif;font-size:9.5px;letter-spacing:.2em;
  text-transform:uppercase;font-weight:700;color:var(--muted);margin-bottom:6px}
aside.note p{font-family:Karla,system-ui,sans-serif;font-size:14px;line-height:1.6;color:var(--paper-dim);margin:0}
.close{border:1px solid rgba(240,180,88,.34);border-radius:14px;padding:18px;background:rgba(240,180,88,.06)}
.close .q{font-size:20px;color:#ffe9c4;margin:0}
.close .seed{font-size:15px;font-style:italic;color:var(--paper-dim)}
details{border-top:1px solid rgba(240,180,88,.2);padding-top:10px;margin-top:10px}
summary{cursor:pointer;font-family:Karla,sans-serif;font-size:12.5px;font-weight:700;color:var(--paper-dim)}
details p{font-size:15px;margin-top:8px}
.box{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:14px;background:#1b1526}
.box .lab{margin-top:0}
.src{margin:0;padding-left:20px;font-size:13.5px;line-height:1.55}
.src li{margin-bottom:9px;color:var(--paper-dim)}
.src span{display:block;font-size:11px;color:var(--lamp-dim);margin-top:2px}
.fine{font-size:11.5px;color:var(--muted);line-height:1.55;margin:12px 0 0}
.var b{font-size:13px;color:var(--ember-lit)}.var p{font-size:13px;color:var(--paper-dim);line-height:1.55;margin:5px 0 0}
.var .we{color:var(--lamp);font-weight:600}
.care{border-color:rgba(201,87,63,.45)}.care p{font-size:13px;line-height:1.6;color:var(--paper-dim);margin:0}
.say{list-style:none;margin:0;padding:0;font-size:13px;columns:2;column-gap:16px}
.say li{margin-bottom:6px;break-inside:avoid}.say i{color:var(--lamp);font-style:normal}
.ed{margin:0;padding-left:18px;font-size:12.5px;color:var(--paper-dim);line-height:1.6}
.check label{display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--paper-dim);margin-bottom:10px;cursor:pointer}
.check input{margin-top:3px;accent-color:var(--lamp);width:15px;height:15px;flex:none}
.check code{display:block;margin-top:12px;padding:10px;background:#241c33;border:1px solid var(--line);
 border-radius:8px;font-size:12.5px;color:var(--lamp);user-select:all}
.none{padding:60px 0;font-family:"Gentium Book Plus",serif;font-size:19px;color:var(--muted)}
</style></head><body><div class="w">
<div class="top">
  <p class="kick">Sandhya Katha · proof sheet</p>
  <h1>${stories.length} awaiting your approval</h1>
  <p>Read the left column out loud. Check it against the right: <b>every claim the draft was allowed to
  make, and where it came from.</b> Anything in the prose that is not on that list was invented — which is
  a check you can run without being a Sanskritist. Nothing here is on the site until you approve it.</p>
</div>
${stories.length ? stories.map(card).join('') : '<p class="none">Nothing waiting. The shelf and the drafts agree.</p>'}
</div></body></html>`;

mkdirSync(join(ROOT, 'proof'), { recursive: true });
writeFileSync(join(ROOT, 'proof/index.html'), html);
console.log(`proof sheet: ${stories.length} stor${stories.length === 1 ? 'y' : 'ies'} → proof/index.html`);
