#!/usr/bin/env node
/**
 * Static, shareable page per published story — the growth loop.
 *
 * A parent shares "the squirrel story" into a family WhatsApp group and the
 * link has to open into something real: the story, its source, the tradition
 * note. Not an app-store interstitial, and not a JavaScript shell that shows
 * a spinner in an in-app browser.
 *
 * The full telling goes public. The growth loop must deliver the thing the
 * social post promised; personalisation, history and tomorrow's choice accrue
 * in the app.
 *
 * Runs after `vite build`; Netlify serves an existing file before it applies
 * the SPA rewrite, so /s/<id>/ resolves here and every other path still boots
 * the app.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { displayTerm } from './lib/lexicon-display.mjs';
import { approvedHeroUrl } from './lib/media.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = process.env.SITE_URL ?? 'https://sandhyakatha.com';
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (s, n = 158) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';

const lex = read('content/lexicon.json');
const canon = read('content/canon.json').canon;
const cal = read('content/panchanga.json');
const fests = read('content/festivals.json').festivals;

/* ---------- follow + send ----------------------------------------------
 * A reader who has just finished a story is the highest-intent follower this
 * site will ever get, and until now the page gave them nowhere to go.
 * "Send to a parent" is first on purpose: a forward into a DM is both how this
 * actually spreads and the signal Instagram weighs most for reaching people
 * who do not already follow.
 */
const CHANNEL = 'https://whatsapp.com/channel/0029VbDPZyP8KMqsuZX2GJ10';
const INSTAGRAM = 'https://www.instagram.com/the_sandhyakatha/';

const FOLLOW_CSS = `
.send{margin:26px 0 0;padding:18px;border:1px solid var(--line);border-radius:14px;background:#1b1526}
.send p{margin:0 0 13px;font-size:13.5px;line-height:1.6;color:var(--paper-dim)}
.send button{display:block;width:100%;padding:13px 18px;border:0;border-radius:11px;background:var(--lamp);
 color:#2a1c08;font-family:Karla,system-ui,sans-serif;font-weight:700;font-size:14px;cursor:pointer}
.send button:hover{filter:brightness(1.06)}
.follow{margin:18px 0 0;display:flex;flex-wrap:wrap;gap:10px}
.follow a{flex:1 1 170px;display:flex;align-items:center;justify-content:center;gap:9px;padding:11px 14px;border:1px solid var(--line);border-radius:11px;text-decoration:none;color:var(--paper-dim);font-family:Karla,system-ui,sans-serif;font-size:13px;font-weight:600;text-align:left}
.follow a b{display:block;font-weight:600}
.ico{width:18px;height:18px;flex:none;display:block}
.send button .ico{width:17px;height:17px;margin-right:9px;vertical-align:-3px;display:inline-block}
.follow a:hover{border-color:var(--lamp-dim);color:var(--lamp)}
.follow small{display:block;font-weight:400;font-size:11px;color:var(--muted);margin-top:3px}
`;

/* Brand marks for the follow links. Inline SVG rather than an icon font:
 * the CSP allows no third-party script or font host, and these never 404. */
const WA_ICON = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.31-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.49-8.42"/></svg>`;
const IG_ICON = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.28 2.69.08 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88"/></svg>`;

function followBlock(shareText, url) {
  const payload = JSON.stringify({ text: shareText, url });
  return `<div class="send">
  <p>If you know a parent who would read this to their child tonight, this is the whole of how Sandhya Katha travels.</p>
  <button type="button" data-share='${payload.replace(/'/g, '&#39;')}'>${WA_ICON}Send this to a parent</button>
  <div class="follow">
    <a href="${CHANNEL}" target="_blank" rel="noopener">${WA_ICON}<span><b>Follow on WhatsApp</b><small>one story a night</small></span></a>
    <a href="${INSTAGRAM}" target="_blank" rel="noopener">${IG_ICON}<span><b>Follow on Instagram</b><small>@the_sandhyakatha</small></span></a>
  </div>
</div>
<script src="/share.js" defer></script>`;
}
const media = read('content/media.json').stories ?? {};

function approvedHero(s) {
  return approvedHeroUrl({ root: ROOT, story: s, media });
}
const STABILITY = {
  variant: 'The recensions differ here.',
  regional: 'Not in the Sanskrit — this one reaches us through a regional tradition.',
  folk: 'Oral tradition; there is no text to check it against.'
};


// Search landing pages over verified corpus metadata — never a second body of
// generated mythology prose. A page is emitted only once >=2 public stories
// exist, so the site does not manufacture thin SEO pages ahead of the corpus.
const CORPUS_META = {
  ramayana:          { slug: 'ramayana',        label: 'Rāmāyaṇa' },
  'other-ramayana':  { slug: 'other-ramayanas', label: 'Other Rāmāyaṇas' },
  mahabharata:       { slug: 'mahabharata',     label: 'Mahābhārata' },
  bhagavata:         { slug: 'bhagavata',       label: 'Bhāgavatam' },
  purana:            { slug: 'puranas',         label: 'Purāṇas' },
  'shiva-purana':    { slug: 'shiva-purana',    label: 'Śiva Purāṇa' },
  'vishnu-purana':   { slug: 'vishnu-purana',   label: 'Viṣṇu Purāṇa' },
  'other-purana':    { slug: 'other-puranas',   label: 'Other Purāṇas' },
  upanishad:         { slug: 'upanishads',      label: 'Upaniṣads' },
  nayanmar:          { slug: 'nayanmars',       label: 'Nāyaṉmārs' },
  alvar:             { slug: 'alvars',          label: 'Āḻvārs' },
  sant:              { slug: 'sants',           label: 'Sants of the North' },
  panchatantra:      { slug: 'panchatantra',     label: 'Pañcatantra' }
};

/** Same reading semantics as the React Reader: names are tappable; emphasis stays emphasis. */
function render(text, seen) {
  return String(text).split(/(«[^»]+»|_[^_]+_)/g).filter(Boolean).map(part => {
    if (part.startsWith('«')) {
      const t = part.slice(1, -1);
      const entry = lex[t];
      if (entry) seen.add(t);
      const display = displayTerm(lex, t);
      const native = entry?.native?.taml ?? entry?.native?.deva ?? '';
      return `<button type="button" class="name" data-term="${esc(t)}" data-say="${esc(entry?.say ?? '')}" data-gloss="${esc(entry?.gloss ?? '')}" data-native="${esc(native)}">${esc(display)}</button>`;
    }
    if (part.startsWith('_')) return `<em>${render(part.slice(1, -1), seen)}</em>`;
    return esc(part);
  }).join('');
}

