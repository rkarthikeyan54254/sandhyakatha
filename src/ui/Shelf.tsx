import { useMemo, useState } from 'react';
import type { AppLocale } from '../lib/app-locale';
import {
  localizedCorpusLabel,
  localizedTraditionLabel,
  localizedSourceWork,
  localizedSourceLocus,
  localizedCount
} from '../lib/app-locale';
import type { Card, CanonRow } from '../lib/types';
import { CORPUS_ORDER, FAMILY, FAMILY_ORDER } from '../lib/types';

type ShelfCopy = {
  title:string;
  intro:string;
  note:string;
  reviewed:(reviewed:number,available:number)=>string;
  source:string;
  telling:string;
  show:string;
  all:string;
  everything:string;
  written:string;
  regional:string;
  flagged:string;
  count:(written:number,planned:number,shown:number,total:number,hidden:boolean)=>string;
  planned:string;
  available:string;
  age:string;
  difficultHidden:string;
  familyLabel:Record<string,string>;
  familyNote:Record<string,string>;
  stability:Record<string,string>;
  sensitivity:Record<string,string>;
};

const COPY: Record<AppLocale,ShelfCopy> = {
  en:{
    title:'The shelf',
    intro:'Every written story is checked against a named source before publication. Nothing is generated while you wait — which is why the same story comes back word for word.',
    note:'Browse one collection in three languages. Changing language changes the edition, not the story.',
    reviewed:(r,a)=>`${r} reviewed · ${a} available here`,
    source:'Where it comes from',telling:'Which telling',show:'Show only',all:'All',
    everything:'Everything',written:'Written',regional:'Regional or variant',flagged:'Flagged for care',
    count:(w,p,s,t,h)=>`${w} written · ${p} still being written · ${s} of ${t} shown${h?' · the difficult ones are hidden':''}`,
    planned:'Being written',available:'Written',age:'ages',difficultHidden:'the difficult ones are hidden',
    familyLabel:{Itihāsa:'Itihāsa',Purāṇa:'Purāṇa',Upaniṣad:'Upaniṣad',Bhakti:'Bhakti',Nīti:'Nīti','How the stories reached us':'How the stories reached us'},
    familyNote:{
      Itihāsa:'What happened — the two great tellings, and the versions that disagree with them.',
      Purāṇa:'The old lore: gods, kings, and the making and unmaking of worlds.',
      Upaniṣad:'The questions, usually asked by someone very young.',
      Bhakti:'Lives of people who loved something enough to be remembered for it.',
      Nīti:'Worldly wisdom, told through animals who behave like us.',
      'How the stories reached us':'The stories about the stories — who wrote them down, and why.'
    },
    stability:{regional:'regional tradition',folk:'oral, no single text',variant:'recensions differ'},
    sensitivity:{death:'death','gender-norms':'gender norms',injustice:'injustice',loss:'loss','parental-conflict':'parental conflict','social-hierarchy':'social hierarchy',violence:'violence'}
  },
  'hi-IN':{
    title:'कहानियाँ',
    intro:'रामायण, महाभारत, पुराण, उपनिषद और भक्ति परंपराओं की कहानियाँ—हर हिन्दी संस्करण को मूल कहानी से मिलाकर, भाषा-संपादन और पढ़कर सुनाने की समीक्षा के बाद ही यहाँ रखा जाता है।',
    note:'यह एक ही संग्रह है, तीन भाषाओं में। भाषा बदलती है; कहानी की पहचान और स्रोत नहीं बदलते।',
    reviewed:(r,a)=>`${r} समीक्षित · ${a} यहाँ उपलब्ध`,
    source:'कहानी कहाँ से आती है',telling:'कौन-सी परंपरा',show:'सिर्फ़ ये दिखाएँ',all:'सभी',
    everything:'सब',written:'लिखी हुई',regional:'क्षेत्रीय या भिन्न पाठ',flagged:'सावधानी वाली',
    count:(w,p,s,t,h)=>`${w} लिखी हुई · ${p} तैयार हो रही · ${t} में से ${s} दिख रही हैं${h?' · कठिन कहानियाँ अभी छिपी हैं':''}`,
    planned:'तैयार हो रही',available:'लिखी हुई',age:'उम्र',
    difficultHidden:'कठिन कहानियाँ अभी छिपी हैं',
    familyLabel:{Itihāsa:'इतिहास',Purāṇa:'पुराण',Upaniṣad:'उपनिषद',Bhakti:'भक्ति',Nīti:'नीति','How the stories reached us':'कथाएँ हम तक कैसे पहुँचीं'},
    familyNote:{
      Itihāsa:'दो महाकाव्य—और वे परंपराएँ जो कभी-कभी उनसे अलग तरह से कहानी कहती हैं।',
      Purāṇa:'देवताओं, राजाओं और संसार के बनने-बिगड़ने की पुरानी कथाएँ।',
      Upaniṣad:'बड़े प्रश्न—अक्सर किसी बहुत छोटे प्रश्नकर्ता की आवाज़ में।',
      Bhakti:'उन लोगों की जीवन-कथाएँ जिनका प्रेम इतना गहरा था कि पीढ़ियाँ उन्हें याद रखती रहीं।',
      Nīti:'जानवरों की कहानियों में छिपी रोज़मर्रा की समझ।',
      'How the stories reached us':'कहानी के पीछे की कहानी—किसने लिखा, किसने सँभाला, और वह हम तक कैसे पहुँची।'
    },
    stability:{regional:'क्षेत्रीय परंपरा',folk:'मौखिक परंपरा',variant:'पाठों में भिन्नता'},
    sensitivity:{death:'मृत्यु','gender-norms':'लैंगिक मान्यताएँ',injustice:'अन्याय',loss:'वियोग','parental-conflict':'माता-पिता से टकराव','social-hierarchy':'सामाजिक ऊँच-नीच',violence:'हिंसा'}
  },
  'ta-IN':{
    title:'கதைகள்',
    intro:'இராமாயணம், மகாபாரதம், புராணங்கள், உபநிடதங்கள், பக்தி மரபுகள்—ஒவ்வொரு தமிழ் பதிப்பும் மூலக் கதையுடன் மீண்டும் ஒப்பிடப்பட்டு, தமிழ்ச் செம்மையும் வாசித்துச் சொல்லும் சோதனையும் முடிந்த பிறகே இங்கே வருகிறது.',
    note:'இது மூன்று தனித் தொகுப்புகள் அல்ல; ஒரே கதைத் தொகுப்பு, மூன்று மொழிகளில். மொழி மாறினாலும் கதையின் அடையாளமும் ஆதாரமும் மாறாது.',
    reviewed:(r,a)=>`${r} மதிப்பாய்வு செய்யப்பட்டவை · ${a} இங்கே கிடைக்கின்றன`,
    source:'கதை எங்கிருந்து வருகிறது',telling:'எந்த மரபில் சொல்லப்படுகிறது',show:'இவற்றை மட்டும் காட்டு',all:'அனைத்தும்',
    everything:'எல்லா கதைகளும்',written:'எழுதப்பட்டவை',regional:'வட்டார / மாறுபட்ட வடிவம்',flagged:'கவனத்துடன் வாசிக்க வேண்டியவை',
    count:(w,p,s,t,h)=>`${w} எழுதப்பட்டவை · ${p} தயாராகின்றன · ${t}-ல் ${s} காட்டப்படுகின்றன${h?' · கடினமான கதைகள் இப்போது மறைக்கப்பட்டுள்ளன':''}`,
    planned:'தயாராகிறது',available:'எழுதப்பட்டது',age:'வயது',
    difficultHidden:'கடினமான கதைகள் இப்போது மறைக்கப்பட்டுள்ளன',
    familyLabel:{Itihāsa:'இதிகாசம்',Purāṇa:'புராணம்',Upaniṣad:'உபநிடதம்',Bhakti:'பக்தி',Nīti:'நீதி','How the stories reached us':'கதைகள் நம்மிடம் வந்த பாதை'},
    familyNote:{
      Itihāsa:'இரு பெரும் இதிகாசங்கள்—அவற்றோடு ஒத்துப் போகாத பிற சொல்லாக்கங்களும்.',
      Purāṇa:'தேவர்கள், அரசர்கள், உலகின் உருவாக்கமும் அழிவும் பற்றிய பழங்கதைகள்.',
      Upaniṣad:'பெரிய கேள்விகள்—பல நேரங்களில் ஒரு சிறிய வயதுடைய கேள்வியாளரிடமிருந்து.',
      Bhakti:'அன்பால் தலைமுறைகள் நினைவில் வைத்த மனிதர்களின் வாழ்க்கைக் கதைகள்.',
      Nīti:'நம்மைப் போல நடக்கும் விலங்குகள் வழியாக சொல்லப்படும் வாழ்வறிவு.',
      'How the stories reached us':'கதைகளின் பின்னாலுள்ள கதை—யார் எழுதினர், எப்படிப் பாதுகாக்கப்பட்டது, எப்படித் தொடர்ந்து வந்தது.'
    },
    stability:{regional:'வட்டார மரபு',folk:'வாய்மொழி மரபு',variant:'பாட வேறுபாடு'},
    sensitivity:{death:'மரணம்','gender-norms':'பாலின மரபுகள்',injustice:'அநீதி',loss:'இழப்பு','parental-conflict':'பெற்றோர் மோதல்','social-hierarchy':'சமூக ஏற்றத் தாழ்வு',violence:'வன்முறை'}
  }
};

