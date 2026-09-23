import type { AppLocale } from '../lib/app-locale';

type WhyCopy = {
  title:string;
  thesis:string;
  eyebrow:string;
  points:[string,string][];
  closing:string;
  aboutLead:string;
  aboutLabel:string;
};

const COPY: Record<AppLocale,WhyCopy> = {
  en:{
    title:'Why not just ask a chatbot?',
    thesis:'Because at 8:40pm you do not want a generator. You want the one right story, already chosen, already checked, already laid out for your voice — and a reason to come back tomorrow.',
    eyebrow:'Six things a chat window cannot do',
    points:[
      ['Every line has an address','The work and the chapter sit at the top of the page, and where traditions differ the story says so out loud. The squirrel on the bridge is not in Vālmīki, and we tell you that on the page. A chat window can hand you a beautiful story with no way to know whether it invented the ending.'],
      ['Written for a voice, not an eye','Short breath lines. A printed pause before the turn. A last line flagged to slow down. Tap a name and get how to say it before you say it aloud to your child.'],
      ['It ends with a question, not a moral','Every story closes with one thing to ask, a fallback line if they shrug, and an honest answer ready for the hard follow-up. The moral is not delivered. It is arrived at, by the two of you, out loud.'],
      ['It knows what day it is','Tonight’s pick is chosen against the pañcāṅga and the season. That is the reason to open this on an ordinary Tuesday.'],
      ['It remembers the child, not the account','Characters accumulate into a map your child builds by listening. Signed out, that history stays on this device. If a parent chooses to sign in, only the minimum needed to preserve it is backed up.'],
      ['Nothing is generated while you wait','The collection is drafted, source-checked, reviewed and versioned before it ships. It is instant, it works offline, it is the same story twice when they ask again — and it cannot invent a Purāṇa at bedtime.']
    ],
    closing:'Nothing is cut from the collection. The Periya Purāṇam is magnificent and in places brutal; the Mahābhārata is a war. The hardest stories wait behind a switch until you have read them yourself, and each one tells you what is coming before you begin. You decide when your child is ready, because you are the only person who can.',
    aboutLead:'The longer version — how a story gets here, who checks it, and what artificial intelligence is and is not allowed to touch — is on the',
    aboutLabel:'about page'
  },
  'hi-IN':{
    title:'सिर्फ़ चैटबॉट से क्यों न पूछ लें?',
    thesis:'क्योंकि रात 8:40 पर आपको कहानी बनाने वाली मशीन नहीं चाहिए। आपको आज की एक ठीक कहानी चाहिए—पहले से चुनी हुई, स्रोत से जाँची हुई, आपकी आवाज़ में सहज बैठने वाली—और कल फिर लौटने की एक वजह।',
    eyebrow:'छह बातें जो एक साधारण चैट विंडो नहीं कर सकती',
    points:[
      ['हर पंक्ति का पता है','कहानी के ऊपर ग्रंथ और अध्याय साफ़ लिखा है। जहाँ परंपराएँ अलग-अलग कहती हैं, हम वह भी छिपाते नहीं। सेतु वाली गिलहरी वाल्मीकि में नहीं है—पन्ने पर यह बात साफ़ कही जाती है। सुंदर कथा कहना आसान है; यह बताना कठिन है कि कौन-सी बात कहाँ से आई।'],
      ['आँख के लिए नहीं, आवाज़ के लिए लिखी गई','वाक्य इतने छोटे कि साँस न टूटे। मोड़ से पहले ठहराव। आख़िरी पंक्ति पर धीमे होने का संकेत। किसी नाम पर टैप करें तो उच्चारण सामने आ जाए—बच्चे के सामने अटकने से पहले।'],
      ['अंत में सवाल है, उपदेश नहीं','हर कहानी के बाद बच्चे से पूछने के लिए एक सवाल है। बच्चा कंधे उचका दे तो एक छोटी-सी पंक्ति है। फिर कठिन सवाल आए तो ईमानदार उत्तर तैयार है। सीख ऊपर से नहीं सुनाई जाती; बातचीत में धीरे-धीरे निकलती है।'],
      ['उसे पता है आज कौन-सा दिन है','आज की कहानी पंचांग, ऋतु और दिन के संदर्भ से चुनी जाती है। इसलिए किसी साधारण मंगलवार की रात भी इस संग्रह को खोलने की एक वजह होती है।'],
      ['वह बच्चे की यात्रा याद रखता है, खाते की नहीं','सुनी हुई कहानियों से पात्र और संबंध धीरे-धीरे मानचित्र में जगते हैं। साइन-आउट रहने पर यह इतिहास इसी डिवाइस पर रहता है। साइन-इन करें तो केवल उसे सँभालने जितनी ज़रूरी जानकारी ही सुरक्षित की जाती है।'],
      ['आपके इंतज़ार में कुछ गढ़ा नहीं जाता','हर कहानी पहले लिखी जाती है, स्रोत से मिलाई जाती है, भाषा और पढ़कर सुनाने की समीक्षा से गुजरती है, फिर संस्करण के रूप में प्रकाशित होती है। इसलिए वही कहानी दोबारा भी वही रहती है—और सोने से पहले कोई नया पुराण नहीं गढ़ती।']
    ],
    closing:'संग्रह से कठिन बातों को काटा नहीं जाता। पेरिय पुराणम् में अद्भुत भक्ति भी है और कुछ कठोर प्रसंग भी; महाभारत युद्ध की कथा है। कठिन कहानियाँ तब तक अलग रहती हैं जब तक माता-पिता उन्हें पहले स्वयं न पढ़ लें। हर कहानी शुरू होने से पहले बता देती है कि आगे क्या कठिन हो सकता है। आपका बच्चा कब तैयार है, यह निर्णय आपका है।',
    aboutLead:'कहानी यहाँ तक कैसे पहुँचती है, कौन जाँचता है, और कृत्रिम बुद्धिमत्ता को कहाँ तक अनुमति है—इसका विस्तृत विवरण',
    aboutLabel:'हमारे बारे में पृष्ठ पर है'
  },
  'ta-IN':{
    title:'சாட்பாட்டிடமே கேட்டுவிடலாமே?',
    thesis:'ஏனென்றால் இரவு 8:40க்கு உங்களுக்கு புதிதாக ஏதாவது உருவாக்கும் இயந்திரம் வேண்டியதில்லை. இன்றைக்கு சரியான ஒரு கதை வேண்டும்—முன்பே தேர்ந்தெடுக்கப்பட்டு, ஆதாரத்துடன் சரிபார்க்கப்பட்டு, உங்கள் குரலில் இயல்பாக வாசிக்கத் தயாராக இருக்கும் கதை. நாளை மீண்டும் வர ஒரு காரணமும் வேண்டும்.',
    eyebrow:'ஒரு சாதாரண சாட் சாளரம் செய்ய முடியாத ஆறு விஷயங்கள்',
    points:[
      ['ஒவ்வொரு வரிக்கும் முகவரி இருக்கிறது','எந்த நூல், எந்த அத்தியாயம் என்பது கதையின் மேலேயே தெரியும். மரபுகள் வேறுபட்டால் அதையும் வெளிப்படையாகச் சொல்கிறோம். சேதுவில் உதவிய அணில் வால்மீகி இராமாயணத்தில் இல்லை—அதைப் பக்கத்திலேயே சொல்கிறோம். அழகான கதை சொல்லுவது மட்டும் போதாது; எந்தத் தகவல் எங்கிருந்து வந்தது என்பதும் தெரிய வேண்டும்.'],
      ['கண்ணால் மட்டும் படிக்க அல்ல; குரலில் சொல்ல எழுதப்பட்டது','ஒரே மூச்சில் வாசிக்கக் கூடிய வரிகள். திருப்பம் வருவதற்கு முன் தெளிவான இடைவேளை. கடைசி வரியை மெதுவாகச் சொல்லும் குறிப்பு. பெயரைத் தொட்டால் உச்சரிப்பும் கிடைக்கும்—குழந்தையின் முன் தடுமாறுவதற்கு முன்.'],
      ['முடிவில் கேள்வி; நீதிப்பாடம் இல்லை','ஒவ்வொரு கதையும் குழந்தையிடம் கேட்க ஒரு கேள்வியுடன் முடியும். பதில் வரவில்லை என்றால் மெதுவாக விட்டுவிட ஒரு சிறிய வரியும் இருக்கும். அடுத்த கடினமான கேள்விக்கு நேர்மையான பதிலும் தயாராக இருக்கும். கருத்தை மேலிருந்து சொல்லிக் கொடுக்காமல், இருவரும் பேசிக்கொண்டே அடைய வேண்டும்.'],
      ['இன்று என்ன நாள் என்று அதற்கு தெரியும்','இன்றிரவு கதை பஞ்சாங்கம், பருவம், நாளின் சூழல் ஆகியவற்றோடு பொருத்திப் பார்க்கப்படுகிறது. சாதாரண செவ்வாய்க்கிழமை இரவிலும் இதைத் திறக்க ஒரு காரணம் அதனால் கிடைக்கிறது.'],
      ['குழந்தையின் பயணத்தை நினைவில் வைக்கும்; கணக்கை அல்ல','கேட்ட கதைகளிலிருந்து பாத்திரங்களும் உறவுகளும் வரைபடத்தில் மெதுவாக ஒளிரத் தொடங்கும். உள்நுழையாமல் இருந்தால் அந்த வாசிப்பு வரலாறு இந்தச் சாதனத்திலேயே இருக்கும். உள்நுழையத் தேர்ந்தெடுத்தால் அதை பாதுகாக்கத் தேவையான குறைந்த தகவல் மட்டுமே சேமிக்கப்படும்.'],
      ['நீங்கள் காத்திருக்கும்போது எதுவும் புதிதாகக் கற்பனை செய்யப்படாது','கதை முதலில் எழுதப்படுகிறது; ஆதாரம் சரிபார்க்கப்படுகிறது; மொழி மற்றும் வாசித்துச் சொல்லும் சோதனை முடிகிறது; பிறகே பதிப்பாக வெளியிடப்படுகிறது. அதனால் மீண்டும் கேட்டாலும் அதே கதை அதேபடி கிடைக்கும்—படுக்கப் போகும் நேரத்தில் புதிதாக ஒரு புராணம் உருவாகாது.']
    ],
    closing:'கடினமான பகுதிகள் தொகுப்பிலிருந்து வெட்டப்படுவதில்லை. பெரியபுராணம் அற்புதமான பக்திக் கதைகளைத் தருகிறது; சில இடங்களில் மிகவும் கடினமாகவும் இருக்கும். மகாபாரதம் ஒரு போரின் கதையும் கூட. அத்தகைய கதைகள் பெற்றோர் முதலில் வாசிக்கும் வரை தனியாக வைக்கப்படுகின்றன; தொடங்குவதற்கு முன்பே எந்தக் கடினமான பகுதி வரும் என்பதும் சொல்லப்படுகிறது. உங்கள் குழந்தை எப்போது தயாராக இருக்கிறது என்பதை முடிவு செய்யக்கூடியவர் நீங்கள் தான்.',
    aboutLead:'ஒரு கதை இங்கே வருவது எப்படி, யார் சரிபார்க்கிறார்கள், செயற்கை நுண்ணறிவுக்கு எது அனுமதி எது அனுமதி இல்லை—விரிவாக',
    aboutLabel:'எங்களைப் பற்றி பக்கத்தில் உள்ளது'
  }
};

export default function Why({ locale = 'en' }: { locale?: AppLocale }) {
  const copy=COPY[locale];
  return (
    <section className="why-page locale-copy" lang={locale === 'en' ? 'en' : locale === 'hi-IN' ? 'hi' : 'ta'}>
      <h1 className="page">{copy.title}</h1>
      <p className="thesis">{copy.thesis}</p>
      <div className="hair"><span className="eyebrow">{copy.eyebrow}</span></div>
      {copy.points.map(([h,p],i)=>(
        <div className="pt" key={h}><span className="k">{i+1}</span><div><h3>{h}</h3><p>{p}</p></div></div>
      ))}
      <div className="closing">
        <p><b>{copy.closing.split('।')[0]}{locale === 'hi-IN' ? '।' : locale === 'ta-IN' ? '.' : ''}</b>
          {locale === 'en' ? ' ' + copy.closing.split('. ').slice(1).join('. ') :
           locale === 'hi-IN' ? ' ' + copy.closing.split('।').slice(1).join('।') :
           ' ' + copy.closing.split('.').slice(1).join('.')}</p>
        <p className="fine">{copy.aboutLead}{' '}<a href="/about/">{copy.aboutLabel}</a>.</p>
      </div>
    </section>
  );
}
