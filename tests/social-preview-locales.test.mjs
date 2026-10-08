import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'sk-native-og-'));
  for (const p of ['scripts', 'content', 'public/og', 'dist/s/example', 'dist/s/example/hi', 'dist/s/example/ta'])
    mkdirSync(join(root, p), { recursive: true });
  copyFileSync(new URL('../scripts/social-preview.mjs', import.meta.url), join(root, 'scripts/social-preview.mjs'));
  writeFileSync(join(root, 'content/canon.json'), JSON.stringify({canon:[{id:'example',title:'English title',status:'published',gated:false}]}));
  writeFileSync(join(root, 'content/locale-public.json'), JSON.stringify({editions:[{storyId:'example',locale:'hi-IN'},{storyId:'example',locale:'ta-IN'}]}));
  for (const [lang,title] of [['','English title'],['hi','हिन्दी शीर्षक'],['ta','தமிழ்த் தலைப்பு']])
    writeFileSync(join(root,'dist/s/example',lang,'index.html'), `<html><head><meta property="og:title" content="${title}"><meta property="og:description" content="A story"><meta name="theme-color" content="#14101c"></head></html>`);
  const en=readFileSync(new URL('../public/og/ribhu-nidagha.jpg',import.meta.url));
  const hi=readFileSync(new URL('../public/og/ribhu-nidagha-hi.jpg',import.meta.url));
  writeFileSync(join(root,'public/og/example.jpg'),en);
  writeFileSync(join(root,'public/og/example-hi.jpg'),hi);
  return {root,en,hi,run:()=>spawnSync(process.execPath,[join(root,'scripts/social-preview.mjs')],{encoding:'utf8'})};
}

describe('native story share cards',()=>{
  it('selects the native card with its own digest and retains the English fallback',()=>{
    const f=fixture();try{
      expect(f.run().status).toBe(0);
      const digest=b=>createHash('sha256').update(b).digest('hex').slice(0,12);
      const hi=readFileSync(join(f.root,'dist/s/example/hi/index.html'),'utf8');
      const ta=readFileSync(join(f.root,'dist/s/example/ta/index.html'),'utf8');
      expect(hi).toContain(`/og/example-hi.jpg?og=${digest(f.hi)}`);
      expect(hi).toContain('हिन्दी शीर्षक');
      expect(ta).toContain(`/og/example.jpg?og=${digest(f.en)}`);
      expect(ta).toContain('தமிழ்த் தலைப்பு');
      expect((hi.match(/property="og:image"/g)||[]).length).toBe(1);
      expect(hi).toContain('name="twitter:image"');
    }finally{rmSync(f.root,{recursive:true,force:true});}
  });
  it('rejects a malformed supplied native card rather than silently using a fallback',()=>{
    const f=fixture();try{
      writeFileSync(join(f.root,'public/og/example-hi.jpg'),'not a JPEG');
      const result=f.run();expect(result.status).toBe(1);
      expect(result.stderr).toContain('native OG card must be a readable 1200x630 JPEG');
    }finally{rmSync(f.root,{recursive:true,force:true});}
  });
});
