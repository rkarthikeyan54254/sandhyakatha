from pathlib import Path
import json
B=Path(__file__).parent
p=B/'evidence/paragraph-scenes.json'; maps=json.loads(p.read_text())
for key,lengths in maps.items():
 id,lang=key.split('/')
 for length,paras in lengths.items():
  for row in paras:
   n=row['draftParagraph'];scene=row['scene'];claims=None
   if id=='ribhu-nidagha':
    if length=='short':
     first=14 if lang in ['en','ta'] else 13
     if n<=4:scene='R4'
     elif n<=10:scene='R5'
     elif n<first:scene='R6'
     elif n==first:scene='first-visit';claims=['R2','R3']
     elif scene!='landing':scene='R7';claims=['R6','R7']
    else:
     if lang=='en':cuts=[(2,'R1'),(4,'R2'),(10,'R3'),(13,'R4'),(19,'R5'),(22,'R6'),(23,'R7')]
     elif lang=='hi':cuts=[(2,'R1'),(5,'R2'),(13,'R3'),(16,'R4'),(22,'R5'),(26,'R6'),(27,'R7')]
     else:cuts=[(2,'R1'),(5,'R2'),(13,'R3'),(17,'R4'),(23,'R5'),(27,'R6'),(28,'R7')]
     scene=next((s for end,s in cuts if n<=end),'landing')
     if scene=='R7':claims=['R6','R7']
   elif id=='mudgala-choice':
    if length=='full':cuts=[(2,'M1'),(3,'M2'),(7,'M3'),(14,'M4'),(19,'M5'),(23,'M6')]
    elif lang=='en':cuts=[(1,'M1'),(3,'M3'),(7,'M4'),(9,'M5'),(11,'M6')]
    else:cuts=[(1,'M1'),(3,'M3'),(6,'M4'),(8,'M5'),(10,'M6')]
    scene=next((s for end,s in cuts if n<=end),'landing')
    if length=='short' and n==1:claims=['M1','M2']
   elif id=='tuladhara-scales':
    cuts=[(2,'T1'),(7,'T2'),(9,'T3'),(12,'T4'),(20,'T5'),(22,'T6')] if length=='full' else [(1,'T1'),(3,'T2'),(5,'T3'),(6,'T4'),(10,'T5')]
    scene=next((s for end,s in cuts if n<=end),'landing')
    if (length=='full' and n==7) or (length=='short' and n==3):claims=['T2','T3']
   elif id=='upakosala-fires' and length=='full' and n==16:claims=['U4','U5']
   elif id=='gargi-questions' and length=='full' and n==4:claims=['G1','G2','G3']
   row['scene']=scene
   if claims:row['claims']=claims
p.write_text(json.dumps(maps,ensure_ascii=False,indent=2)+'\n')
