#!/usr/bin/env node
/**
 * The one publishing campaign workflow.
 *
 * Default: generate English plus every public reviewed locale edition for the
 * story. Use --locale only when intentionally limiting the output.
 *
 *   npm run campaign -- <story-id> [--open]
 *   npm run campaign -- --locale hi-IN <story-id> [--open]
 *   npm run campaign:check -- <story-id>
 *   npm run campaign:check -- --all
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaignArgs } from './lib/campaign-cli.mjs';
import { runCampaign } from './lib/campaign-runner.mjs';

const ROOT=join(fileURLToPath(new URL('.',import.meta.url)),'..');
let parsed;
try {
  parsed=parseCampaignArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const { checkOnly, openReview, all, requestedLocale, id }=parsed;

if (all) {
  if (!checkOnly) {
    console.error('--all is preflight-only; use npm run campaign:check -- --all');
    process.exit(1);
  }
  if (requestedLocale) {
    console.error('--all cannot be combined with --locale');
    process.exit(1);
  }
  const { checkAllCampaigns }=await import('./lib/campaign-all-check.mjs');
  await checkAllCampaigns({root:ROOT});
  process.exit(0);
}

if (!id) {
  console.error(
    'usage:\n' +
    '  npm run campaign -- <story-id> [--open]\n' +
    '  npm run campaign -- --locale <locale> <story-id> [--open]\n' +
    '  npm run campaign:check -- <story-id>\n' +
    '  npm run campaign:check -- --all'
  );
  process.exit(1);
}

await runCampaign({root:ROOT,id,requestedLocale,checkOnly,openReview});
