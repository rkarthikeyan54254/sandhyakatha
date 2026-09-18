import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const read = (root, rel) =>
  JSON.parse(readFileSync(join(root, rel), 'utf8'));

function runCheck(root, args) {
  execFileSync(
    process.execPath,
    [join(root, 'scripts', 'reel.mjs'), '--check', ...args],
    { cwd:root, stdio:'inherit', env:process.env }
  );
}

export async function checkAllReels({ root }) {
  const social = read(root, 'content/social.json').stories ?? {};
  const localeConfig = read(root, 'content/social-locales.json').locales ?? {};

  const english = [];
  for (const id of Object.keys(social).sort()) {
    const rel = `content/stories/${id}.json`;
    const path = join(root, rel);
    if (!existsSync(path))
      throw new Error(`configured English reel story is missing: ${rel}`);
    const story = JSON.parse(readFileSync(path, 'utf8'));
    if (story.status === 'published' && !story.audience?.gated)
      english.push(id);
  }

  let localeCount = 0;
  console.log(`reel --all: checking ${english.length} published English reel(s)`);
  for (const id of english) {
    console.log(`\n===== en · ${id} =====`);
    runCheck(root, [id]);
  }

  for (const locale of Object.keys(localeConfig).sort()) {
    const stories = localeConfig[locale]?.stories ?? {};
    for (const id of Object.keys(stories).sort()) {
      console.log(`\n===== ${locale} · ${id} =====`);
      runCheck(root, ['--locale', locale, id]);
      localeCount += 1;
    }
  }

  console.log(
    `\nreel --all: PASS — ${english.length} English + ` +
    `${localeCount} locale edition(s)`
  );
}
