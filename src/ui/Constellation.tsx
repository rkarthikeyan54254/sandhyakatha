import { useMemo, useState } from 'react';
import type { AppLocale } from '../lib/app-locale';
import type { Lexicon, Relations, Card } from '../lib/types';
import {
  constellationLayout,
  deriveConstellation,
  storiesForTerm,
  type ConstellationDiscovery,
  type ConstellationPoint
} from '../lib/constellation';

type ShareState = 'idle' | 'working' | 'saved';

type MapCopy = {
  loading:string;
  title:(name:string)=>string;
  intro:string;
  emptyEyebrow:string;
  emptyTitle:string;
  emptyBody:string;
  tonight:string;
  lit:string;
  notMet:string;
  litBy:string;
  termHint:string;
  tapTitle:string;
  tapBody:string;
  darkTitle:string;
  darkBody:string;
  stats:[string,string,string];
  discoveryOn:string;
  discoveryOff:string;
  discoveryTitle:string;
  discoveryIntro:string;
  discoveryMore:(n:number)=>string;
  noCrossTitle:string;
  noCrossBody:string;
  keepsake:string;
  shareTitle:string;
  shareBody:string;
  drawing:string;
  saved:string;
  share:string;
  nameShared:(name:string)=>string;
  noName:string;
  cardSubtitle:string;
  cardConnection:string;
  cardMore:string;
  cardHistory:string;
  cardPrivacy:string;
  shareText:string;
  kind:Record<string,string>;
};

