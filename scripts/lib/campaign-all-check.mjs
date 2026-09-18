import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const read=(root,rel)=>JSON.parse(readFileSync(join(root,rel),'utf8'));

export async function checkAllCampaigns({ root }) {
  const social=read(root,'content/social.json').stories ?? {};
  const publicConfig=read(root,'content/locale-public.json');
  const ids=new Set(Object.keys(social));
  for (const row of publicConfig.editions ?? []) ids.add(row.storyId);
  let count=0;
  for (const id of [...ids].sort()) {
    const path=join(root,'content','stories',`${id}.json`);
    if (!existsSync(path)) throw new Error(`campaign story missing: ${id}`);
    const story=JSON.parse(readFileSync(path,'utf8'));
    if (story.status !== 'published' || story.audience?.gated) continue;
    if (!social[id]?.reel)
      throw new Error(`${id}: campaign needs curated English selectors in content/social.json`);
    console.log(`\n######## CAMPAIGN CHECK · ${id} ########`);
    execFileSync(process.execPath,[join(root,'scripts','campaign.mjs'),'--check',id],{
      cwd:root,stdio:'inherit',env:process.env
    });
    count += 1;
  }
  console.log(`\ncampaign --all: PASS — ${count} story campaign(s), including public locale editions`);
}
