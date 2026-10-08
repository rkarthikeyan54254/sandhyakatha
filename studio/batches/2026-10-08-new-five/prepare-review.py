from pathlib import Path
import json,re,hashlib
B=Path(__file__).parent
if (B/'evidence/paragraph-scenes.json').exists():
    raise SystemExit('Already normalized; preserve paragraph mapping. Edit the mapped draft explicitly.')
# Original paragraph ranges were inspected against the named source claims.
# Broad scene groups are deliberate: they are not per-sentence proof of doctrine.
def plan(id,lang,length,n):
    a=['']*n
    def r(start,end,scene):
        for i in range(start-1,end):a[i]=scene
    if id=='upakosala-fires':
        ranges=[(1,2,'U1'),(3,3,'U2'),(4,6,'U3'),(7,7,'U4'),(8,11,'U5'),(12,12,'U6'),(13,13,'landing')] if length=='short' else [(1,3,'U1'),(4,5,'U2'),(6,10,'U3'),(11,16,'U4'),(17,22,'U5'),(23,23,'U6'),(24,24,'landing')]
    elif id=='tuladhara-scales':
        ranges=[(1,2,'T1'),(3,5,'T2'),(6,6,'T3'),(7,8,'T4'),(9,10,'T5'),(11,12,'landing')] if length=='short' else [(1,6,'T1'),(7,9,'T2'),(10,12,'T3'),(13,15,'T4'),(16,20,'T5'),(21,22,'T6'),(23,23,'landing')]
    elif id=='mudgala-choice':
        if length=='full':ranges=[(1,3,'M1'),(4,7,'M2'),(8,9,'M3'),(10,16,'M4'),(17,19,'M5'),(20,23,'M6'),(24,24,'landing')]
        elif lang=='en':ranges=[(1,1,'M1'),(2,3,'M2'),(4,4,'M3'),(5,8,'M4'),(9,9,'M5'),(10,11,'M6'),(12,12,'landing')]
        else:ranges=[(1,1,'M1'),(2,3,'M2'),(4,4,'M3'),(5,7,'M4'),(8,8,'M5'),(9,10,'M6'),(11,11,'landing')]
    elif id=='gargi-questions':
        if length=='short':ranges=[(1,4,'G1'),(5,8,'G2'),(9,11,'G3'),(12,13,'G4'),(14,15,'G5'),(16,16,'G6'),(17,17,'landing')] if lang=='en' else [(1,3,'G1'),(4,6,'G2'),(7,9,'G3'),(10,11,'G4'),(12,13,'G5'),(14,14,'G6'),(15,15,'landing')]
        else:ranges=[(1,6,'G1'),(7,10,'G2'),(11,17,'G3'),(18,21,'G4'),(22,27,'G5'),(28,28,'G6'),(29,29,'landing')] if lang=='en' else [(1,5,'G1'),(6,9,'G2'),(10,15,'G3'),(16,19,'G4'),(20,26,'G5'),(27,27,'G6'),(28,28,'landing')]
    elif id=='ribhu-nidagha':
        if length=='short':
            ranges=[(1,8,'R5'),(9,12,'R6'),(13,13,'R7'),(14,14,'first-visit'),(15,16,'R7'),(17,17,'landing')] if lang=='en' else [(1,8,'R5'),(9,11,'R6'),(12,12,'R7'),(13,13,'first-visit'),(14,15,'R7'),(16,16,'landing')] if lang=='hi' else [(1,8,'R5'),(9,12,'R6'),(13,13,'R7'),(14,14,'first-visit'),(15,15,'R7'),(16,16,'landing')]
        elif lang=='en':ranges=[(1,2,'R1'),(3,4,'R2'),(5,9,'R3'),(10,10,'R4'),(11,17,'R5'),(18,21,'R6'),(22,23,'R7'),(24,24,'landing')]
        elif lang=='hi':ranges=[(1,2,'R1'),(3,5,'R2'),(6,10,'R3'),(11,13,'R4'),(14,20,'R5'),(21,24,'R6'),(25,27,'R7'),(28,28,'landing')]
        else:ranges=[(1,2,'R1'),(3,5,'R2'),(6,10,'R3'),(11,13,'R4'),(14,21,'R5'),(22,25,'R6'),(26,28,'R7'),(29,29,'landing')]
    for start,end,scene in ranges:r(start,end,scene)
    assert all(a), (id,lang,length,n)
    return a

def breaths(t):
    # Close and reopen emphasis across a breath break so rendered speech survives.
    sentences=re.split(r'(?<=[.!?।])([_’”»]*\s+)',t)
    units=[]
    for i in range(0,len(sentences),2):
        q=sentences[i]+(sentences[i+1] if i+1<len(sentences) else '')
        if q.strip():units.append(q.strip())
    if len(units)<=3:return [t]
    groups=[]
    while units:
        take=2 if len(units)==4 else min(3,len(units))
        groups.append(' '.join(units[:take]));units=units[take:]
    opened=False;out=[]
    for g in groups:
        if opened:g='_'+g
        opened=g.count('_')%2==1
        if opened:g+='_' # next group reopens the original span
        out.append(g)
    return out

batch=json.loads((B/'batch.json').read_text()); docs={}; normalized={}
for st in batch['stories']:
    for lang in batch['languages']:
        key=st['id']+'/'+lang
        p=B/('en' if lang=='en' else 'locales/'+lang)/(st['id']+'.md')
        sections=p.read_text().split('## ');result=[sections[0]];maps={}
        for sec in sections[1:3]:
            pieces=sec.strip().split('\n\n');heading=pieces[0];paras=pieces[1:];length='short' if heading.startswith('Short') else 'full'
            scenes=plan(st['id'],lang,length,len(paras));expanded=[];maps[length]=[]
            for original,(t,scene) in enumerate(zip(paras,scenes),1):
                for b in breaths(t):
                    expanded.append(b);maps[length].append({'scene':scene,'draftParagraph':original})
            result.append(heading+'\n\n'+'\n\n'.join(expanded)+'\n\n')
        result.extend(sections[3:]);p.write_text('## '.join(result));normalized[key]=maps
(B/'evidence/paragraph-scenes.json').write_text(json.dumps(normalized,ensure_ascii=False,indent=2)+'\n')
print('Normalized 30 renditions; saved source-scene paragraph mapping.')