const COPY: Record<AppLocale,MapCopy> = {
  en:{
    loading:'Loading the sky…',
    title:name=>name?`${name}'s constellation`:'The constellation',
    intro:'Characters, places, texts and traditions from the collection, and how they connect. They light up only from stories you have actually marked as heard.',
    emptyEyebrow:'The sky starts dark on purpose',
    emptyTitle:'Your first story will light the first names.',
    emptyBody:'No points, streaks or badges. When two names you have met share a relationship that our editors deliberately mapped, that line lights too.',
    tonight:"Read tonight's story",lit:'lit',notMet:'not met yet',litBy:'Lit by',termHint:'Part of the curated Sandhya Katha map.',
    tapTitle:'Tap a light',tapBody:'Gold names have appeared in stories you have heard. Dashed lines cross between different parts of the collection. Every relationship is curated; simple co-occurrence never creates one.',
    darkTitle:'Explore the dark map',darkBody:'Tap any point to see what belongs here. The map fills from real reading history, not activity scores — so nothing lights until a story has actually been heard.',
    stats:['Stories heard','Names lit','Crossings found'],
    discoveryOn:'Connections that lit up',discoveryOff:'What appears next',
    discoveryTitle:'The stories are beginning to meet each other.',
    discoveryIntro:'These are not generated associations. Each one is an explicitly curated relationship in the Sandhya Katha map.',
    discoveryMore:n=>`+ ${n} more crossing${n===1?'':'s'} glowing in the map.`,
    noCrossTitle:'The first crossing has not lit yet.',
    noCrossBody:'As you hear stories from different parts of the collection, a relationship can cross the map. We only show one when the relationship itself has been deliberately recorded — never because two names happened to occur together.',
    keepsake:'A keepsake, not a score',shareTitle:'Share this constellation',
    shareBody:"The image is drawn on this device from the stories you marked as heard. Sandhya Katha does not upload the child's reading history to make it.",
    drawing:'Drawing constellation…',saved:'Constellation saved · link copied',share:'Share this constellation',
    nameShared:name=>`The shared image includes the first name “${name}” because you chose to share it.`,
    noName:'No child name is included because none was provided.',
    cardSubtitle:'The old stories, slowly becoming one map.',cardConnection:'A CONNECTION THAT LIT UP',
    cardMore:'More connections appear as the stories meet each other.',
    cardHistory:'Built only from stories this family marked as heard.',
    cardPrivacy:'Made on this device · reading history is not uploaded for this image.',
    shareText:'The old stories, slowly becoming one map. Build yours on Sandhya Katha.',
    kind:{person:'person',place:'place',text:'text',being:'figure',word:'word'}
  },
  'hi-IN':{
    loading:'मानचित्र तैयार हो रहा है…',
    title:name=>name?`${name} का मानचित्र`:'कथाओं का मानचित्र',
    intro:'संग्रह के पात्र, स्थान, ग्रंथ और परंपराएँ—और उनके बीच के रिश्ते। वही नाम जगते हैं जो आपने सचमुच सुनी हुई कहानियों में पाए हैं।',
    emptyEyebrow:'मानचित्र जान-बूझकर अँधेरे से शुरू होता है',
    emptyTitle:'पहली कहानी पहले नामों को रोशन करेगी।',
    emptyBody:'यह अंक, स्ट्रीक या बैज का खेल नहीं है। आपने जिन दो नामों को सुना है, उनके बीच संपादकों ने कोई वास्तविक संबंध दर्ज किया है तभी वह रेखा जगती है।',
    tonight:'आज रात की कहानी पढ़ें',lit:'जगा हुआ',notMet:'अभी कहानी में नहीं मिला',litBy:'इन कहानियों से जगा',termHint:'संध्या कथा के संपादित मानचित्र का हिस्सा।',
    tapTitle:'किसी रोशनी पर टैप करें',tapBody:'सुन चुकी कहानियों के नाम सुनहरे दिखते हैं। बिंदीदार रेखाएँ संग्रह के अलग हिस्सों को जोड़ती हैं। हर रिश्ता संपादित है; सिर्फ़ दो नाम एक कहानी में आ जाएँ तो रेखा नहीं बनती।',
    darkTitle:'अँधेरे मानचित्र को देखें',darkBody:'किसी बिंदु पर टैप करें। यह मानचित्र वास्तविक पढ़ने-सुनने के इतिहास से भरता है, गतिविधि के अंकों से नहीं। कहानी सचमुच सुनी जाने तक कुछ नहीं जगता।',
    stats:['सुनी कहानियाँ','जगे नाम','जुड़े रास्ते'],
    discoveryOn:'जो रिश्ते अब दिखने लगे',discoveryOff:'आगे क्या जगेगा',
    discoveryTitle:'कहानियाँ अब एक-दूसरे से मिलने लगी हैं।',
    discoveryIntro:'ये मशीन द्वारा बनाए गए संबंध नहीं हैं। हर रिश्ता संध्या कथा के मानचित्र में जान-बूझकर संपादित और दर्ज किया गया है।',
    discoveryMore:n=>`मानचित्र में ${n} और संबंध जग रहे हैं।`,
    noCrossTitle:'पहला पार-संबंध अभी नहीं जगा है।',
    noCrossBody:'जब अलग-अलग परंपराओं की कहानियाँ सुनेंगे, उनके बीच कोई दर्ज रिश्ता मानचित्र को पार कर सकता है। हम वही दिखाते हैं जिसे संपादकीय रूप से सचमुच जोड़ा गया है।',
    keepsake:'याद के लिए, अंक के लिए नहीं',shareTitle:'यह मानचित्र साझा करें',
    shareBody:'यह चित्र इसी डिवाइस पर आपकी सुनी हुई कहानियों से बनता है। इसे बनाने के लिए बच्चे का पढ़ने का इतिहास अपलोड नहीं किया जाता।',
    drawing:'मानचित्र बना रहे हैं…',saved:'मानचित्र सहेजा · लिंक कॉपी हुआ',share:'मानचित्र साझा करें',
    nameShared:name=>`साझा चित्र में “${name}” नाम इसलिए है क्योंकि आपने इसे साझा करना चुना है।`,
    noName:'बच्चे का नाम नहीं दिया गया, इसलिए साझा चित्र में कोई नाम नहीं जाएगा।',
    cardSubtitle:'पुरानी कथाएँ, धीरे-धीरे एक मानचित्र बनती हुईं।',cardConnection:'एक नया रिश्ता जगा',
    cardMore:'कहानियाँ मिलेंगी तो और रिश्ते दिखाई देंगे।',
    cardHistory:'केवल उन्हीं कहानियों से बना जिन्हें इस परिवार ने सुना हुआ चिह्नित किया।',
    cardPrivacy:'इसी डिवाइस पर बना · इस चित्र के लिए पढ़ने का इतिहास अपलोड नहीं होता।',
    shareText:'पुरानी कथाएँ धीरे-धीरे एक मानचित्र बनती हैं। अपना मानचित्र संध्या कथा पर बनाएँ।',
    kind:{person:'पात्र',place:'स्थान',text:'ग्रंथ',being:'दैवी / कथात्मक पात्र',word:'शब्द'}
  },
  'ta-IN':{
    loading:'வரைபடம் தயாராகிறது…',
    title:name=>name?`${name}வின் கதை வரைபடம்`:'கதைகளின் வரைபடம்',
    intro:'இந்தத் தொகுப்பின் பாத்திரங்கள், இடங்கள், நூல்கள், மரபுகள்—அவை ஒன்றோடு ஒன்று எப்படி இணைகின்றன என்பதற்கான வரைபடம். நீங்கள் உண்மையில் கேட்ட கதைகளில் வந்த பெயர்கள் மட்டுமே ஒளிரும்.',
    emptyEyebrow:'இந்த வரைபடம் வேண்டுமென்றே இருளில் தொடங்குகிறது',
    emptyTitle:'முதல் கதை முதல் பெயர்களை ஒளிரச் செய்யும்.',
    emptyBody:'புள்ளி, தொடர் நாள், பதக்கம் எதுவும் இல்லை. நீங்கள் சந்தித்த இரண்டு பெயர்களுக்கிடையே ஆசிரியர்கள் உண்மையான உறவை பதிவு செய்திருந்தால் மட்டுமே அந்தக் கோடு ஒளிரும்.',
    tonight:'இன்றிரவு கதையை வாசிக்க',lit:'ஒளிர்கிறது',notMet:'இன்னும் கதையில் சந்திக்கவில்லை',litBy:'இந்தக் கதைகளால் ஒளிர்ந்தது',termHint:'சந்தியா கதாவின் ஆசிரியர் தேர்ந்தெடுத்த வரைபடத்தின் ஒரு பகுதி.',
    tapTitle:'ஒரு ஒளியைத் தொடுங்கள்',tapBody:'நீங்கள் கேட்ட கதைகளில் வந்த பெயர்கள் பொன்னிறத்தில் தெரியும். புள்ளிக் கோடுகள் தொகுப்பின் வெவ்வேறு பகுதிகளை இணைக்கும். ஒவ்வொரு உறவும் ஆசிரியர் தேர்ந்தெடுத்தது; இரண்டு பெயர்கள் ஒரே கதையில் வந்ததால் மட்டும் கோடு உருவாகாது.',
    darkTitle:'இருண்ட வரைபடத்தை ஆராயுங்கள்',darkBody:'எந்தப் புள்ளியையும் தொடுங்கள். இது உண்மையான வாசிப்பு வரலாற்றிலிருந்து மெதுவாக நிரம்பும்; செயல்பாட்டு மதிப்பெண்களால் அல்ல. ஒரு கதை உண்மையில் கேட்கப்படும் வரை எதுவும் ஒளிராது.',
    stats:['கேட்ட கதைகள்','ஒளிரும் பெயர்கள்','கண்ட இணைப்புகள்'],
    discoveryOn:'இப்போது ஒளிரும் தொடர்புகள்',discoveryOff:'அடுத்து என்ன தோன்றும்',
    discoveryTitle:'கதைகள் ஒன்றை ஒன்று சந்திக்கத் தொடங்கியுள்ளன.',
    discoveryIntro:'இவை தானாக உருவாக்கப்பட்ட தொடர்புகள் அல்ல. ஒவ்வொரு உறவும் சந்தியா கதா வரைபடத்தில் ஆசிரியர்களால் தனியாகப் பதிவு செய்யப்பட்டவை.',
    discoveryMore:n=>`வரைபடத்தில் இன்னும் ${n} தொடர்புகள் ஒளிர்கின்றன.`,
    noCrossTitle:'முதல் குறுக்கு இணைப்பு இன்னும் ஒளிரவில்லை.',
    noCrossBody:'தொகுப்பின் வெவ்வேறு பகுதிகளில் இருந்து கதைகள் கேட்கும்போது, பதிவு செய்யப்பட்ட ஒரு உறவு வரைபடத்தைத் தாண்டி இணைக்கலாம். இரண்டு பெயர்கள் அருகில் வந்ததால் மட்டும் அதை நாம் காட்டமாட்டோம்.',
    keepsake:'நினைவாக வைத்துக்கொள்ள; மதிப்பெண்ணாக அல்ல',shareTitle:'இந்த வரைபடத்தைப் பகிருங்கள்',
    shareBody:'நீங்கள் கேட்டதாகக் குறித்த கதைகளிலிருந்து இந்தச் சாதனத்திலேயே படம் உருவாகிறது. அதை உருவாக்க குழந்தையின் வாசிப்பு வரலாறு பதிவேற்றப்படாது.',
    drawing:'வரைபடம் வரைகிறது…',saved:'வரைபடம் சேமிக்கப்பட்டது · இணைப்பு நகலானது',share:'வரைபடத்தைப் பகிருங்கள்',
    nameShared:name=>`“${name}” என்ற முதல் பெயரைப் பகிர நீங்கள் தேர்ந்தெடுத்ததால் அது படத்தில் சேர்க்கப்பட்டுள்ளது.`,
    noName:'குழந்தையின் பெயர் கொடுக்கப்படவில்லை; அதனால் பகிரும் படத்திலும் பெயர் இருக்காது.',
    cardSubtitle:'பழைய கதைகள், மெதுவாக ஒரே வரைபடமாக.',cardConnection:'ஒரு தொடர்பு ஒளிர்ந்தது',
    cardMore:'கதைகள் ஒன்றை ஒன்று சந்திக்கும்போது மேலும் தொடர்புகள் தோன்றும்.',
    cardHistory:'இந்தக் குடும்பம் கேட்டதாகக் குறித்த கதைகளிலிருந்து மட்டும் உருவாக்கப்பட்டது.',
    cardPrivacy:'இந்தச் சாதனத்திலேயே உருவாக்கப்பட்டது · இந்தப் படத்திற்காக வாசிப்பு வரலாறு பதிவேற்றப்படாது.',
    shareText:'பழைய கதைகள் மெதுவாக ஒரே வரைபடமாகின்றன. உங்கள் வரைபடத்தை சந்தியா கதாவில் உருவாக்குங்கள்.',
    kind:{person:'பாத்திரம்',place:'இடம்',text:'நூல்',being:'தெய்வ / கதைப் பாத்திரம்',word:'சொல்'}
  }
};