function page(s) {
  const seen = new Set();
  const r = s.lengths.full;
  const hero = approvedHero(s);
  const body = r.blocks.map(b => b.t === 'beat'
    ? '<div class="beat"><span>pause</span></div>'
    : b.t === 'aside'
      ? `<aside class="note"><span>for you, not aloud</span><p>${render(b.text, seen)}</p></aside>`
      : `<p${b.t === 'slow' ? ' class="slow"' : ''}>${b.t === 'slow' ? '<span class="slowtag">slow down here</span>' : ''}${render(b.text, seen)}</p>`).join('\n');
  const asks = (s.close.ifTheyAsk ?? []).map(f =>
    `<details class="ask"><summary>If they ask: “${render(f.q, new Set())}”</summary><p>${render(f.a, new Set())}</p></details>`
  ).join('');
  const url = `${SITE}/s/${s.id}/`;
  // ?v= carries the story's own version so that revising a story busts the card
  // caches (WhatsApp especially) that would otherwise serve the old one for weeks.
  const og = existsSync(join(ROOT, `public/og/${s.id}.jpg`))
    ? `${SITE}/og/${s.id}.jpg?v=${s.version}`
    : `${SITE}/og/default.png`;
  const seoTitle = `${s.title} — ${s.source.work} story for children | Sandhya Katha`;
  const desc = clamp(`A ${r.minutes}-minute, source-checked ${s.source.work} story for children, from ${s.source.locus}. Ages ${s.audience.minAge}+. ${s.tease}`);
  // Link back up to any festival this story is tagged to. Without this the flow is
  // festival -> story only, and a growing corpus passes no authority to the pages
  // that actually have to rank.
  const myFests = ((canon.find(c => c.id === s.id) ?? {}).festivals ?? [])
    .filter(slug => fests[slug])
    .map(slug => ({ slug, name: fests[slug].plain ?? fests[slug].name }));
  const myCorpus = CORPUS_META[s.source.corpus];
  const corpusStoryCount = canon.filter(c =>
    c.corpus === s.source.corpus && c.status === 'published' && !c.gated
  ).length;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(seoTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="Sandhya Katha" href="${SITE}/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:site_name" content="Sandhya Katha">
<meta property="og:title" content="${esc(s.title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14101c">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8QPVB5L4QJ"></script>
<script src="/gtag-init.js"></script>
<script src="/report.js" defer></script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600&family=Noto+Serif+Tamil:wght@400;600&family=Tiro+Devanagari+Sanskrit&display=swap">
<link rel="stylesheet" href="/design-tokens.css">
<link rel="stylesheet" href="/story-media.css">
<link rel="stylesheet" href="/story-system.css">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ShortStory', name: s.title, url,
  description: desc, inLanguage: 'en', isBasedOn: `${s.source.work}, ${s.source.locus}`,
  typicalAgeRange: `${s.audience.minAge}-15`, isAccessibleForFree: true,
  publisher: { '@type': 'Organization', name: 'Sandhya Katha', url: SITE }
})}</script>
</head>
<body class="sk-story-page" data-locale="en" data-story-id="${esc(s.id)}" data-story-corpus="${esc(s.source.corpus)}"><div class="w">
<header class="story-head"><a href="/"><span class="mark" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -1 42 45" width="21" height="23" role="presentation"><defs><radialGradient id="skdiya" cx="50%" cy="62%" r="60%"><stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="#f0b458"/><stop offset="100%" stop-color="#e0873f"/></radialGradient></defs><path d="M7 0 C13 11 15 19 7 28 C-1 19 1 11 7 0 Z" fill="url(#skdiya)"/><ellipse cx="7" cy="21" rx="2.4" ry="5" fill="#fff6dd" opacity=".9"/><path d="M-13 32 Q7 47 27 32 Q7 38 -13 32 Z" fill="#a97c3a"/></svg></span><span><b>Sandhya Katha</b><i>संध्या कथा</i></span></a></header>
<nav class="locale-public-switch" data-locale-switch aria-label="Story language"><span class="langlabel">Language</span><a href="/s/${esc(s.id)}/" aria-current="page">English</a></nav>
<h1 class="story-title">${esc(s.title)}</h1>
<div class="attrib">
  <p><b>${esc(s.source.work)}</b> — ${esc(s.source.locus)}</p>
  ${s.source.traditionNote ? `<p class="t"><b>Tradition note.</b> ${esc(s.source.traditionNote)}</p>`
    : (STABILITY[s.source.stability] ? `<p class="t"><b>Note.</b> ${STABILITY[s.source.stability]}</p>` : '')}
  ${s.audience.careNote ? `<p class="c"><b>Before you begin.</b> ${esc(s.audience.careNote)}</p>` : ''}
</div>
<div class="meta"><span>Ages ${s.audience.minAge}+</span><span>${r.minutes} min aloud</span>${s.values.map(v => `<span>${esc(v)}</span>`).join('')}</div>
${hero ? `<figure class="storyart"><div class="storyart-frame"><img src="${esc(hero)}" alt="Illustration for ${esc(s.title)}" loading="eager" decoding="async"></div><figcaption>Illustration</figcaption></figure>` : ''}
<main class="prose">${body}</main>
<div class="turn"><span class="e">Now turn to your child</span>
  <p>${render(s.close.question, new Set())}</p>
  <p class="s">And if they shrug, you can leave it at this: <b>${render(s.close.seed, new Set())}</b></p>
</div>
${asks}
<details class="wrong">
  <summary>Something isn't right here</summary>
  <form data-report="${s.id}" data-version="${s.version}">
    <p>If a name, a detail or a tradition is wrong here, tell us. Nobody needs an account and we do not
      ask who you are — so please leave your own details out of the box.</p>
    <label class="hp"><span>Leave this empty</span><input name="hp" tabindex="-1" autocomplete="off"></label>
    <textarea rows="4" maxlength="2000" placeholder="What is wrong, and how do you know?"></textarea>
    <button type="submit">Send</button>
  </form>
</details>
${myCorpus && corpusStoryCount >= 2
  ? `<p class="belongs">More source-linked stories from <a href="/${myCorpus.slug}/">${esc(myCorpus.label)}</a>.</p>`
  : ''}
${myFests.length ? `<p class="belongs">Read on the night: ${myFests.map(f =>
  `<a href="/f/${f.slug}/">${esc(f.name)} stories for children</a>`).join(' · ')}</p>` : ''}
<div class="cta">
  <p>This is the complete telling. Sandhya Katha chooses one for your child's age and the calendar each night — free, nothing to install.</p>
  <a href="/">Open tonight's pick</a>
