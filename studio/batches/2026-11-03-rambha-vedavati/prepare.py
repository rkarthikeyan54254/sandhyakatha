import json, pathlib
B=pathlib.Path(__file__).parent
if (B/'approval.json').exists():
 raise SystemExit('Approved packet is frozen; revise with a renewed approval record.')
read=lambda p:json.loads(p.read_text())
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
claims={
'rambha-sevenfold-curse':[
('Rāvaṇa camps on Kailāsa at night; moonlit forest, flowers, pools, Mandākinī and music surround him.','Uttara 26.1–13'),
('Rambhā passes the army adorned for a meeting; Rāvaṇa stops her and proposes himself.','Uttara 26.14–27'),
('Rambhā appeals for protection and release; she identifies Nalakūbara, son of Kubera, as her chosen partner and invokes daughter-in-law kinship.','Uttara 26.28–38'),
('Rāvaṇa argues that apsarās have no exclusive husband and rapes Rambhā despite her pleas.','Uttara 26.39–43'),
('Distressed Rambhā reports the assault to Nalakūbara, with disturbed ornaments; she seeks pardon although the assault was forced.','Uttara 26.44–51'),
('Nalakūbara establishes the event through meditation, takes water and curses Rāvaṇa: forcing an unwilling woman again will split his head in seven.','Uttara 26.52–55'),
('Divine drums and flowers accompany the curse; Rāvaṇa fears it and desists from forced sexual union; captive women rejoice.','Uttara 26.56–60'),
('Rāvaṇa separately attributes his restraint toward captive Sītā to Brahmā’s hundred-piece curse after the assault on Puñjikasthalā. The episodes are not interchangeable.','Yuddha 13.11–15'),
('Rāvaṇa later recalls Rambhā among those whose words have come to pass.','Yuddha 60.11')],
'vedavati-hair-and-vow':[
('Vedavatī lives as an ascetic in the Himalayan forest, with matted hair and a black antelope skin; Rāvaṇa questions her.','Uttara 17.1–8'),
('She is Kuśadhvaja’s daughter; he studies the Vedas and wishes her to marry Viṣṇu, refusing other suitors.','Uttara 17.8–13'),
('The daitya Śambhu murders her sleeping father; her mother enters the fire holding his body. This Śambhu is not Śiva.','Uttara 17.13–15'),
('Vedavatī devotes herself to Nārāyaṇa, performs tapas, knows Rāvaṇa and asks him to leave.','Uttara 17.16–19'),
('Rāvaṇa offers her life as his consort in Laṅkā, disparages Viṣṇu, and is rebuked by her.','Uttara 17.20–27'),
('Rāvaṇa seizes her hair; she cuts the held hair with a hand sharp as a sword. No completed rape is described.','Uttara 17.28–29'),
('She declares she will end her life and be reborn for his destruction; she will not expend tapas on a curse and invokes gifts and sacrifice for a worthy birth.','Uttara 17.30–34'),
('She enters the fire and flowers fall; the named Shastri witness identifies her with Sītā, Janaka’s daughter found in a ploughed field. The separately inspected Sanskrit page includes an intervening lotus/sea passage; do not silently conflate witnesses.','Uttara 17, Shastri concluding paragraphs; Sanskrit web witness 17.35–44'),
('After defeat by Rāma, Rāvaṇa recalls his assault on Vedavatī and identifies her with Sītā.','Yuddha 60.1–10')]
}
refs={'rambha':'Rambhā','nalakubara':'Nalakūbara','ravana':'Rāvaṇa','kubera':'Kubera','sita':'Sītā','vedavati':'Vedavatī','vishnu':'Viṣṇu','narayana':'Nārāyaṇa','kushadhvaja':'Kuśadhvaja','shambhu':'Śambhu','janaka':'Janaka','rama':'Rāma'}
for id,cs in claims.items():
 d=read(B/'original'/f'{id}.json');d['updated']='2026-11-03';d['source']['tradition']='sanskrit'
 d['source']['parallels']=[{'work':'Vālmīki Rāmāyaṇa','locus':'Yuddha Kāṇḍa 13 and 60' if id.startswith('rambha') else 'Yuddha Kāṇḍa 60.10'}]
 d['source'].pop('reviewedBy',None);d['source'].pop('reviewedOn',None)
 d['title'] = 'Rāvaṇa’s Assault on Rambhā and the Sevenfold Curse' if id.startswith('rambha') else 'Rāvaṇa’s Assault on Vedavatī and Her Vow'
 d['source']['sourcing']=[dict(claim=c,locus=l) for c,l in cs]
 d['source']['checkedAgainst']=[x+' (inspected 2026-11-03; web witness, not critical-edition collation)' for x in d['source']['checkedAgainst']]
 d['characters']=[dict(ref=refs[x['ref']],role={'support':'present','antagonist':'foil','mention':'mentioned'}.get(x['role'],x['role'])) for x in d['characters']]
 d['values']=['asking instead of taking','owning what you did'] if id.startswith('rambha') else ['deciding, and not being talked out of it','there is no clean moral here']
 if id.startswith('rambha'):
  d['source']['locus']='Uttara Kāṇḍa 26.1–60 (web Sanskrit numbering); Shastri chapter 26'
  d['source']['traditionNote']='Follows Uttara 26. Nalakūbara’s seven-piece curse after the assault on Rambhā is separate from Brahmā’s hundred-piece curse after the assault on Puñjikasthalā in Yuddha 13. Verse numbers vary; no complete recension collation is claimed.'
  d['audience']['sensitivity']=['violence','injustice','gender-norms']
  d['audience']['careNote']='Rāvaṇa rapes Rambhā after she asks to leave; no graphic description. She seeks pardon although she did nothing wrong. A curse threatens to split his head in seven. Read privately first; this is for older readers with parental opt-in.'
  for b in d['lengths']['full']['blocks']:
   if b.get('text','').startswith('Long afterward'): b['t']='aside';b['text']='The separate account in Yuddha 13 names Brahmā and Puñjikasthalā. Do not present Nalakūbara’s curse as the sole explanation for Sītā’s protection.'
   if b.get('text','').startswith('He ignored her pleas'):b['text']='He ignored her pleas and raped her. She had asked him to let her go; he had heard her and refused.'
  # Restore sourced scene after moving the cross-account note out of the spoken lane.
  d['lengths']['full']['blocks'].insert(3,{'t':'p','text':'She wore a dark blue cloth and flowers in her hair. A jewelled belt and garlands adorned her. She had dressed to meet the man she loved, and she was passing through the ranks of the army on her way to him.'})
 else:
  d['source']['stability']='variant'
  d['source']['traditionNote']='Follows Shastri’s Uttara 17 ending, identifying Vedavatī with Sītā. The inspected Sanskrit web text adds a lotus-and-sea episode before Janaka finds her. That episode is not narrated here. Yuddha 60.10 also identifies her with Sītā; numbering varies.'
  d['source']['variants']=[{'differs':'Sequence between the fire and Sītā’s appearance.','tellings':'The inspected Sanskrit web witness includes a lotus birth and casting into the sea; Shastri’s chapter passes directly to the identification with Janaka’s daughter.','weTell':'The named Shastri witness, without importing the additional episode. Human source review must resolve witness selection before publication.'}]
  d['audience']['sensitivity']=['death','violence','loss','gender-norms']
  d['audience']['careNote']='Rāvaṇa seizes Vedavatī’s hair. She cuts it free, then enters fire and dies. Her father is murdered; her mother also enters fire. No graphic detail. Read privately first. Assault does not make a victim impure; this ending is not conduct to imitate.'
  for b in d['lengths']['full']['blocks']:
   if b.get('text','').startswith('Then «Rāvaṇa» seized'): b['text']='Then «Rāvaṇa» seized her by the hair. She had already told him whom she wished to marry and asked him to leave. Now he held her against her will.'
   if b.get('text','').startswith('The telling does not ask'):b['t']='aside';b['text']='Her death is not advice for anyone who has been harmed. Being assaulted does not make a person impure. Keep that distinction clear when discussing this sacred narrative.'
  d['lengths']['full']['blocks'].insert(8,{'t':'p','text':'She had received her visitor with the hospitality due to a guest. When she spoke of her father, she named him as a sage devoted to study. His wish for her marriage was the wish she herself continued to hold.'})
  d['close']['ifTheyAsk'][1]['q']='Why did she enter the fire? Should someone harmed do the same?'
 write(B/'en'/f'{id}.json',d)
 print(id, {k:sum(len(x.get('text','').replace('«','').replace('»','').replace('_','').split()) for x in r['blocks'] if x['t']!='aside') for k,r in d['lengths'].items()})