const CLUSTER: Record<string,{hi:string;ta:string}> = {
  'Rāmāyaṇa':{hi:'रामायण',ta:'இராமாயணம்'},
  'Mahābhārata':{hi:'महाभारत',ta:'மகாபாரதம்'},
  'Vraja':{hi:'व्रज',ta:'விரஜம்'},
  'Bhāgavatam':{hi:'भागवत',ta:'பாகவதம்'},
  'Upaniṣads':{hi:'उपनिषद',ta:'உபநிடதங்கள்'},
  'Tamil saints':{hi:'तमिल संत',ta:'தமிழ் அடியார்கள்'},
  'The gods':{hi:'देवता',ta:'தேவர்கள்'},
  'The Devī':{hi:'देवी',ta:'தேவி'}
};

const REL: Record<string,{hi:string;ta:string}> = {
  'brothers':{hi:'भाई',ta:'சகோதரர்கள்'},
  'brothers — across two epics, six centuries apart':{hi:'दो महाकाव्यों में भाई—कथाओं में सदियों का अंतर',ta:'இரு இதிகாசங்களிலும் சகோதரர்கள்—கதைகளில் பல நூற்றாண்டுகள் இடைவெளி'},
  'brothers — and one mango':{hi:'भाई—और एक आम',ta:'சகோதரர்கள்—ஒரு மாம்பழமும்'},
  'brothers — one of them left':{hi:'भाई—एक घर छोड़ गया',ta:'சகோதரர்கள்—ஒருவர் வீட்டை விட்டுச் சென்றார்'},
  'built for him':{hi:'उसके लिए बनाया',ta:'அவருக்காக கட்டப்பட்டது'},
  'built it':{hi:'इसे बनाया',ta:'இதை கட்டினார்'},
  'built there':{hi:'वहाँ बनाया',ta:'அங்கே கட்டினார்'},
  'drove his chariot — the boy of Vraja, grown':{hi:'उसका रथ चलाया—व्रज का वही बालक, अब बड़ा',ta:'அவனுடைய தேரை ஓட்டினார்—விரஜத்தின் அந்தச் சிறுவன், இப்போது பெரியவர்'},
  'father':{hi:'पिता',ta:'தந்தை'},'friends':{hi:'मित्र',ta:'நண்பர்கள்'},
  'further along the same night':{hi:'उसी रात आगे की घटना',ta:'அதே இரவில் அடுத்த நிகழ்வு'},
  'gave up a piece of himself to make her':{hi:'उसे बनाने के लिए अपनी शक्ति का अंश दिया',ta:'அவளை உருவாக்க தன் சக்தியின் ஒரு பகுதியை அளித்தார்'},
  'grew up there':{hi:'वहीं बड़े हुए',ta:'அங்கே வளர்ந்தார்'},'is him':{hi:'वही रूप',ta:'அவரே இந்த வடிவம்'},
  'killed him by accident, in the dark':{hi:'अँधेरे में दुर्घटनावश मृत्यु हुई',ta:'இருளில் தவறுதலாக உயிரிழக்கச் செய்தார்'},
  'lifted it':{hi:'उसे उठाया',ta:'அதைத் தூக்கினார்'},'lives there':{hi:'वहाँ रहते हैं',ta:'அங்கே வாழ்கிறார்'},
  'married':{hi:'विवाह',ta:'திருமணம்'},'mother':{hi:'माँ',ta:'தாய்'},'refused him':{hi:'उसे मना किया',ta:'அவரை மறுத்தார்'},
  'reminded him what he could do':{hi:'उसे अपनी शक्ति याद दिलाई',ta:'அவருடைய சக்தியை நினைவூட்டினார்'},
  'ruled it without sitting on the chair':{hi:'सिंहासन पर बैठे बिना राज्य चलाया',ta:'அரியணையில் அமராமல் ஆட்சி செய்தார்'},
  'rules it':{hi:'वहाँ शासन करते हैं',ta:'அங்கே ஆட்சி செய்கிறார்'},'schoolfriends':{hi:'गुरुकुल के मित्र',ta:'குருகுல நண்பர்கள்'},
  'she stops when she sees him':{hi:'उन्हें देखकर वह रुक जाती हैं',ta:'அவரைக் கண்டதும் அவள் நிற்கிறாள்'},
  'taught him':{hi:'उसे सिखाया',ta:'அவருக்குக் கற்றுக் கொடுத்தார்'},
  'the same, nine nights earlier':{hi:'वही देवी, नौ रात पहले',ta:'அதே தேவி, ஒன்பது இரவுகள் முன்பு'},
  'the same, with a ladle':{hi:'वही देवी, हाथ में करछी',ta:'அதே தேவி, கரண்டியுடன்'},
  'the same, with more arms':{hi:'वही देवी, अधिक भुजाओं के साथ',ta:'அதே தேவி, மேலும் கரங்களுடன்'},
  'three nights, three boons':{hi:'तीन रातें, तीन वर',ta:'மூன்று இரவுகள், மூன்று வரங்கள்'},
  'took his date':{hi:'उसकी तिथि ले ली',ta:'அவருடைய நாளை எடுத்துக் கொண்டார்'},
  'tried to lift it':{hi:'उठाने की कोशिश की',ta:'தூக்க முயன்றார்'},
  'went there to sulk, and stayed':{hi:'रूठकर वहाँ गए और वहीं रह गए',ta:'கோபமாக அங்கே சென்று அங்கேயே தங்கினார்'},
  'written down in it':{hi:'इसमें लिखी गई',ta:'இதில் பதிவு செய்யப்பட்டது'},'wrote it':{hi:'इसे लिखा',ta:'இதை எழுதினார்'}
};