</div>
${followBlock(`${s.title} — tonight's story for the children. About ${r.minutes} minutes, read aloud, and it says at the top which text it comes from.`, url)}
<footer class="story-footer">Told from ${esc(s.source.work)}, ${esc(s.source.locus)}. Where traditions differ, we say so.<br>
Signed out, family reading history stays on your device. If you choose to sign in, it can be backed up to your account.<br>
<a href="/about/">About</a> · <a href="/privacy/">Privacy</a></footer>
</div>
<button type="button" class="lexpop" id="lexpop" hidden aria-live="polite">
  <b></b><span></span><i></i>
</button>
<script src="/lexicon.js" defer></script>
</body></html>`;
}


/* ---------- corpus landing pages ---------- */
/**
 * A corpus page is an index over already-published ground truth. It contains
 * no new story claims: title, tease, work/locus, age and stability all come
 * from approved story objects.
 */
function corpusPage(meta, stories) {
  const url = `${SITE}/${meta.slug}/`;
  const desc = `Source-linked ${meta.label} stories for children. Each story names its source and passage, age guidance, and where traditions or recensions differ.`;
  const ordered = stories.slice().sort((a, b) =>
    (canon.find(c => c.id === a.id)?.n ?? 9999) - (canon.find(c => c.id === b.id)?.n ?? 9999));
  const rows = ordered.map(s => {
    const stability = s.source.stability === 'stable' ? 'stable in the checked source'
      : s.source.stability === 'variant' ? 'variant'
      : s.source.stability === 'regional' ? 'regional tradition'
      : 'oral / folk tradition';
    return `<a class="srow" href="/s/${s.id}/">
  <b>${esc(s.title)}</b>
  <span>${esc(s.source.work)} · ${esc(s.source.locus)}</span>
  <span>Ages ${s.audience.minAge}+ · ${esc(stability)}</span>
  <i>${esc(s.tease)}</i>
  <em>Read the sourced telling →</em>
</a>`;
  }).join('\n');
  const itemList = ordered.map((s, i) => ({
    '@type': 'ListItem', position: i + 1,
    url: `${SITE}/s/${s.id}/`, name: s.title
  }));

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(meta.label)} stories for children · Sandhya Katha</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="Sandhya Katha" href="${SITE}/feed.xml"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website"><meta property="og:site_name" content="Sandhya Katha">
<meta property="og:title" content="${esc(meta.label)} stories for children — with sources">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og/default.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14101c">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8QPVB5L4QJ"></script><script src="/gtag-init.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Tiro+Devanagari+Sanskrit&display=swap">
<script type="application/ld+json">${JSON.stringify({
  '@context':'https://schema.org','@type':'CollectionPage',name:`${meta.label} stories for children`,
  url, description: desc, isAccessibleForFree: true,
  mainEntity: { '@type':'ItemList', itemListElement:itemList },
  publisher: { '@type':'Organization', name:'Sandhya Katha', url:SITE }
})}</script>
<style>
:root{--night:#14101c;--lamp:#f0b458;--lamp-dim:#a97c3a;--paper:#f3e7d3;--paper-dim:#c9baa4;--muted:#948aa6;--line:#302941}
*{box-sizing:border-box}body{margin:0;background:var(--night);color:var(--paper);font-family:Karla,system-ui,sans-serif;background-image:radial-gradient(900px 500px at 50% -10%,#282040 0,rgba(40,32,64,0) 70%);background-attachment:fixed}
.w{max-width:680px;margin:0 auto;padding:0 22px 70px}header{padding:22px 0 18px;border-bottom:1px solid var(--line)}header a{text-decoration:none;color:inherit}header b{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:18px;display:block}header i{font-style:normal;font-size:10px;color:var(--lamp-dim);display:block;margin-top:3px}
.kick{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--lamp-dim);font-weight:700;margin:28px 0 0}h1{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:clamp(32px,7vw,44px);line-height:1.14;margin:12px 0 0;text-wrap:balance}.lede{font-family:"Gentium Book Plus",Georgia,serif;font-size:19px;line-height:1.65;color:var(--paper-dim);margin:16px 0 8px}
.contract{margin:22px 0 8px;padding:15px 17px;border-left:2px solid var(--lamp);background:rgba(240,180,88,.06);font-size:13.5px;line-height:1.65;color:var(--paper-dim)}.contract b{color:var(--lamp)}h2{font-size:10.5px;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:34px 0 4px;padding-top:18px;border-top:1px solid var(--line)}
.srow{display:block;padding:18px 0;border-bottom:1px solid var(--line);text-decoration:none;color:inherit}.srow b{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:21px;display:block;line-height:1.3}.srow span{display:block;font-size:12px;color:var(--muted);margin-top:5px;line-height:1.5}.srow i{display:block;font-family:"Gentium Book Plus",Georgia,serif;font-style:normal;font-size:16.5px;line-height:1.58;color:var(--paper-dim);margin-top:10px}.srow em{display:inline-block;font-style:normal;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--lamp);margin-top:11px}a.srow:hover b{color:var(--lamp)}
.cta{margin-top:34px;padding:22px;border:1px solid var(--line);border-radius:14px;background:#1b1526;text-align:center}.cta p{margin:0 0 14px;font-size:14px;line-height:1.6;color:var(--paper-dim)}.cta a{display:inline-block;padding:13px 22px;border-radius:11px;background:var(--lamp);color:#2a1c08;font-weight:700;font-size:14px;text-decoration:none}footer{margin-top:30px;font-size:11.5px;color:var(--muted);line-height:1.7}footer a{color:var(--lamp-dim)}${FOLLOW_CSS}
</style></head><body><div class="w">
<header><a href="/"><b>Sandhya Katha</b><i>Rāmāyaṇa · Mahābhārata · Purāṇas · Upaniṣads</i></a></header>
<p class="kick">Source-linked collection</p><h1>${esc(meta.label)} stories for children</h1>
<p class="lede">Stories from ${esc(meta.label)}, laid out to read aloud. This page is generated from stories that have already passed Sandhya Katha's publication gate.</p>
<div class="contract"><b>What “with sources” means here.</b> Every story below names the work and passage we checked, carries age guidance, and says when the tradition is variant, regional or oral instead of smoothing those differences away.</div>
<h2>${ordered.length} published stories</h2>${rows}
<div class="cta"><p>Sandhya Katha chooses one story each night for your child's age and the calendar, and lays it out to be read aloud.</p><a href="/">Open tonight's story</a></div>
${followBlock(`${meta.label} stories for children — each one cited to its source and written to be read aloud.`, url)}
<footer>${SITE_NAV}</footer>
</div></body></html>`;
}


