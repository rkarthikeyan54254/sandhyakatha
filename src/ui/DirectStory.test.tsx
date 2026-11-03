import {act,create} from 'react-test-renderer';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import DirectStory from './DirectStory';
import Entry from '../Entry';
vi.mock('../App',()=>({default:()=> <p>Existing family app</p>}));
import {directStoryRoute} from '../lib/direct-story';
import type {AppLocale} from '../lib/app-locale';

const id='rambha-sevenfold-curse';
const titles={en:'Rāvaṇa and Rambhā',hi:'रावण और रम्भा',ta:'ராவணனும் ரம்பையும்'};
const editions=Object.fromEntries(Object.entries(titles).map(([lang,title])=>[lang,{title,tease:'Tease',minAge:15,careNote:'Reviewed care note',href:`/read/${id}/${lang==='en'?'':lang+'/'}`,runtimePath:`/data/${lang==='en'?'s':'l/'+lang}/${id}.json?v=reviewed`} ]));
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(()=>{
 vi.stubGlobal('document',{documentElement:{lang:''},title:''});
 vi.stubGlobal('window',{location:{assign:vi.fn()},localStorage:{getItem:()=>{throw Error('Family state must not be read');},setItem:()=>{throw Error('Family state must not be written');}}});
 fetcher=vi.fn(async(path:string)=>({ok:true,json:async()=>{
  if(path==='/data/direct-stories.json')return {schemaVersion:'1.0',stories:{[id]:editions}};
  if(path==='/data/lexicon.json')return {};
  const lang=path.includes('/l/hi/')?'hi':path.includes('/l/ta/')?'ta':'en';
  return {id,status:'published',title:titles[lang],source:{work:'Vālmīki Rāmāyaṇa',locus:'Uttara 26'},audience:{gated:true,minAge:15},lengths:{short:{minutes:3,blocks:[{t:'slow',text:'SHORT NARRATION'}]},full:{minutes:6,blocks:[{t:'slow',text:'FULL NARRATION'}]}},close:{question:'Question',seed:'Seed'}};
 }}));vi.stubGlobal('fetch',fetcher);
});
afterEach(()=>vi.unstubAllGlobals());
describe('direct story routes',()=>{
 it('keeps exact story identity and native language',()=>{
  expect(directStoryRoute(`/read/${id}/`)).toEqual({id,locale:'en'});
  expect(directStoryRoute(`/read/${id}/hi/`)).toEqual({id,locale:'hi-IN'});
  expect(directStoryRoute(`/read/${id}/ta`)).toEqual({id,locale:'ta-IN'});
  for(const path of ['/s/'+id+'/','/read/../','/read/%2e%2e/','/read/'+id+'/fr/','/read/'+id+'/ta/extra'])expect(directStoryRoute(path)).toBeNull();
 });
});
describe.each(['en','hi-IN','ta-IN'] as AppLocale[])('parent opt-in in %s',locale=>{
 it('fetches no narrative before consent; then preserves both tellings without family state',async()=>{
  let tree: ReturnType<typeof create>;
  await act(async()=>{tree=create(<DirectStory route={{id,locale}}/>);});
  expect(fetcher.mock.calls.map(c=>c[0])).toEqual(['/data/direct-stories.json']);
  expect(JSON.stringify(tree!.toJSON())).toContain('Reviewed care note');
  expect(JSON.stringify(tree!.toJSON())).not.toContain('NARRATION');
  await act(async()=>{tree!.root.findByProps({className:'begin'}).props.onClick();});
  expect(JSON.stringify(tree!.toJSON())).toContain('FULL NARRATION');
  expect(JSON.stringify(tree!.toJSON())).not.toContain('SHORT NARRATION');
  const choices=tree!.root.findByProps({'data-story-length-controls':true}).findAllByType('button');
  act(()=>choices[0].props.onClick());
  expect(JSON.stringify(tree!.toJSON())).toContain('SHORT NARRATION');
  expect(tree!.root.findAllByProps({className:'mark'})).toHaveLength(0);
  act(()=>tree!.unmount());
 });
 it('requires fresh consent after reload',async()=>{
  let tree:ReturnType<typeof create>;
  await act(async()=>{tree=create(<DirectStory route={{id,locale}}/>);});
  await act(async()=>{tree!.root.findByProps({className:'begin'}).props.onClick();});
  act(()=>tree!.unmount());
  await act(async()=>{tree=create(<DirectStory route={{id,locale}}/>);});
  expect(JSON.stringify(tree!.toJSON())).not.toContain('NARRATION');act(()=>tree!.unmount());
 });
});
it('keeps the care gate when the narrative fails to load',async()=>{
 let tree:ReturnType<typeof create>;
 await act(async()=>{tree=create(<DirectStory route={{id,locale:'en'}}/>);});
 fetcher.mockImplementation(async()=>({ok:false}));
 await act(async()=>{tree!.root.findByProps({className:'begin'}).props.onClick();});
 expect(JSON.stringify(tree!.toJSON())).toContain('Reviewed care note');expect(JSON.stringify(tree!.toJSON())).not.toContain('NARRATION');
 expect(tree!.root.findByProps({role:'alert'})).toBeTruthy();act(()=>tree!.unmount());
});
it('never falls back to another story for an unknown id',async()=>{
 let tree:ReturnType<typeof create>;
 await act(async()=>{tree=create(<DirectStory route={{id:'unknown',locale:'en'}}/>);});
 expect(tree!.root.findAllByProps({className:'begin'})).toHaveLength(0);expect(fetcher).toHaveBeenCalledTimes(1);act(()=>tree!.unmount());
});

it('mounts the unchanged family app only on ordinary routes',async()=>{
 let tree:ReturnType<typeof create>;
 await act(async()=>{tree=create(<Entry pathname="/shelf/"/>);});
 expect(JSON.stringify(tree!.toJSON())).toContain('Existing family app');expect(fetcher).not.toHaveBeenCalled();act(()=>tree!.unmount());
 await act(async()=>{tree=create(<Entry pathname={`/read/${id}/`}/>);});
 expect(JSON.stringify(tree!.toJSON())).not.toContain('Existing family app');expect(JSON.stringify(tree!.toJSON())).toContain('Reviewed care note');act(()=>tree!.unmount());
});