const shareIcon=(
  <svg className="shareicon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 16V4" /><path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
    <path d="M5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7" />
  </svg>
);

function displayName(lex:Lexicon,term:string,locale:AppLocale){
  const entry=lex[term];
  if(locale==='hi-IN') return entry?.native?.deva || entry?.display || term;
  if(locale==='ta-IN') return entry?.native?.taml || entry?.display || term;
  return entry?.display || term;
}
function clusterLabel(label:string,locale:AppLocale){
  if(locale==='en') return label;
  return locale==='hi-IN' ? CLUSTER[label]?.hi ?? label : CLUSTER[label]?.ta ?? label;
}
function relationLabel(label:string,locale:AppLocale){
  if(locale==='en') return label;
  return locale==='hi-IN' ? REL[label]?.hi ?? label : REL[label]?.ta ?? label;
}
function roundedRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  const radius=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.roundRect(x,y,w,h,radius);
}
function fitText(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,startSize:number,family:string,minSize=28){
  let size=startSize; while(size>minSize){ctx.font=`${size}px ${family}`;if(ctx.measureText(text).width<=maxWidth)break;size-=2;}return size;
}
function fontFor(locale:AppLocale){
  return locale==='hi-IN' ? '"Noto Serif Devanagari", serif'
    : locale==='ta-IN' ? '"Noto Serif Tamil", serif'
    : 'Georgia, serif';
}