/* ---------- festival landing pages ---------- */
/**
 * The nights people actually search for. Each page carries the real date from
 * the pañcāṅga table, what the festival is in a parent's words, and the stories
 * the collection has tagged to it — written or still to come, marked honestly.
 */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const pretty = iso => { const d = new Date(iso + 'T12:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

function festivalDates(slug) {
  const today = new Date().toISOString().slice(0, 10);
  return Object.entries(cal.days)
    .filter(([, d]) => (d.festivals ?? []).includes(slug))
    .map(([date]) => date).sort().filter(d => d >= today).slice(0, 3);
}

function festivalPage(slug, f, written) {
  const dates = festivalDates(slug);
  const stories = canon.filter(c => (c.festivals ?? []).includes(slug) && !c.gated);
  const url = `${SITE}/f/${slug}/`;
  // The spelling people type, not the spelling we set. Falls back to the display name.
  const plain = f.plain ?? f.name;
  const desc = f.blurb.length > 158 ? f.blurb.slice(0, 155).replace(/\s+\S*$/, '') + '…' : f.blurb;
  // Dates as a sentence, for answers that quote them.
  const dateSentence = dates.length
    ? dates.map(d => pretty(d)).reduce((a, d, i, arr) =>
        i === 0 ? d : i === arr.length - 1 ? `${a} and ${d}` : `${a}, ${d}`, '') + '.'
    : '';
  const faq = (f.faq ?? []).map(x => ({ q: x.q, a: x.a.replace('{{dates}}', dateSentence).trim() }));
  const rows = stories.map(c => {
    const isWritten = written.has(c.id);
    const inner = `<b>${esc(c.title)}</b><span>${esc(c.work)} · ${esc(c.locus)} · ages ${c.minAge}+</span><i>${esc(c.hook)}</i>`;
    return isWritten
      ? `<a class="srow" href="/s/${c.id}/">${inner}<em class="go">Read it →</em></a>`
      : `<div class="srow soon">${inner}<em>Being written</em></div>`;
  }).join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(plain)} stories for children · Sandhya Katha</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="Sandhya Katha" href="${SITE}/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:site_name" content="Sandhya Katha">
<meta property="og:title" content="${esc(plain)} stories for children">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og/default.png">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#14101c">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8QPVB5L4QJ"></script>
<script src="/gtag-init.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Tiro+Devanagari+Sanskrit&display=swap">
<script type="application/ld+json">${JSON.stringify({
  '@context':'https://schema.org','@type':'CollectionPage',name:`${f.name} stories for children`,
  url, description: desc, isAccessibleForFree: true,
  about: { '@type':'Thing', name: f.name, ...(dates[0] ? { startDate: dates[0] } : {}) },
  publisher: { '@type':'Organization', name:'Sandhya Katha', url: SITE }
})}</script>
${faq.length ? `<script type="application/ld+json">${JSON.stringify({
  '@context':'https://schema.org','@type':'FAQPage',
  mainEntity: faq.map(x => ({ '@type':'Question', name: x.q,
    acceptedAnswer: { '@type':'Answer', text: x.a } }))
})}</script>` : ''}
<style>
:root{--night:#14101c;--lamp:#f0b458;--lamp-dim:#a97c3a;--ember-lit:#e0937f;--paper:#f3e7d3;--paper-dim:#c9baa4;--muted:#948aa6;--line:#302941}
*{box-sizing:border-box}
body{margin:0;background:var(--night);color:var(--paper);font-family:Karla,system-ui,sans-serif;
 background-image:radial-gradient(900px 500px at 50% -10%,#282040 0,rgba(40,32,64,0) 70%);background-attachment:fixed}
.w{max-width:640px;margin:0 auto;padding:0 22px 70px}
header{display:flex;align-items:center;gap:10px;padding:22px 0 18px;border-bottom:1px solid var(--line)}
header a{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}
header .mark{display:flex;align-items:center;flex:none}
header .mark svg{display:block}
header b{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:18px;display:block}
header i{font-style:normal;font-size:10px;letter-spacing:.05em;color:var(--lamp-dim);display:block;margin-top:3px}
.kick{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--lamp-dim);font-weight:700;margin:26px 0 0}
h1{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:clamp(30px,7vw,42px);line-height:1.14;margin:12px 0 0;text-wrap:balance}
.lede{font-family:"Gentium Book Plus",Georgia,serif;font-size:19px;line-height:1.62;color:var(--paper-dim);margin:16px 0 0}
.when{margin:20px 0 0;padding:14px 16px;border-left:2px solid var(--lamp);background:rgba(240,180,88,.06)}
.when b{display:block;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--lamp);margin-bottom:7px}
.when p{margin:0;font-size:14px;line-height:1.7;color:var(--paper-dim)}
.for{font-size:14px;line-height:1.7;color:var(--muted);margin:20px 0 0}
h2{font-size:10.5px;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:34px 0 4px;padding-top:18px;border-top:1px solid var(--line)}
.srow{display:block;padding:16px 0;border-bottom:1px solid var(--line);text-decoration:none;color:inherit}
.srow b{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:20px;display:block;line-height:1.3}
.srow span{display:block;font-size:12px;color:var(--muted);margin-top:5px}
.srow i{display:block;font-family:"Gentium Book Plus",Georgia,serif;font-style:normal;font-size:16px;
 line-height:1.6;color:var(--paper-dim);margin-top:9px}
.srow em{display:inline-block;font-style:normal;font-size:11px;letter-spacing:.13em;text-transform:uppercase;
 font-weight:700;color:var(--muted);margin-top:10px}
.srow .go{color:var(--lamp)}
.srow.soon{opacity:.6}
a.srow:hover b{color:var(--lamp)}
.cta{margin-top:32px;padding:22px;border:1px solid var(--line);border-radius:14px;background:#1b1526;text-align:center}
.cta p{margin:0 0 14px;font-size:14px;line-height:1.6;color:var(--paper-dim)}
.cta a{display:inline-block;padding:13px 22px;border-radius:11px;background:var(--lamp);color:#2a1c08;font-weight:700;font-size:14px;text-decoration:none}
${FOLLOW_CSS}
.names{margin:26px 0 0;padding:16px 18px;border:1px solid var(--line);border-radius:12px;background:rgba(148,138,166,.05)}
.names b{display:block;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:9px}
.names p{margin:0;font-family:"Gentium Book Plus",Georgia,serif;font-size:16.5px;line-height:1.68;color:var(--paper-dim)}
.faq{margin-top:34px;padding-top:18px;border-top:1px solid var(--line)}
.faq h2{margin-top:0;border-top:0;padding-top:0}
.faq dt{font-family:"Tiro Devanagari Sanskrit",serif;font-size:17px;color:var(--paper);margin:20px 0 0}
.faq dd{margin:8px 0 0;font-family:"Gentium Book Plus",Georgia,serif;font-size:16px;line-height:1.66;color:var(--paper-dim)}
footer{margin-top:30px;font-size:11.5px;color:var(--muted);line-height:1.7}
footer a{color:var(--lamp-dim)}
</style></head>
<body><div class="w">
<header><a href="/"><span class="mark" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -1 42 45" width="21" height="23" role="presentation"><defs><radialGradient id="skdiya" cx="50%" cy="62%" r="60%"><stop offset="0%" stop-color="#fff0c4"/><stop offset="60%" stop-color="#f0b458"/><stop offset="100%" stop-color="#e0873f"/></radialGradient></defs><path d="M7 0 C13 11 15 19 7 28 C-1 19 1 11 7 0 Z" fill="url(#skdiya)"/><ellipse cx="7" cy="21" rx="2.4" ry="5" fill="#fff6dd" opacity=".9"/><path d="M-13 32 Q7 47 27 32 Q7 38 -13 32 Z" fill="#a97c3a"/></svg></span><span><b>Sandhya Katha</b><i>Rāmāyaṇa · Mahābhārata · Purāṇas · Upaniṣads</i></span></a></header>
<p class="kick">${esc(f.also ? f.name + ' · ' + f.also : f.name)}</p>
<h1>${esc(f.name)} stories for children</h1>
<p class="lede">${esc(f.blurb)}</p>
${dates.length ? `<div class="when"><b>When it falls</b><p>${dates.map(d => pretty(d)).join('<br>')}</p></div>` : ''}
<p class="for">${esc(f.forParents)}</p>
${f.names ? `<div class="names"><b>Why it has more than one name</b><p>${esc(f.names)}</p></div>` : ''}
<h2>${stories.length} ${stories.length === 1 ? 'story' : 'stories'} for this night</h2>
${rows || '<p class="for">Stories for this night are still being written.</p>'}
${faq.length ? `<section class="faq"><h2>Questions parents ask</h2><dl>
${faq.map(x => `<dt>${esc(x.q)}</dt><dd>${esc(x.a)}</dd>`).join('\n')}
</dl></section>` : ''}
<div class="cta">
  <p>Sandhya Katha chooses one story each night against the pañcāṅga, for your child's age, and lays it out to be read aloud. Free, nothing to install.</p>
  <a href="/">Open tonight's story</a>
</div>
${followBlock(`${plain} stories for children — each one cited to its source and written to be read aloud.`, url)}
<footer>Dates computed with Swiss Ephemeris (Lahiri ayanāṃśa, amānta months, Chennai). Every story names its source, and says so when the tellings differ.<br>
${SITE_NAV}</footer>
</div></body></html>`;
}

const dist = join(ROOT, 'dist');
if (!existsSync(dist)) { console.error('run vite build first'); process.exit(1); }


/* ---------- static pages -------------------------------------------------
 * /about/ and /privacy/ are the two pages a stranger reads before they trust
 * the stories, and a school librarian or a directory reviewer reads before
 * they list us. They share one shell so they cannot drift apart visually.
 * Everything on them must stay true to what the code actually does — if the
 * analytics, the account shape or the studio pipeline changes, these change
 * in the same commit.
 */
const STATIC_CSS = `
:root{--night:#14101c;--lamp:#f0b458;--lamp-dim:#a97c3a;--paper:#f3e7d3;--paper-dim:#c9baa4;--muted:#948aa6;--line:#302941}
*{box-sizing:border-box}
body{margin:0;background:var(--night);color:var(--paper);font-family:Karla,system-ui,sans-serif;
 background-image:radial-gradient(900px 500px at 50% -10%,#282040 0,rgba(40,32,64,0) 70%);background-attachment:fixed}
.w{max-width:660px;margin:0 auto;padding:0 22px 70px}
header{padding:22px 0 18px;border-bottom:1px solid var(--line)}
header a{text-decoration:none;color:inherit}
header b{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:18px;display:block}
header i{font-style:normal;font-size:10px;color:var(--lamp-dim);display:block;margin-top:3px}
.kick{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--lamp-dim);font-weight:700;margin:28px 0 0}
h1{font-family:"Tiro Devanagari Sanskrit",serif;font-weight:400;font-size:clamp(30px,7vw,42px);line-height:1.14;margin:12px 0 0}
.lede{font-family:"Gentium Book Plus",Georgia,serif;font-size:19px;line-height:1.65;color:var(--paper-dim);margin:16px 0 0}
h2{font-size:11px;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);font-weight:700;margin:38px 0 0;padding-top:20px;border-top:1px solid var(--line)}
p{font-family:"Gentium Book Plus",Georgia,serif;font-size:17px;line-height:1.68;color:var(--paper-dim);margin:12px 0 0}
strong{color:var(--paper)}
em{color:var(--paper-dim)}
ul{margin:12px 0 0;padding-left:20px}
li{font-family:"Gentium Book Plus",Georgia,serif;font-size:17px;line-height:1.62;color:var(--paper-dim);margin-bottom:9px}
li::marker{color:var(--lamp-dim)}
.box{margin:20px 0 0;padding:15px 17px;border-left:2px solid var(--lamp);background:rgba(240,180,88,.06)}
.box p{font-size:16px;margin:0}
.box p + p{margin-top:9px}
a.lnk{color:var(--lamp)}
footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);font-size:11.5px;color:var(--muted);line-height:1.7}
footer a{color:var(--lamp-dim)}
`;

const SITE_NAV = '<a href="/">Home</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a> · <a href="/sitemap.xml">All pages</a>';

function staticPage({ slug, title, ogTitle, desc, kick, h1, lede, body, foot }) {
  const url = `${SITE}/${slug}/`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="Sandhya Katha" href="${SITE}/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article"><meta property="og:site_name" content="Sandhya Katha">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og/default.png">
<meta name="theme-color" content="#14101c">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital@0;1&family=Karla:wght@400;600;700&family=Tiro+Devanagari+Sanskrit&display=swap">
<style>${STATIC_CSS}</style></head>
<body><div class="w">
<header><a href="/"><b>Sandhya Katha</b><i>Rāmāyaṇa · Mahābhārata · Purāṇas · Upaniṣads</i></a></header>
<p class="kick">${esc(kick)}</p>
<h1>${h1}</h1>
<p class="lede">${lede}</p>
${body}
<footer>${foot}<br>
${SITE_NAV}</footer>
</div></body></html>`;
}

/* The counts are generated, never typed — a hand-written "63 stories" on a page
 * nobody remembers to edit is exactly the kind of small lie that costs trust. */
function aboutPage({ published, planned }) {
  return staticPage({
    slug: 'about',
    title: 'About · Sandhya Katha',
    ogTitle: 'About — Sandhya Katha',
    desc: 'A free, ad-free collection of Hindu stories for children, written to be read aloud in six minutes. Every story names the text it comes from, and says so where the tellings differ.',
    kick: 'About',
    h1: 'One story a night, and it tells you where it came from',
    lede: `A free collection of Hindu stories for children — the Rāmāyaṇa, the Mahābhārata, the Purāṇas and the Upaniṣads, and the Tamil and North Indian saints that most collections leave out. ${published} are written and published so far, of ${planned} planned.`,
    body: `
<div class="box"><p><strong>The short version.</strong> Every story names the work and the chapter it comes from, at the top of the page. Where the tellings genuinely differ, we print which one we are telling and why. It is free, there is no advertising, and you do not need an account to read any of it.</p></div>

<h2>Why it exists</h2>
<p>At twenty to nine at night, a parent does not want a generator. They want the one right story — already chosen, already checked, laid out for a voice — and a reason to come back tomorrow. You can ask a chat window for a bedtime story and it will give you one, but you will not know whether the ending was invented, and neither will your child.</p>

<h2>Every line has an address</h2>
<p>The source sits at the top of each story: <em>Bhāgavata Purāṇa, Skandha 10, chapters 24–25.</em> Underneath the collection, each story carries a list of the claims its writer was allowed to use, each tied to where it came from — so checking a story means checking it against that list, not against somebody's memory.</p>
<p>And where a telling is not the one you might expect, the page says so before the story starts. The squirrel who carried sand to the bridge is <strong>not in Vālmīki</strong> — it reaches us through the Tamil retellings, and that is printed rather than hidden. A parent who learns that has learned something true, and has learned that we tell them.</p>

<h2>Written for a voice, not an eye</h2>
<p>Short breath lines. A printed pause before the turn, where the reader stops. A last line marked to slow down for. Every name tappable for a respelling, so nobody has to guess <em>nuh-chi-KAY-taa</em> in front of a seven-year-old.</p>
<p>Each story exists in two lengths, and the short one is not the long one with paragraphs deleted — it is written separately, with its own turn and its own last line. Three minutes on a school night, six when there is time.</p>

<h2>It ends with a question, not a moral</h2>
<p>Every story closes with one open question to ask your child, a plain fallback line for when they shrug, and honest answers to the follow-ups children actually ask — including the awkward ones. <em>Was Indra bad, then?</em> gets a real answer, not a deflection. The moral is arrived at, not delivered.</p>

<h2>Ages, and the difficult ones</h2>
<p>Every story carries an age floor, set by asking whether we would read this, tonight, to a child of exactly that age — not by how famous it is. Where a story touches death, injustice or a parent doing real harm, a short note tells you what is actually coming, in plain words, before you begin. No parent should be ambushed at bedtime.</p>
<p>Nothing is cut from the collection. The Mahābhārata is a war and the Periya Purāṇam is in places brutal, and sanitising them produces a collection nobody needs. Instead the hardest stories are <strong>held behind a setting</strong>: they never turn up as tonight's pick until you switch them on, and the care note is shown first. You decide when your child is ready, because you are the only one who can.</p>

<h2>How a story gets here</h2>
<p>Choose the night, not the story. Pull the sources and write down every claim the telling is allowed to make. Draft the long version, then draft the short one separately. An age and care pass, a read-aloud pass, then the closing question. Then a person approves it. Then it is published.</p>
<p>Between those, the drafts go through mechanical checks and an adversarial review that argues against them from the editions. Those layers have caught real mistakes — a birth order taken from the wrong region, an episode quietly borrowed from the chapter next door, an Upaniṣad verse said to stop where it does not. They are also not enough on their own: <strong>checking a story against sources its own drafter chose is marking your own homework.</strong> That is why a person still reads every story out loud before it ships, and why the last check is the one below.</p>

<h2>When we are wrong</h2>
<p>At the foot of every story there is a link to tell us something is wrong. It takes no account and asks for no name. Reports are checked against the source before anything changes — and when a story does change, its version moves, so anything made from the old text is detectable rather than silently stale.</p>

<h2>What it costs</h2>
<p>Nothing, and there is no advertising anywhere on the site. No account is needed to read. If you sign in it is only so your place survives a cleared cache and reaches a second device. What we do and do not store is set out on the <a class="lnk" href="/privacy/">privacy page</a>, including exactly what part artificial intelligence plays in making these stories and what it is not allowed anywhere near.</p>

<h2>Following along</h2>
<p>There is a story chosen for you every night, against the calendar and the season. You can follow on <a class="lnk" href="https://whatsapp.com/channel/0029VbDPZyP8KMqsuZX2GJ10">WhatsApp</a> or <a class="lnk" href="https://www.instagram.com/the_sandhyakatha/">Instagram</a>, subscribe to the <a class="lnk" href="/feed.xml">feed</a>, or simply open the site at dusk. Anything else — a question, a correction, a school or library asking for something in writing — reaches us at <a class="lnk" href="mailto:sandhyakathas@gmail.com">sandhyakathas@gmail.com</a>.</p>
`,
    foot: `${published} of ${planned} stories published. Story text is all rights reserved.`,
  });
}

function privacyPage() {
  return staticPage({
    slug: 'privacy',
    title: 'Privacy · Sandhya Katha',
    ogTitle: 'Privacy — Sandhya Katha',
    desc: 'What Sandhya Katha stores, what it does not, and why. Written for parents and for anyone reviewing the site for classroom use.',
    kick: 'Privacy',
    h1: "What we store, and what we don't",
    lede: 'This is a site used by children. That single fact decided every choice below, and we would rather write them in plain words than in the usual paragraph of legal fog.',
    body: `
<div class="box"><p><strong>The short version.</strong> You can read every story without an account, and signed out we store nothing about you on our servers at all. There is no advertising anywhere on this site, and nothing here profiles a child.</p></div>

<h2>Reading signed out</h2>
<p>No account, no wall in front of the first story. Which stories you have read, your child's first name if you typed one, their age band and the difficult-stories setting are kept <strong>in your own browser</strong>, and never sent to us. Clearing your browser data erases them.</p>

<h2>If you choose to sign in</h2>
<p>Signing in is optional and does exactly three things: it survives a cleared cache, it reaches a second device, and later it will carry a subscription.</p>
<ul>
<li>An account holds one thing: a first name you typed, an age, which stories were read and on which night, and the difficult-stories setting.</li>
<li><strong>There are no passwords.</strong> Sign-in is through Google, or through a recovery code if you would rather we never learn who you are.</li>
<li><strong>Google is an identity provider, not an embedded one.</strong> The exchange happens on our server, so no Google sign-in script ever loads in the page and Google never sees a visitor who does not sign in. Only an email address and an account identifier are requested.</li>
</ul>

<h2>Measurement, and its limits</h2>
<p>We use Google Analytics to count how the site is used, and we have switched off the parts of it that exist to serve advertising. Advertising storage, advertising user data and ad personalisation are all denied by default; Google Signals and ad-personalisation signals are off; IP addresses are anonymised.</p>
<p>Three events are recorded and nothing else: a story was opened, a story was finished, sign-in was started. <strong>No child's name, no age, no free text, and nothing that follows anyone across other websites.</strong> India's DPDP Act prohibits behavioural advertising to children; the analytics defaults are not on a child's side, so we override them explicitly rather than trusting them.</p>

<h2>Artificial intelligence, and what it does not touch</h2>
<p>Two different questions usually get run together here, so we answer them separately.</p>
<p><strong>In making the stories: yes, and here is exactly how.</strong> A story's first draft is written with a large language model, working only from a list of claims pulled out of a named source beforehand. Nothing is published from that draft. A person checks the telling line by line against that list, a further adversarial review argues against it from the editions themselves, and a person reads the whole story aloud and approves it before it goes anywhere. Every one of those stages has caught real errors, which is why every one of them exists. Where the tellings genuinely differ, the published page says which one we tell.</p>
<p><strong>While your child is reading: none at all.</strong> Nothing is generated at read time. Tonight's story is a fixed, versioned file — the same words tomorrow, the same words offline, and no possibility of a Purāṇa being invented at bedtime.</p>
<p><strong>With anybody's data: none at all.</strong> No AI system of ours or anyone else's processes anything about a reader. There is no personalisation model, no recommendation engine trained on behaviour, and nothing about any visitor is sent to a model provider. The three analytics events above are counters. What a child reads stays in their browser unless they sign in, and if they do it sits in their own account and is used to show them their own history — never to train anything, here or elsewhere.</p>

<h2>Telling us a story is wrong</h2>
<p>Anyone can report an error from a story page. It takes no account and asks for no name. We keep the story, the version it was reported against, what you wrote, and a two-letter country code — enough to notice a flood of reports, useless for identifying anybody. The form asks you not to include personal details; if you do anyway, that text is deleted once the report has been acted on.</p>

<h2>What is never done here</h2>
<ul>
<li>No advertising, no ad network, no sponsored content.</li>
<li>No selling or sharing of anyone's data with anybody.</li>
<li>No profile of a child, and nothing inferred about one.</li>
<li>No social media embeds, and no scripts or fonts from anywhere our content security policy does not name.</li>
<li>No tracking of a child across other sites, because nothing here can.</li>
<li>No reader's data given to any AI system, for training or for anything else.</li>
</ul>

<h2>For schools and libraries</h2>
<p>The site is free, needs no account or licence, and can be used by a whole class without anyone signing in — in which case nothing reaches our servers. There is no student roster, no classroom code, and no per-pupil record to administer or delete. If your district needs something in writing beyond this page, write to us and we will answer properly.</p>

<h2>Asking us anything, or asking us to delete</h2>
<p>Write to <a class="lnk" href="mailto:sandhyakathas@gmail.com">sandhyakathas@gmail.com</a>. If you have an account and want it gone, say so and it is deleted along with everything in it — there is no retention period and nothing is kept back.</p>
`,
    foot: 'Last reviewed 16 September 2026. When what the site does changes, this page changes in the same commit — it is generated from the project’s own privacy record, not written separately.',
  });
}

const urls = [`${SITE}/`];
const publishedStories = [];
let n = 0;
for (const f of readdirSync(join(ROOT, 'content/stories')).filter(f => f.endsWith('.json'))) {
  const s = read(`content/stories/${f}`);
  if (s.status !== 'published' || s.audience.gated) continue;   // gated stories are never public
  mkdirSync(join(dist, 's', s.id), { recursive: true });
  writeFileSync(join(dist, 's', s.id, 'index.html'), page(s));
  urls.push(`${SITE}/s/${s.id}/`);
  publishedStories.push(s);
  n++;
}

// corpus pages — no thin pages: require at least two published, ungated stories.
const corpusPages = [];
let cp = 0;
for (const [corpus, meta] of Object.entries(CORPUS_META)) {
  const stories = publishedStories.filter(s => s.source.corpus === corpus);
  if (stories.length < 2) continue;
  mkdirSync(join(dist, meta.slug), { recursive: true });
  writeFileSync(join(dist, meta.slug, 'index.html'), corpusPage(meta, stories));
  urls.push(`${SITE}/${meta.slug}/`);
  corpusPages.push({ ...meta, count: stories.length });
  cp++;
}
console.log(`prerendered ${cp} corpus landing page(s)`);

// festival pages
const writtenIds = new Set(readdirSync(join(ROOT, 'content/stories'))
  .filter(f => f.endsWith('.json'))
  .map(f => read(`content/stories/${f}`))
  .filter(x => x.status === 'published' && !x.audience.gated).map(x => x.id));
const festivalPages = [];
let fp = 0;
for (const [slug, f] of Object.entries(fests)) {
  mkdirSync(join(dist, 'f', slug), { recursive: true });
  writeFileSync(join(dist, 'f', slug, 'index.html'), festivalPage(slug, f, writtenIds));
  urls.push(`${SITE}/f/${slug}/`);
  festivalPages.push({ slug, name: f.plain ?? f.name });
  fp++;
}
console.log(`prerendered ${fp} festival page(s)`);

// Put static source links into the initial homepage HTML too. React replaces
// #root as soon as the app boots, but crawlers and no-JS clients receive real
// links without waiting for client rendering. This uses the exact pages emitted
// above, so it cannot point at a corpus landing page that does not exist.
{
  const homePath = join(dist, 'index.html');
  let home = readFileSync(homePath, 'utf8');
  const links = corpusPages.map(x =>
    `<a href="/${x.slug}/" style="color:#f0b458;text-decoration:none">${esc(x.label)} <small style="color:#948aa6">(${x.count})</small></a>`
  ).join(' · ');
  // The festival pages were reachable only from individual story pages, two
  // clicks in. Google indexed the corpus pages — linked straight from here —
  // and left every festival page out, which is the half a parent searches for
  // ("navaratri stories for kids"). Same treatment, same crawl depth.
  const festLinks = festivalPages.map(x =>
    `<a href="/f/${x.slug}/" style="color:#f0b458;text-decoration:none">${esc(x.name)}</a>`
  ).join(' · ');
  const fallback = `<div id="root"><main style="max-width:680px;margin:0 auto;padding:32px 22px;color:#f3e7d3;background:#14101c;font-family:Karla,system-ui,sans-serif;min-height:100vh"><p style="color:#a97c3a;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Sandhya Katha</p><h1 style="font-family:'Tiro Devanagari Sanskrit',serif;font-weight:400">Hindu stories for children, read aloud in six minutes.</h1><p style="color:#c9baa4;line-height:1.65">From the Rāmāyaṇa, Mahābhārata, Purāṇas and Upaniṣads — each one checked against a named source before publication.</p><nav aria-label="Browse stories by source"><p style="color:#c9baa4">Browse stories by source</p><p>${links}</p></nav><nav aria-label="Browse stories by festival"><p style="color:#c9baa4">Stories for a festival night</p><p>${festLinks}</p></nav></main></div>`;
  /* ---------- the other three surfaces ---------------------------------
   * /shelf/, /map/ and /why/ are real addresses now (src/lib/route.ts), but the
   * SPA fallback would serve the homepage HTML at all three — one page of
   * content on four URLs, which is worse for search than having no URLs at all.
   * Each gets the same built shell with its own crawlable fallback inside
   * #root, so the app boots identically and a crawler sees three distinct
   * pages. Written from the pristine build output, before the homepage is
   * rewritten below.
   */
  const surfaces = [
    { slug: 'shelf', title: 'The shelf — Hindu stories by source and age | Sandhya Katha',
      h1: 'The shelf — every story, by source and by age',
      p: `All ${publishedStories.length} published stories, on the shelf a parent browses: Rāmāyaṇa, Mahābhārata, Bhāgavatam, the Purāṇas, the Upaniṣads, the Nāyaṉmārs and Āḻvārs, and the sants of the north. Each one names the work and the chapter it comes from.`,
      nav: links },
    { slug: 'map', title: 'The constellation — a child’s story map | Sandhya Katha',
      h1: 'The constellation — the people your child has met',
      p: 'Characters accumulate into a map a child builds by listening. Hanumān and Bhīma turn out to be brothers. The Kṛṣṇa of the Bhāgavatam turns out to be the Kṛṣṇa of the Mahābhārata. It lights up as stories are heard, and it stays on your own device.',
      nav: links },
    { slug: 'why', title: 'Why Sandhya Katha is source-checked, not generated',
      h1: 'Why not just ask a chatbot?',
      p: 'Because at 8:40pm you do not want a generator. You want the one right story — already chosen, already checked, already laid out for your voice. Every line here has an address, and where the traditions differ the story says so out loud.',
      nav: festLinks },
  ];
  const surfaceHead = (html, surface) => {
    const canonical = `${SITE}/${surface.slug}/`;
    const localeHref = lang => surface.slug === 'shelf'
      ? (lang === 'hi' ? `${SITE}/hi/` : lang === 'ta' ? `${SITE}/ta/` : canonical)
      : (lang === 'en' ? canonical : `${canonical}?lang=${lang}`);
    const alternates = ['en','hi','ta'].map(lang =>
      `<link rel="alternate" hreflang="${lang}" href="${localeHref(lang)}">`
    ).join('') + `<link rel="alternate" hreflang="x-default" href="${canonical}">`;
    return html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(surface.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(surface.p)}">`)
      .replace(/\s*<link rel="alternate" hreflang="(?:en|hi|ta|x-default)"[^>]*>/g, '')
      .replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/, `<link rel="canonical" href="${canonical}">${alternates}`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(surface.h1)}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(surface.p)}">`)
      .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`);
  };
  for (const surface of surfaces) {
    const body = `<div id="root"><main style="max-width:680px;margin:0 auto;padding:32px 22px;color:#f3e7d3;background:#14101c;font-family:Karla,system-ui,sans-serif;min-height:100vh"><p style="color:#a97c3a;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Sandhya Katha</p><h1 style="font-family:'Tiro Devanagari Sanskrit',serif;font-weight:400">${esc(surface.h1)}</h1><p style="color:#c9baa4;line-height:1.65">${esc(surface.p)}</p><p>${surface.nav}</p><p style="color:#c9baa4"><a href="/about/" style="color:#f0b458">About this collection</a> · <a href="/privacy/" style="color:#f0b458">Privacy</a></p></main></div>`;
    mkdirSync(join(dist, surface.slug), { recursive: true });
    writeFileSync(join(dist, surface.slug, 'index.html'),
      surfaceHead(home.replace('<div id="root"></div>', body), surface));
    urls.push(`${SITE}/${surface.slug}/`);
  }
  console.log(`prerendered ${surfaces.length} app surface shell(s)`);

  if (!home.includes('<div id="root"></div>'))
    throw new Error('homepage root placeholder not found; static source links were not injected');
  home = home.replace('<div id="root"></div>', fallback);
  writeFileSync(homePath, home);
  console.log(`injected ${corpusPages.length} source + ${festivalPages.length} festival link(s) into homepage`);
}

mkdirSync(join(dist, 'about'), { recursive: true });
// publishedStories deliberately excludes gated stories, because they are not
// public browse. They ARE in the collection, so the count on /about/ comes from
// the canon instead — otherwise the page quietly undercounts itself.
writeFileSync(join(dist, 'about', 'index.html'), aboutPage({
  published: canon.filter(c => c.status === 'published').length,
  planned: canon.filter(c => c.status !== 'retired').length,
}));
urls.push(`${SITE}/about/`);

mkdirSync(join(dist, 'privacy'), { recursive: true });
writeFileSync(join(dist, 'privacy', 'index.html'), privacyPage());
urls.push(`${SITE}/privacy/`);
console.log('about + privacy pages written');

writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n') +
  `\n</urlset>\n`);

