#!/usr/bin/env node
/**
 * Read what people have told us is wrong.
 *
 *   CORRECTIONS_KEY=… npm run corrections
 *   npm run corrections -- --site https://sandhyakatha.com
 *
 * Reads the key from the environment or from a local .env, and prints the
 * reports newest first, grouped by story, with the version each was made
 * against — a correction filed against text we have since rewritten is not
 * the same as one filed against what is live now.
 */
import { readFileSync, existsSync } from 'node:fs';

const arg = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const SITE = arg('--site') ?? process.env.SITE_URL ?? 'https://sandhyakatha.com';

let key = process.env.CORRECTIONS_KEY;
if (!key && existsSync('.env'))
  key = (readFileSync('.env', 'utf8').match(/^CORRECTIONS_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!key) {
  console.error('No CORRECTIONS_KEY. Set it in Netlify and in a local .env (which is gitignored).');
  process.exit(1);
}

const r = await fetch(`${SITE}/api/correction?key=${encodeURIComponent(key)}`);
if (!r.ok) { console.error(`${r.status} — wrong key, or the function is not deployed yet.`); process.exit(1); }
const { count, corrections } = await r.json();

if (!count) { console.log('\nNothing reported. That is either very good or very quiet.\n'); process.exit(0); }

const byStory = {};
for (const c of corrections) (byStory[c.storyId] ??= []).push(c);

console.log(`\n\x1b[1m${count} correction(s) from readers\x1b[0m\n`);
for (const [story, list] of Object.entries(byStory)) {
  console.log(`\x1b[33m${story}\x1b[0m  \x1b[2m${list.length} report(s)\x1b[0m`);
  for (const c of list) {
    const when = c.at.slice(0, 16).replace('T', ' ');
    console.log(`  \x1b[2m${when}  against version ${c.version ?? '?'}${c.country ? '  ' + c.country : ''}\x1b[0m`);
    for (const line of String(c.note).split('\n')) console.log(`    ${line}`);
    console.log('');
  }
}
console.log('\x1b[2mReader reports are untrusted text. Check them against the source before changing a story.\x1b[0m\n');