function drawShareMap(ctx:CanvasRenderingContext2D,rel:Relations,pos:Map<string,ConstellationPoint>,
  met:Set<string>,discoveries:ConstellationDiscovery[],locale:AppLocale,x:number,y:number,w:number,h:number){
  const sx=w/700,sy=h/530;
  const discoveryKeys=new Set(discoveries.map(d=>[d.a,d.b].sort().join('\u0000')));
  ctx.save();ctx.translate(x,y);
  for(const [a,b] of rel.edges){
    const A=pos.get(a),B=pos.get(b);if(!A||!B)continue;
    const both=met.has(a)&&met.has(b),isDiscovery=discoveryKeys.has([a,b].sort().join('\u0000'));
    ctx.beginPath();ctx.moveTo(A.x*sx,A.y*sy);ctx.lineTo(B.x*sx,B.y*sy);
    ctx.strokeStyle=isDiscovery?'rgba(240,180,88,.78)':both?'rgba(240,180,88,.34)':'rgba(123,105,151,.18)';
    ctx.lineWidth=isDiscovery?3:both?2:1;ctx.stroke();
  }
  for(const [term,p] of pos){const lit=met.has(term);ctx.beginPath();ctx.arc(p.x*sx,p.y*sy,lit?7:3.5,0,Math.PI*2);ctx.fillStyle=lit?'#f0b458':'rgba(123,105,151,.34)';ctx.fill();}
  ctx.fillStyle='rgba(219,204,230,.68)';ctx.font='600 18px system-ui, sans-serif';ctx.textAlign='center';
  for(const [cluster,terms] of Object.entries(rel.clusters)){
    const points=terms.map(t=>pos.get(t)).filter(Boolean) as ConstellationPoint[];if(!points.length)continue;
    const mx=points.reduce((s,p)=>s+p.x,0)/points.length*sx,my=Math.min(...points.map(p=>p.y))*sy-18;
    ctx.fillText(clusterLabel(cluster,locale),mx,my);
  }
  ctx.restore();
}

