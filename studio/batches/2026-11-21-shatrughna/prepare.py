import json,re,hashlib,copy
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]; BATCH=Path(__file__).resolve().parent
DATE='2026-11-21'
def read(p): return json.loads((ROOT/p).read_text())
def write(p,d): (ROOT/p).parent.mkdir(parents=True,exist_ok=True);(ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
ids=['shatrughna-lavana-gate','shatrughna-ramayana-song']
lex=read('content/lexicon.json');canon=read('content/canon.json');canon['canon']=[c for c in canon['canon'] if c['id'] not in ids];media=read('content/media.json');values=read('content/values.json');pub=read('content/locale-public.json');pub['editions']=[e for e in pub['editions'] if e['storyId'] not in ids];previews=read('content/locale-previews.json');previews['previews']=[e for e in previews['previews'] if e['storyId'] not in ids]
entries=[('Śatrughna','shatrughna','शत्रुघ्न','சத்ருக்னன்','shuh-TROOGH-nuh','person','The youngest of Daśaratha’s four sons; he defeats Lavaṇa and governs the city beside the Yamunā.'),('Lavaṇa','lavana','लवण','லவணன்','LUH-vuh-nuh','being','The son of Madhu defeated by Śatrughna at the city gate in Uttara Kāṇḍa.'),('Madhu','madhu','मधु','மது','MUH-dhoo','being','Lavaṇa’s father in the Uttara Kāṇḍa account; Śiva grants him the trident inherited by his son.'),('Madhupura','madhupura','मधुपुरी','மதுபுரி','muh-dhoo-POO-ruh','place','The city at whose gate Śatrughna confronts Lavaṇa.'),('Māndhātā','mandhata','मान्धाता','மாந்தாதா','maan-DHAA-taa','person','The king whose army is destroyed by Lavaṇa’s trident in Cyavana’s account.'),('Kuśa','kusha','कुश','குசன்','KOO-shuh','person','The elder of Sītā’s twin sons, named by Vālmīki.'),('Lava','lava','लव','லவன்','LUH-vuh','person','The younger of Sītā’s twin sons, named by Vālmīki.'),('kuśa','kusha-grass','कुश','தர்ப்பை','KOO-shuh','term','Sacred grass used in Vālmīki’s protective rite for Sītā’s newborn sons.'),('Śrāvaṇa','shravana-month','श्रावण','சிராவணம்','SHRAA-vuh-nuh','term','The rainy-season month named in the account of Śatrughna’s first stay at Vālmīki’s hermitage.')]
for term,id,deva,taml,say,kind,gloss in entries:
 if term not in lex:lex[term]={'id':id,'native':{'deva':deva,'taml':taml},'say':say,'kind':kind,'gloss':gloss,'aliases':[]}
write('content/lexicon.json',lex)
common_note='Follows Hari Prasad Shastri’s received-text Uttara Kāṇḍa numbering. The critical edition has not been collated here; no agreement across all recensions is claimed.'
claims_battle=[('More than a hundred sages from the Yamunā seek protection; Madhu receives Śiva’s trident, inherited by his cruel son Lavaṇa.','Uttara 60–61'),('Bharata volunteers; Śatrughna asks to take the duty because Bharata has already borne hardship during Rāma’s fourteen-year absence.','Uttara 62'),('Rāma appoints Śatrughna ruler, gives him a divine arrow, and orders him to intercept Lavaṇa at the gate before he retrieves his trident.','Uttara 62–63'),('Śatrughna visits Vālmīki; Cyavana tells how the trident destroyed Māndhātā and his army.','Uttara 65–67'),('Śatrughna crosses the Yamunā, waits at Madhupura’s gate at noon, challenges Lavaṇa and denies him access to the weapon.','Uttara 68'),('Lavaṇa’s trees are cut by arrows; a blow fells Śatrughna, but he recovers, returns to the gate and fires the divine arrow; Lavaṇa dies and the trident returns to Rudra.','Uttara 69'),('After a boon Śatrughna establishes his rule in the city beside the Yamunā; the region prospers over twelve years.','Uttara 70')]
claims_song=[('On Śatrughna’s first visit to Vālmīki’s hermitage in Śrāvaṇa, Sītā gives birth to two sons, twins; the young ascetics report the birth at midnight.','Uttara 65–66'),('Vālmīki uses blessed kuśa grass and its roots in a protective rite; the elder son is Kuśa, the younger Lava.','Uttara 66'),('Śatrughna hears the birth and names, greets Sītā at her hut and leaves after morning prayers.','Uttara 66.11–14, received numbering'),('Śatrughna defeats Lavaṇa and governs the prosperous city; twelve years later he wishes to see Rāma again.','Uttara 69–70'),('Travelling with a smaller escort, he returns to Vālmīki, receives hospitality and an affectionate blessing for his victory.','Uttara 71'),('After a meal he hears Rāma’s life sung to stringed instruments; he weeps and sighs, and his companions are amazed. The passage does not identify the singers.','Uttara 71'),('His men ask him to question Vālmīki; he declines to question a great sage merely out of curiosity, bows and retires.','Uttara 71')]
# Claim indexes follow the supplied native scenes, not English sentence syntax.
fullmap_b=[[0],[0],[0,1],[1],[1],[1,2],[2],[2],[2],[3],[3],[3,4],[4],[4],[4],[4,5],[5],[5],[5],[5],[5],[5],[5],[6],[1,2,5,6]]
fullmap_s=[[0,3],[0],[0],[0,1],[1],[1],[1,2],[2],[2,3],[3],[3],[3],[4],[4],[4,5],[5],[5],[5],[6],[6],[0,2,4,5],[0,1,5]]
shortmap_b=[[0],[1],[1,2],[2],[4],[5],[4,5],[5],[5],[5],[5],[6],[1,5,6]]
shortmap_s=[[0],[1],[2],[2,3],[3],[4],[5],[5],[6],[0,1,5]]
notes={'hi':'यह कथा हरिप्रसाद शास्त्री के अनुवाद में दिए उत्तरकाण्ड के सर्गों के अनुसार है। आलोचनात्मक संस्करण से पूरा मिलान नहीं किया गया है; सभी पाठों की एकरूपता का दावा नहीं है।','ta':'உத்தர காண்டத்தின் ஹரிபிரசாத் சாஸ்திரி மொழிபெயர்ப்பில் உள்ள சருக்க வரிசையைப் பின்பற்றுகிறோம். விமர்சனப் பதிப்புடன் முழுமையாக ஒப்பிடவில்லை; எல்லாப் பதிப்புகளும் ஒரேபோல உள்ளன என்று கூறவில்லை.'}
changes=[]
for ix,id in enumerate(ids):
 raw=json.loads((BATCH/'original'/f'{id}.review.json').read_text());en=copy.deepcopy(raw['locales']['en']);battle=ix==0
 # Minimal sourced production completion, documented separately from the approved ZIP.
 if battle:
  block=next(b for b in en['lengths']['full']['blocks'] if 'He got to his feet' in b.get('text',''));before=block['text'];block['text']=before.replace('He got to his feet and took up', 'He got to his feet. He returned to the gate and took up');changes.append({'id':id,'length':'full','before':before,'after':block['text'],'locus':'Uttara 69; recovery explicitly returns him to the gate'})
 else:
  block=next(b for b in en['lengths']['short']['blocks'] if 'After the meal' in b.get('text',''));before=block['text'];block['text']+=' They listened with their heads bowed as the song continued.';changes.append({'id':id,'length':'short','before':before,'after':block['text'],'locus':'Uttara 71; listening companions bow their heads'})
  block=next(b for b in en['lengths']['full']['blocks'] if 'these were not distant tales' in b.get('text',''));before=block['text'];block['text']=block['text'].replace('For «Śatrughna», these were not distant tales.', 'For «Śatrughna», the song was about his own elder brother. These were not the distant adventures of someone he had never known.').replace('Tears filled his eyes, and he sighed as he listened.','As he listened to the music, his eyes filled with tears. He sighed again and again, absorbed in the account of his brother’s life.');changes.append({'id':id,'length':'full','before':before,'after':block['text'],'locus':'Uttara 71; same response and relationship already in native full tellings'})
 sourcing=claims_battle if battle else claims_song
 terms=set(re.findall('«([^»]+)»',json.dumps(en,ensure_ascii=False)))
 characters=[{'ref':t,'role':'lead' if t=='Śatrughna' else 'foil' if t=='Lavaṇa' and battle else 'present' if t in ['Rāma','Bharata','Vālmīki','Sītā'] else 'mentioned'} for t in sorted(terms) if lex[t]['kind'] in ['person','being']]
 for c in characters:
  if c['ref'] in (['Cyavana','Brahmā'] if battle else ['Kuśa','Lava']):c['role']='present'
  if not battle and c['ref']=='Rāma':c['role']='mentioned'
 short=en['lengths']['short'];full=en['lengths']['full']
 lengths={key:{'minutes':r['targetMinutes'],'blocks':r['blocks']} for key,r in en['lengths'].items()}
 for k,r in lengths.items():
  # Split breath lines without changing their words.
  blocks=[]
  for b in r['blocks']:
   if b['t']=='p' and len(b['text'].split())>60:
    parts=re.split(r'(?<=[.!?])\s+',b['text']);current=''
    for part in parts:
     if current and len((current+' '+part).split())>55:blocks.append({'t':'p','text':current});current=part
     else:current=(current+' '+part).strip()
    if current:blocks.append({'t':'p','text':current})
   else:blocks.append(b)
  r['blocks']=blocks
 wordcount=lambda r:sum(len(re.sub('[«»_]','',b.get('text','')).split()) for b in r['blocks'] if b['t']!='aside')
 for k,r in lengths.items():
  w=wordcount(r);assert (300<=w<=360 if k=='short' else 650<=w<=680),(id,k,w)
  print(id,k,w)
 value='taking a burden for someone you love' if battle else 'hearing a loved life in a story'
 if value not in values['values']:values['values'].append(value)
 source={'corpus':'ramayana','tradition':'sanskrit','work':'Vālmīki Rāmāyaṇa','locus':raw['source']['receivedEditionLocus']+' (Shastri received numbering)','stability':'variant','traditionNote':common_note,'variants':[{'differs':'Received-text and critical-edition wording and numbering.','tellings':'The supplied audit uses Shastri’s received-text chapters; direct critical-edition collation remains incomplete.','weTell':'The named Shastri witness, without claiming cross-recension stability or adding the unnamed singers’ identities.' if not battle else 'The named Shastri witness, with the city-gate strategy and no invented duel between the two divine weapons.'}],'sourcing':[{'claim':c,'locus':l} for c,l in sourcing],'checkedAgainst':[f'Hari Prasad Shastri (1952), {label}: {url} — inspected 2026-11-21; received-text witness, not critical-edition collation' for label,url in raw['sourceLinks']],'reviewedBy':'rama','reviewedOn':DATE}
 doc={'id':id,'schemaVersion':'1.0','status':'published','version':1,'updated':DATE,'title':en['title'],'tease':'He takes his brother’s place, then waits at a city gate. The weapon he must keep away from is still inside.' if battle else 'Twelve years after hearing of the twins’ birth, he returns to the same hermitage. This time, a song brings tears.','source':source,'audience':{'minAge':8 if battle else 7,'gated':False,'sensitivity':['violence','death'] if battle else ['loss'],'careNote':raw['close']['en']['care']},'values':[value],'themes':['duty','care for a brother','strategy'] if battle else ['memory','family','music'],'calendar':{'festivals':[],'months':[],'tithi':[],'seasons':[],'weight':1},'characters':characters,'lengths':lengths,'linked':{'next':ids[1-ix],'reason':'The other journey of Śatrughna in the same Uttara Kāṇḍa sequence'},'close':{'question':raw['close']['en']['question'],'seed':raw['close']['en']['seed'],'ifTheyAsk':[{'q':q,'a':a} for q,a in raw['ifTheyAsk']['en']]}}
 write(f'content/stories/{id}.json',doc)
 text=(ROOT/f'content/stories/{id}.json').read_bytes();pin=hashlib.sha1(b'blob '+str(len(text)).encode()+b'\0'+text).hexdigest()
 assert not any(c['id']==id for c in canon['canon'])
 canon['canon'].append({'n':max(c['n'] for c in canon['canon'])+1,'id':id,'title':doc['title'],'corpus':'ramayana','tradition':'sanskrit','work':source['work'],'locus':source['locus'],'stability':source['stability'],'minAge':doc['audience']['minAge'],'sensitivity':doc['audience']['sensitivity'],'value':value,'hook':doc['tease'],'festivals':[],'status':'published','wave':5,'gated':False})
 hero=ROOT/f'public/media/stories/{id}/hero.webp';hero.parent.mkdir(parents=True,exist_ok=True);
 if (BATCH/f'art/{id}/hero.png').exists():Image.open(BATCH/f'art/{id}/hero.png').convert('RGB').save(hero,'WEBP',quality=88)
 elif not hero.exists():raise FileNotFoundError('Generate the story hero first: '+id)
 media['stories'][id]={'canonStatus':'published','storyVersion':1,'image':{'status':'approved','type':'illustration','file':f'/media/stories/{id}/hero.webp','reviewedBy':'codex-art-review','reviewedOn':DATE},'voiceover':{'en':{'status':'not_started','file':None}}}
 for lang in ['hi','ta']:
  e=raw['locales'][lang];gate={'status':'approved','reviewer':'rama','reviewedOn':DATE};ll={};scenes={}
  for length,r in e['lengths'].items():
   maps=(fullmap_b if battle else fullmap_s) if length=='full' else (shortmap_b if battle else shortmap_s)
   assert len(maps)==len(r['blocks'])
   blocks=[]
   for i,b in enumerate(r['blocks']):
    scene=f'{length}-{i+1}';bb={'t':b['t'],'scene':scene}
    # Preserve the native word and its full inflection, removing draft-only native-name markers.
    if 'text' in b:bb['text']=b['text'].replace('«','').replace('»','')
    blocks.append(bb);scenes[scene]=maps[i]
   ll[length]={'measuredSeconds':180 if length=='short' else 360,'blocks':blocks}
  names={term:lex[term]['native'].get('deva' if lang=='hi' else 'taml') for term in terms}
  fallback_ta={'Cyavana':'சியவனர்','Nandigrāma':'நந்திகிராமம்','Rudra':'ருத்ரன்','Rāma':'ராமர்','Sītā':'சீதை','Yamunā':'யமுனை'}
  for term,v in names.items():
   if not v:names[term]=fallback_ta[term]
  locale={'schemaVersion':'1.0','storyId':id,'sourceVersion':1,'sourceBlobSha1':pin,'locale':lang+'-IN','language':lang,'status':'approved','register':'सहज पारिवारिक कथन; पढ़कर सुनाने की भाषा।' if lang=='hi' else 'குடும்பத்தில் இயல்பாக வாசித்துச் சொல்லும் தமிழ் நடை.','title':e['title'],'tease':re.split(r'(?<=[।.!?])\s+',e['lengths']['short']['blocks'][0]['text'].replace('«','').replace('»',''))[0],'displayNames':names,'sourceMap':{'tease':[0],'scenes':scenes,'parentNote':list(range(len(sourcing))),'traditionNote':list(range(len(sourcing))),'ifTheyAsk':[[1],[2],[2,5]] if battle else [[0,1,2],[5],[6]]},'lengths':ll,'parentNote':raw['close'][lang]['care'],'traditionNote':notes[lang],'close':{'question':raw['close'][lang]['question'],'seed':raw['close'][lang]['seed'],'ifTheyAsk':[{'q':q,'a':a} for q,a in raw['ifTheyAsk'][lang]]},'review':{'nativeReadAloud':{'short':gate,'full':gate},'languageEditor':gate,'sourceFidelity':gate}}
  write(f'content/locales/{lang}/{id}.json',locale);pub['editions'].append({'storyId':id,'locale':lang+'-IN'})
 previews['previews'].append({'storyId':id,'defaultLocale':'hi-IN','locales':['hi-IN','ta-IN']})
write('content/canon.json',canon);write('content/media.json',media);write('content/values.json',values);write('content/locale-public.json',pub);write('content/locale-previews.json',previews)
write('studio/batches/2026-11-21-shatrughna/production-adaptations.json',{'changes':changes,'nativeProse':'All native words and inflections preserved; draft-only native guillemets removed rather than incorrectly substituting English identity keys.','timings':'Rama reported short 3 minutes / long 6 minutes after being explicitly asked for actual Hindi/Tamil timings. Recorded as whole-minute estimates, not stopwatch measurements.','criticalEdition':'Not collated; named Shastri received-text witness and limitations retained.'})
write('studio/batches/2026-11-21-shatrughna/approval.json',{'reviewer':'rama','date':DATE,'scope':'Both stories, English/Hindi/Tamil, short/full; user explicitly confirmed reading and approval.','userStatements':['this story is also verified and approved. ensur it has proper images and go ahead and publish this','yes go ahead','I have read the short telling is 3 mins and long is 6 mins. I approved'],'measuredSeconds':{'short':180,'full':360},'timingPrecision':'user-reported whole-minute estimates','artReview':'Agent inspected built-in image_gen outputs under explicit user instruction to provide proper images. No invented singers, weapons duel or graphic violence; no claim of human art approval.'})

# Complete acquisition metadata without writing any replacement story prose.
relations=read('content/relations.json')
for term in ['Śatrughna','Kuśa','Lava']:
 if not any(term in terms for terms in relations['clusters'].values()):relations['clusters']['Rāmāyaṇa'].append(term)
for edge in [['Rāma','Śatrughna','brothers'],['Bharata','Śatrughna','brothers'],['Sītā','Kuśa','mother'],['Sītā','Lava','mother']]:
 if edge not in relations['edges']:relations['edges'].append(edge)
write('content/relations.json',relations)
social=read('content/social.json');locales=read('content/social-locales.json')
for id in ids:
 battle='lavana' in id
 select=lambda indexes:{'hook':{'from':'title','mode':'full'},'blocks':[{'index':i,'mode':'firstSentence'} for i in indexes]}
 social['stories'][id]={'reel':select([1,3,6,8,10] if battle else [0,2,4,7,9])}
 for lang in ['hi-IN','ta-IN']:locales['locales'][lang]['stories'][id]=select([1,3,5,7,9] if battle else [0,2,3,5,7])
write('content/social.json',social);write('content/social-locales.json',locales)
