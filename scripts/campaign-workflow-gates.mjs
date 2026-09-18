#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { socialLocalePolicy } from './lib/social-locale-policy.mjs';
import { parseCampaignArgs } from './lib/campaign-cli.mjs';

const ROOT=join(fileURLToPath(new URL('.',import.meta.url)),'..');
const read=rel=>JSON.parse(readFileSync(join(ROOT,rel),'utf8'));
const source=rel=>readFileSync(join(ROOT,rel),'utf8');
const errors=[];
const fail=message=>errors.push(message);

const pkg=read('package.json');
if (pkg.scripts?.campaign !== 'node scripts/campaign.mjs')
  fail('campaign npm command must route only through scripts/campaign.mjs');
if (pkg.scripts?.['campaign:check'] !== 'node scripts/campaign.mjs --check')
  fail('campaign:check must route through scripts/campaign.mjs --check');
if (pkg.scripts?.['campaign:today'] !== 'node scripts/campaign-today.mjs')
  fail('campaign:today must route through scripts/campaign-today.mjs');
if (pkg.scripts?.social)
  fail('standalone social generator npm command is forbidden; use campaign');
if (pkg.scripts?.['verify:campaign-workflow'] !== 'node scripts/campaign-workflow-gates.mjs')
  fail('verify:campaign-workflow command missing');
if (!String(pkg.scripts?.['validate:strict'] ?? '').includes('scripts/campaign-workflow-gates.mjs'))
  fail('validate:strict must include campaign workflow hardening');

for (const rel of [
  'scripts/campaign.mjs',
  'scripts/campaign-today.mjs',
  'scripts/campaign-workflow-gates.mjs',
  'scripts/lib/campaign-runner.mjs',
  'scripts/lib/campaign-cli.mjs',
  'scripts/lib/campaign-all-check.mjs',
  'scripts/lib/carousel-runner.mjs',
  'scripts/lib/social-edition.mjs',
  'scripts/lib/social-locale-policy.mjs',
  'scripts/reel.mjs',
  'scripts/surface-gates.mjs',
  'content/social.json',
  'content/social-locales.json',
  'CAMPAIGNS.md'
]) if (!existsSync(join(ROOT,rel))) fail(`campaign workflow component missing: ${rel}`);

if (existsSync(join(ROOT,'scripts/social.mjs')))
  fail('scripts/social.mjs is obsolete; carousel generation must be internal to campaign');

const surfaceGateSource=source('scripts/surface-gates.mjs');
if (surfaceGateSource.includes("'scripts/social.mjs'") ||
    surfaceGateSource.includes('\"scripts/social.mjs\"'))
  fail('surface-gates.mjs still depends on obsolete scripts/social.mjs');
if (!surfaceGateSource.includes("'scripts/lib/social-edition.mjs'") &&
    !surfaceGateSource.includes('\"scripts/lib/social-edition.mjs\"'))
  fail('surface-gates.mjs must validate the unified social edition resolver');

const extraCampaignScripts=readdirSync(join(ROOT,'scripts'))
  .filter(name=>/^campaign-.*\.mjs$/.test(name))
  .filter(name=>!['campaign-today.mjs','campaign-workflow-gates.mjs'].includes(name));
if (extraCampaignScripts.length)
  fail(`parallel campaign workflows are forbidden: ${extraCampaignScripts.join(', ')}`);

// Regression coverage for default + locale CLI parsing. A previous bug treated
// localeAt === -1 as though argument 0 were the locale value and dropped the story id.
for (const [argv, expected] of [
  [['hanuman-reminded'], { id:'hanuman-reminded', requestedLocale:null }],
  [['hanuman-reminded','--open'], { id:'hanuman-reminded', requestedLocale:null, openReview:true }],
  [['--locale','hi-IN','hanuman-reminded'], { id:'hanuman-reminded', requestedLocale:'hi-IN' }],
  [['hanuman-reminded','--locale','hi-IN'], { id:'hanuman-reminded', requestedLocale:'hi-IN' }],
  [['--check','--all'], { id:null, requestedLocale:null, checkOnly:true, all:true }]
]) {
  const got=parseCampaignArgs(argv);
  for (const [key,value] of Object.entries(expected))
    if (got[key] !== value)
      fail(`campaign CLI parser regression for ${JSON.stringify(argv)}: ${key}=${got[key]}`);
}

const campaignSource=source('scripts/campaign.mjs');
if (!campaignSource.includes("./lib/campaign-runner.mjs"))
  fail('campaign.mjs must dispatch through the shared campaign runner');
if (!campaignSource.includes("./lib/campaign-all-check.mjs"))
  fail('campaign.mjs must own --all preflight');

const runnerSource=source('scripts/lib/campaign-runner.mjs');
for (const required of [
  "join(root,'scripts','reel.mjs')",
  "from './carousel-runner.mjs'",
  "'instagram'", "'facebook'", "'youtube'", "'whatsapp'",
  "sandhya-campaign-v2"
]) if (!runnerSource.includes(required)) fail(`campaign runner contract missing: ${required}`);
if (runnerSource.includes('reel-locale-runner.mjs'))
  fail('campaign runner may not bypass the public reel workflow');

const carouselSource=source('scripts/lib/carousel-runner.mjs');
if (!carouselSource.includes('policy.complexScript'))
  fail('carousel renderer must dispatch by shared typography policy');
if (!carouselSource.includes('browserProbeScript'))
  fail('complex-script carousel must use shared browser-native shaping diagnostics');
for (const forbidden of ['wrapEm','wordSpacingEm'])
  if (carouselSource.includes(forbidden))
    fail(`carousel renderer contains forbidden complex-script heuristic: ${forbidden}`);

const localeRunner=source('scripts/lib/reel-locale-runner.mjs');
if (!localeRunner.includes("from './social-locale-policy.mjs'"))
  fail('locale reel adapter must use the shared social locale policy');
if (!localeRunner.includes('browserProbeScript'))
  fail('locale reel adapter must use the shared browser shaping probe');

const social=read('content/social.json').stories ?? {};
const localeSocial=read('content/social-locales.json').locales ?? {};
const publicConfig=read('content/locale-public.json');
for (const row of publicConfig.editions ?? []) {
  try { socialLocalePolicy(row.locale); }
  catch (e) { fail(`${row.locale}: ${e.message}`); }
  if (!social[row.storyId]?.reel)
    fail(`${row.storyId}: public locale campaign requires curated English selectors too`);
  if (!localeSocial[row.locale]?.stories?.[row.storyId])
    fail(`${row.locale}/${row.storyId}: public locale campaign selectors missing`);
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL campaign workflow gate: ${error}`);
  process.exit(1);
}
console.log(
  'campaign workflow gate: PASS — one publishing command · English + public locales · ' +
  'reel + carousel · Instagram + Facebook + YouTube + WhatsApp · shared complex-script policy'
);