async function makeShareCard(rel:Relations,pos:Map<string,ConstellationPoint>,met:Set<string>,
  discoveries:ConstellationDiscovery[],storiesHeard:number,childName:string,locale:AppLocale):Promise<Blob>{
  const copy=COPY[locale],family=fontFor(locale),canvas=document.createElement('canvas');
  canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
  try{await document.fonts?.ready;}catch{}
  const bg=ctx.createRadialGradient(540,500,80,540,650,900);bg.addColorStop(0,'#261d36');bg.addColorStop(1,'#130f1c');
  ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#f0b458';ctx.font='700 23px system-ui, sans-serif';ctx.fillText('SANDHYA KATHA',82,92);
  const title=copy.title(childName.trim());
  const titleSize=fitText(ctx,title,916,62,family,36);ctx.font=`${titleSize}px ${family}`;ctx.fillStyle='#f7f0e4';ctx.fillText(title,82,170);
  ctx.font=`28px ${family}`;ctx.fillStyle='rgba(247,240,228,.74)';ctx.fillText(copy.cardSubtitle,82,218);
  roundedRect(ctx,70,264,940,616,34);ctx.fillStyle='rgba(10,8,16,.30)';ctx.fill();ctx.strokeStyle='rgba(240,180,88,.16)';ctx.lineWidth=2;ctx.stroke();
  drawShareMap(ctx,rel,pos,met,discoveries,locale,95,300,890,535);
  const stats=[[String(storiesHeard),copy.stats[0]],[String(met.size),copy.stats[1]],[String(discoveries.length),copy.stats[2]]];
  stats.forEach(([value,label],i)=>{const x=90+i*320;ctx.font=`48px ${family}`;ctx.fillStyle='#f0b458';ctx.fillText(value,x,940);ctx.font='700 16px system-ui, sans-serif';ctx.fillStyle='rgba(247,240,228,.60)';ctx.fillText(label,x,972);});
  const first=discoveries[0];
  if(first){
    ctx.font='700 17px system-ui, sans-serif';ctx.fillStyle='#f0b458';ctx.fillText(copy.cardConnection,82,1060);
    const headline=`${displayName({} as Lexicon,first.a,locale)} ↔ ${displayName({} as Lexicon,first.b,locale)}`;
    const hSize=fitText(ctx,headline,916,34,family,24);ctx.font=`${hSize}px ${family}`;ctx.fillStyle='#f7f0e4';ctx.fillText(headline,82,1106);
    const label=relationLabel(first.label,locale);const rs=fitText(ctx,label,916,26,family,18);ctx.font=`${rs}px ${family}`;ctx.fillStyle='rgba(247,240,228,.76)';ctx.fillText(label,82,1146);
  }else{ctx.font=`26px ${family}`;ctx.fillStyle='rgba(247,240,228,.72)';ctx.fillText(copy.cardMore,82,1092);}
  ctx.font='18px system-ui, sans-serif';ctx.fillStyle='rgba(247,240,228,.50)';ctx.fillText(copy.cardHistory,82,1244);ctx.fillText(copy.cardPrivacy,82,1276);
  ctx.font='700 20px system-ui, sans-serif';ctx.fillStyle='#f0b458';ctx.textAlign='right';ctx.fillText('sandhyakatha.com',998,1276);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not render image')),'image/png'));
}