/* ---------- RSS feed ----------------------------------------------------
 * A nightly story is exactly the shape RSS was made for, and a feed is the
 * entry format directories like Kagi Small Web actually accept — the site had
 * a sitemap (for crawlers) but nothing a reader could subscribe to.
 * Newest first by the story's own `updated` date.
 */
const xmlEsc = t => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const feedItems = publishedStories
  .slice()
  .sort((a, b) => String(b.updated ?? '').localeCompare(String(a.updated ?? '')))
  .slice(0, 50)
  .map(st => {
    const link = `${SITE}/s/${st.id}/`;
    const when = new Date(`${st.updated ?? '1970-01-01'}T18:30:00Z`).toUTCString();
    const body = `${st.tease} — ${st.source.work}, ${st.source.locus}. `
      + `Ages ${st.audience.minAge}+, about ${st.lengths.full.minutes} minutes read aloud.`;
    return `  <item>
    <title>${xmlEsc(st.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="false">sandhyakatha:${xmlEsc(st.id)}:v${st.version ?? 1}</guid>
    <pubDate>${when}</pubDate>
    <description>${xmlEsc(body)}</description>
  </item>`;
  }).join('\n');

writeFileSync(join(dist, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Sandhya Katha</title>
  <link>${SITE}/</link>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>One story a night for children, from the Rāmāyaṇa, Mahābhārata, Purāṇas and Upaniṣads. Every story names the work and passage it was checked against, and says where the tellings differ.</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems}
</channel>
</rss>
`);
console.log(`feed.xml — ${Math.min(publishedStories.length, 50)} item(s)`);

writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /preview/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`prerendered ${n} shareable story page(s) + sitemap`);