export default function Shelf({ canon, cards, availableIds, gate, locale = 'en', onRead }: {
  canon: CanonRow[];
  cards: Card[];
  availableIds: Set<string>;
  gate: boolean;
  locale?: AppLocale;
  onRead: (id: string) => void;
}) {
  const [corpus, setCorpus] = useState('all');
  const [trad, setTrad] = useState('all');
  const [only, setOnly] = useState('all');
  const copy=COPY[locale];
  const localizedCards=useMemo(()=>new Map(cards.map(card=>[card.id,card])),[cards]);

  const visible = canon.filter(c => {
    if (c.gated && !gate) return false;
    if (locale !== 'en' && c.gated) return false; // approved, but deliberately not public
    if (corpus !== 'all' && c.corpus !== corpus) return false;
    if (trad !== 'all' && c.tradition !== trad) return false;
    if (only === 'written' && !availableIds.has(c.id)) return false;
    if (only === 'regional' && c.stability === 'stable') return false;
    if (only === 'flagged' && !c.sensitivity.length) return false;
    return true;
  });

  const present = new Set(canon.map(c => c.corpus));
  const traditions = [...new Set(canon.map(c => c.tradition))];
  const reviewed=canon.filter(c=>c.status==='published').length;
  const available=canon.filter(c=>availableIds.has(c.id) && (!c.gated || locale==='en' && gate || !c.gated)).length;
  const writtenVisible=visible.filter(c=>availableIds.has(c.id)).length;
  const plannedVisible=visible.filter(c=>!availableIds.has(c.id)).length;

  return (
    <section className="shelf locale-copy" lang={locale === 'en' ? 'en' : locale === 'hi-IN' ? 'hi' : 'ta'}>
      <span className="eyebrow shelf-count">{copy.reviewed(reviewed,available)}</span>
      <h1 className="page">{copy.title}</h1>
      <p className="sub">{copy.intro}</p>
      <p className="sub shelf-language-note">{copy.note}</p>

      <div className="facet">
        <span className="lab">{copy.source}</span>
        <div className="opts">
          <Chip on={corpus === 'all'} onClick={() => setCorpus('all')}>{copy.all}</Chip>
          {CORPUS_ORDER.filter(k => present.has(k)).map(k =>
            <Chip key={k} on={corpus === k} onClick={() => setCorpus(k)}>{localizedCorpusLabel(k,locale)}</Chip>)}
        </div>
      </div>

      <div className="facet">
        <span className="lab">{copy.telling}</span>
        <div className="opts">
          <Chip on={trad === 'all'} onClick={() => setTrad('all')}>{copy.all}</Chip>
          {traditions.map(t => <Chip key={t} on={trad === t} onClick={() => setTrad(t)}>{localizedTraditionLabel(t,locale)}</Chip>)}
        </div>
      </div>

      <div className="facet">
        <span className="lab">{copy.show}</span>
        <div className="opts">
          {[
            ['all',copy.everything],
            ['written',copy.written],
            ['regional',copy.regional],
            ['flagged',copy.flagged]
          ].map(([k,l]) => <Chip key={k} on={only === k} onClick={() => setOnly(k)}>{l}</Chip>)}
        </div>
      </div>

      <p className="count">{copy.count(writtenVisible,plannedVisible,visible.length,canon.length,!gate)}</p>

      {FAMILY_ORDER.map(family => {
        const inFamily = CORPUS_ORDER.filter(k => FAMILY[k] === family && visible.some(c => c.corpus === k));
        if (!inFamily.length) return null;
        return (
          <section key={family}>
            <div className="family">
              <h2>{copy.familyLabel[family] ?? family}</h2>
              <p>{copy.familyNote[family] ?? ''}</p>
            </div>
            {inFamily.map(k => {
              const rows = visible.filter(c => c.corpus === k);
              return (
                <div key={k}>
                  <div className="hair"><span className="eyebrow">{localizedCorpusLabel(k,locale)}</span><span className="n">{rows.length}</span></div>
                  {rows.map(c => {
                    const card=localizedCards.get(c.id);
                    const written=availableIds.has(c.id) && !!card;
                    const Row = written ? 'button' : 'div';
                    const title=card?.title ?? c.title;
                    const hook=card?.tease ?? c.hook;
                    return (
                      <Row key={c.id} className={'mini' + (written ? '' : ' locked')}
                           {...(written ? { onClick: () => onRead(c.id) } : {})}>
                        <span className="num">{String(c.n).padStart(2, '0')}</span>
                        <span className="t">
                          <h3>{title}
                            {written
                              ? <em className="pub">{copy.available}</em>
                              : <em className="soon">{copy.planned}</em>}
                          </h3>
                          <p>{localizedSourceWork(c.work,locale)} · {localizedSourceLocus(c.locus,locale)} · {copy.age} {c.minAge}+</p>
                          <p>{hook}</p>
                          <span className="tags">
                            <i className="tag trad">{localizedTraditionLabel(c.tradition,locale)}</i>
                            {c.stability !== 'stable' && <i className="tag stab">{copy.stability[c.stability] ?? c.stability}</i>}
                            {c.sensitivity.map(s => <i key={s} className="tag sens">{copy.sensitivity[s] ?? s}</i>)}
                          </span>
                        </span>
                      </Row>
                    );
                  })}
                </div>
              );
            })}
          </section>
        );
      })}
      {locale !== 'en' && <p className="locale-integrity">{localizedCount(available,locale)}</p>}
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className="chipbtn" aria-pressed={on} onClick={onClick}>{children}</button>;
}