function saveBlob(blob:Blob){
  const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='sandhya-katha-constellation.png';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
}

export default function Constellation({ lex,rel,heard,cards,childName,onTonight,locale='en' }:{
  lex:Lexicon;rel:Relations|null;heard:Record<string,string>;cards:Card[];childName?:string;onTonight:()=>void;locale?:AppLocale;
}){
  const copy=COPY[locale];
  const [sel,setSel]=useState<string|null>(null),[shareState,setShareState]=useState<ShareState>('idle');
  const pos=useMemo(()=>rel?constellationLayout(rel):new Map<string,ConstellationPoint>(),[rel]);
  const state=useMemo(()=>rel?deriveConstellation(rel,cards,heard):null,[rel,cards,heard]);
  if(!rel||!state)return <p className="sub locale-copy">{copy.loading}</p>;
  const {storiesHeard,met,discoveries}=state,name=childName?.trim()||'',recentDiscoveries=discoveries.slice(0,3);

  async function shareConstellation(){
    if(!storiesHeard||shareState==='working')return;setShareState('working');
    try{
      const blob=await makeShareCard(rel!,pos,met,discoveries,storiesHeard,name,locale);
      const file=typeof File==='function'?new File([blob],'sandhya-katha-constellation.png',{type:'image/png'}):null;
      const url=new URL('/',window.location.origin);url.searchParams.set('utm_source','constellation_share');url.searchParams.set('utm_medium','referral');url.searchParams.set('utm_campaign','constellation');
      if(locale!=='en')url.searchParams.set('lang',locale==='hi-IN'?'hi':'ta');
      const shareData={title:`${copy.title(name)} · Sandhya Katha`,text:copy.shareText,url:url.toString()};
      if(file&&typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]})){
        await navigator.share({title:shareData.title,text:`${shareData.text}\n${shareData.url}`,files:[file]});setShareState('idle');return;
      }
      saveBlob(blob);
      if(typeof navigator.share==='function'){try{await navigator.share(shareData);}catch(err){if(!(err instanceof DOMException&&err.name==='AbortError'))throw err;}}
      else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url.toString());
      setShareState('saved');
    }catch(err){if(err instanceof DOMException&&err.name==='AbortError'){setShareState('idle');return;}setShareState('idle');}
  }

  const lang=locale==='en'?'en':locale==='hi-IN'?'hi':'ta';
  return <section className="constellation-page locale-copy" lang={lang}>
    <h1 className="page">{copy.title(name)}</h1>
    <p className="sub">{copy.intro}</p>

    {storiesHeard===0&&<section className="constellation-empty">
      <p className="eyebrow">{copy.emptyEyebrow}</p><h2>{copy.emptyTitle}</h2><p>{copy.emptyBody}</p>
      <button className="begin" onClick={onTonight}>{copy.tonight}</button>
    </section>}

    <div className="sky"><svg viewBox="0 0 700 530" role="img" aria-label={`${storiesHeard} ${copy.stats[0]}, ${met.size} ${copy.stats[1]}, ${discoveries.length} ${copy.stats[2]}`}>
      {rel.edges.map(([a,b,label],i)=>{const A=pos.get(a),B=pos.get(b);if(!A||!B)return null;const lit=met.has(a)&&met.has(b),cross=A.cluster!==B.cluster;
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={lit?'#f0b458':cross?'#4a3d63':'#2e2743'} strokeWidth={lit?1.4:.9} strokeDasharray={label&&cross?'4 3':undefined}/>;})}
      {Object.entries(rel.clusters).map(([cluster,terms])=>{const points=terms.map(t=>pos.get(t)!).filter(Boolean);if(!points.length)return null;const mx=points.reduce((s,q)=>s+q.x,0)/points.length,my=Math.min(...points.map(q=>q.y));
        return <text key={cluster} x={mx} y={my-16} className="cl" textAnchor="middle">{clusterLabel(cluster,locale)}</text>;})}
      {[...pos.entries()].map(([term,p])=>{const on=met.has(term),isSel=sel===term,select=()=>setSel(term),label=displayName(lex,term,locale);
        return <g key={term} className="node" onClick={select} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}}} role="button" tabIndex={0} aria-label={`${label} — ${on?copy.lit:copy.notMet}`}>
          {isSel&&<circle cx={p.x} cy={p.y} r={11} fill="rgba(240,180,88,.18)"/>}<circle cx={p.x} cy={p.y} r={on?5:3} fill={on?'#f0b458':'#3d3352'}/>
          {(on||isSel)&&<text x={p.x} y={p.y-10} textAnchor="middle" className={on?'lit':''}>{label}</text>}
        </g>;})}
    </svg></div>

    <div className="readout">
      {sel?<><h3>{displayName(lex,sel,locale)} {locale==='en'&&<em>{lex[sel]?.say}</em>}</h3>
        <p>{locale==='en'?(lex[sel]?.gloss||copy.termHint):`${copy.kind[lex[sel]?.kind]??''} · ${copy.termHint}`}</p>
        {met.has(sel)?<p className="dim">{copy.litBy} {storiesForTerm(sel,cards,heard).map(c=>c.title).join(' · ')}</p>:<p className="dim">{copy.notMet}</p>}</>
      :storiesHeard?<><h3>{copy.tapTitle}</h3><p>{copy.tapBody}</p></>:<><h3>{copy.darkTitle}</h3><p>{copy.darkBody}</p></>}
    </div>

    <div className="statrow" aria-label={copy.title(name)}>
      <div><b>{storiesHeard}</b><span>{copy.stats[0]}</span></div><div><b>{met.size}</b><span>{copy.stats[1]}</span></div><div><b>{discoveries.length}</b><span>{copy.stats[2]}</span></div>
    </div>

    <section className="discoveries"><p className="eyebrow">{discoveries.length?copy.discoveryOn:copy.discoveryOff}</p>
      {discoveries.length?<><h2>{copy.discoveryTitle}</h2><p className="discovery-intro">{copy.discoveryIntro}</p>
        <div className="discovery-list">{recentDiscoveries.map(d=><article className="discovery" key={`${d.a}\u0000${d.b}`}>
          <span>{clusterLabel(d.clusterA,locale)} ↔ {clusterLabel(d.clusterB,locale)}</span>
          <h3>{displayName(lex,d.a,locale)} ↔ {displayName(lex,d.b,locale)}</h3><p>{relationLabel(d.label,locale)}</p>
        </article>)}</div>
        {discoveries.length>recentDiscoveries.length&&<p className="discovery-more">{copy.discoveryMore(discoveries.length-recentDiscoveries.length)}</p>}</>
      :<><h2>{copy.noCrossTitle}</h2><p className="discovery-intro">{copy.noCrossBody}</p></>}
    </section>

    {storiesHeard>0&&<section className="constellation-sharebox">
      <p className="eyebrow">{copy.keepsake}</p><h2>{copy.shareTitle}</h2><p>{copy.shareBody}</p>
      <button className="begin sharebtn constellation-share" onClick={shareConstellation} disabled={shareState==='working'}>
        {shareIcon}<span>{shareState==='working'?copy.drawing:shareState==='saved'?copy.saved:copy.share}</span>
      </button><p className="share-fine">{name?copy.nameShared(name):copy.noName}</p>
    </section>}
  </section>;
}
