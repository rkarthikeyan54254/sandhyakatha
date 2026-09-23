import type { Card } from './types';

export type AppLocale = 'en' | 'hi-IN' | 'ta-IN';

export interface LocaleCatalogStory {
  id: string;
  title: string;
  tease: string;
  minutes: number;
  storyRevision: string;
  publicPath: string;
}

export interface LocaleCatalogLocale {
  locale: AppLocale;
  language: string;
  label: string;
  path: string;
  stories: LocaleCatalogStory[];
}

export interface LocaleCatalog {
  schemaVersion: '1.0';
  locales: Partial<Record<AppLocale, LocaleCatalogLocale>>;
}

export interface ReaderUi {
  reviewedEdition: string;
  minutes: string;
  traditionNote: string;
  beforeBegin: string;
  readBefore: string;
  illustration: string;
  pause: string;
  aside: string;
  turn: string;
  seedPrefix: string;
  askPrefix: string;
  mark: string;
  markAgain: string;
  saved: string;
  complete: string;
  personalize: string;
  age: string;
  chooseTomorrow: string;
  tomorrow: string;
  share: string;
  copied: string;
  done: string;
  wrongSummary: string;
  wrongPrompt: string;
  wrongPlaceholder: string;
  wrongSend: string;
  wrongSending: string;
  wrongFailed: string;
  wrongThanks: string;
  pronunciation: string;
  nameHelp: string;
}

export interface LocaleUi {
  language: string;
  label: string;
  readIn: string;
  tonightTab: string;
  shelfTab: string;
  mapTab: string;
  whyTab: string;
  greeting: string;
  reviewedPick: string;
  whyTonight: string;
  reviewedEdition: string;
  begin: string;
  allStories: string;
  ifNot: string;
  loading: string;
  minutes: string;
  integrity: string;
  calendarSource: string;
  reader: ReaderUi;
}

const UI: Record<AppLocale, LocaleUi> = {
  en: {
    language: 'en',
    label: 'English',
    readIn: 'Read in',
    tonightTab: 'Tonight',
    shelfTab: 'Shelf',
    mapTab: 'Map',
    whyTab: 'Why',
    greeting: 'Six minutes, if you have them.',
    reviewedPick: 'Tonight’s story',
    whyTonight: 'Why tonight:',
    reviewedEdition: 'Source-checked edition',
    begin: 'Begin reading aloud',
    allStories: 'Browse the shelf',
    ifNot: 'If not that one',
    loading: 'Finding tonight’s story…',
    minutes: 'min aloud',
    integrity: 'Every story is written and source-checked before it appears here.',
    calendarSource: 'Calendar source',
    reader: {
      reviewedEdition: 'Source-checked edition',
      minutes: 'min',
      traditionNote: 'Tradition note.',
      beforeBegin: 'Before you begin.',
      readBefore: 'You have read this one before. Every word is where it was.',
      illustration: 'Illustration',
      pause: 'pause',
      aside: 'for you, not aloud',
      turn: 'Now turn to your child',
      seedPrefix: 'And if they shrug, you can leave it at this:',
      askPrefix: 'If they ask:',
      mark: 'We read this tonight',
      markAgain: 'We read this again tonight',
      saved: 'Tonight is saved.',
      complete: 'Story complete.',
      personalize: 'Want tomorrow’s story chosen for your child? Their age is enough. A name can wait.',
      age: 'Age',
      chooseTomorrow: 'Choose tomorrow',
      tomorrow: 'Tomorrow night',
      share: 'Share this story',
      copied: 'Story link copied',
      done: 'Done',
      wrongSummary: "Something isn't right here",
      wrongPrompt: 'If a name, a detail or a tradition is wrong here, tell us. Nobody needs an account and we do not ask who you are — so please leave your own details out of the box.',
      wrongPlaceholder: 'What is wrong, and how do you know?',
      wrongSend: 'Send',
      wrongSending: 'Sending…',
      wrongFailed: 'That did not send — try again',
      wrongThanks: 'Thank you. That goes to the person who wrote it, and every report is read.',
      pronunciation: 'Pronunciation',
      nameHelp: 'Name as used in this story.'
    }
  },
  'hi-IN': {
    language: 'hi',
    label: 'हिन्दी',
    readIn: 'कहानी की भाषा',
    tonightTab: 'आज रात',
    shelfTab: 'कहानियाँ',
    mapTab: 'मानचित्र',
    whyTab: 'क्यों',
    greeting: 'शुभ संध्या। छह मिनट हों तो बस।',
    reviewedPick: 'आज रात के लिए चुनी गई समीक्षित हिन्दी कहानी',
    whyTonight: 'आज रात क्यों:',
    reviewedEdition: 'समीक्षित हिन्दी संस्करण',
    begin: 'कहानी पढ़ें',
    allStories: 'सभी कहानियाँ',
    ifNot: 'अगर यह नहीं',
    loading: 'आज रात की कहानी चुन रहे हैं…',
    minutes: 'मिनट · पढ़कर सुनाने के लिए',
    integrity: 'यहाँ केवल वही हिन्दी कहानियाँ आती हैं जिनकी भाषा, पढ़कर सुनाने और मूल स्रोत—तीनों की समीक्षा पूरी हो चुकी है।',
    calendarSource: 'पंचांग स्रोत',
    reader: {
      reviewedEdition: 'समीक्षित हिन्दी संस्करण',
      minutes: 'मिनट',
      traditionNote: 'परंपरा के बारे में.',
      beforeBegin: 'शुरू करने से पहले.',
      readBefore: 'यह कहानी पहले भी पढ़ी गई है। हर शब्द वहीं है जहाँ पहले था।',
      illustration: 'चित्र',
      pause: 'ठहराव',
      aside: 'माता-पिता के लिए',
      turn: 'अब बच्चे की ओर मुड़िए',
      seedPrefix: 'और अगर वह कंधे उचका दे, तो इतना कहकर छोड़ सकते हैं:',
      askPrefix: 'अगर बच्चा पूछे:',
      mark: 'आज हमने यह कहानी पढ़ी',
      markAgain: 'आज हमने यह कहानी फिर पढ़ी',
      saved: 'आज की कहानी सहेज ली गई है।',
      complete: 'कहानी पूरी हुई।',
      personalize: 'कल की कहानी बच्चे की उम्र के अनुसार चुनें? उम्र ही काफी है; नाम बाद में भी जोड़ा जा सकता है।',
      age: 'उम्र',
      chooseTomorrow: 'कल की कहानी चुनें',
      tomorrow: 'कल रात',
      share: 'यह कहानी साझा करें',
      copied: 'कहानी का लिंक कॉपी हो गया',
      done: 'पूरा हुआ',
      wrongSummary: 'यहाँ कुछ सही नहीं लग रहा',
      wrongPrompt: 'अगर किसी नाम, विवरण या परंपरा में गलती लगे, हमें बताइए। खाता या नाम देने की जरूरत नहीं है; कृपया अपनी निजी जानकारी न लिखें।',
      wrongPlaceholder: 'क्या गलत है, और आपको कैसे पता?',
      wrongSend: 'भेजें',
      wrongSending: 'भेज रहे हैं…',
      wrongFailed: 'नहीं भेजा गया — फिर कोशिश करें',
      wrongThanks: 'धन्यवाद। यह टिप्पणी कहानी लिखने वाले व्यक्ति तक पहुँचेगी और हर रिपोर्ट पढ़ी जाती है।',
      pronunciation: 'उच्चारण',
      nameHelp: 'कहानी में यही नाम इस्तेमाल किया गया है।'
    }
  },
  'ta-IN': {
    language: 'ta',
    label: 'தமிழ்',
    readIn: 'கதையின் மொழி',
    tonightTab: 'இன்றிரவு',
    shelfTab: 'கதைகள்',
    mapTab: 'வரைபடம்',
    whyTab: 'ஏன்',
    greeting: 'மாலை வணக்கம். ஆறு நிமிடம் இருந்தால் போதும்.',
    reviewedPick: 'இன்றிரவுக்காகத் தேர்ந்தெடுக்கப்பட்ட மதிப்பாய்வு செய்யப்பட்ட தமிழ் கதை',
    whyTonight: 'இன்றிரவு ஏன்:',
    reviewedEdition: 'மதிப்பாய்வு செய்யப்பட்ட தமிழ் பதிப்பு',
    begin: 'கதையை வாசிக்க',
    allStories: 'அனைத்துக் கதைகளையும் பார்க்க',
    ifNot: 'இது வேண்டாமென்றால்',
    loading: 'இன்றிரவு கதையைத் தேர்ந்தெடுக்கிறோம்…',
    minutes: 'நிமிடம் · வாசித்துச் சொல்ல',
    integrity: 'மொழி, வாசித்துச் சொல்லும் சோதனை, மூல ஆதார ஒப்பீடு ஆகியவை முடிந்த தமிழ் கதைகள் மட்டுமே இங்கே வரும்.',
    calendarSource: 'பஞ்சாங்க ஆதாரம்',
    reader: {
      reviewedEdition: 'மதிப்பாய்வு செய்யப்பட்ட தமிழ் பதிப்பு',
      minutes: 'நிமிடம்',
      traditionNote: 'மரபுக் குறிப்பு.',
      beforeBegin: 'தொடங்குவதற்கு முன்.',
      readBefore: 'இந்தக் கதையை முன்பும் வாசித்திருக்கிறீர்கள். ஒவ்வொரு சொல்லும் இருந்த இடத்திலேயே இருக்கிறது.',
      illustration: 'படம்',
      pause: 'இடைவேளை',
      aside: 'பெற்றோருக்கு',
      turn: 'இப்போது குழந்தையிடம் கேளுங்கள்',
      seedPrefix: 'அவர்கள் பதில் சொல்லாமல் இருந்தால், இதை மட்டும் சொல்லிவிடலாம்:',
      askPrefix: 'குழந்தை கேட்டால்:',
      mark: 'இன்றிரவு இந்தக் கதையை வாசித்தோம்',
      markAgain: 'இன்றிரவு இந்தக் கதையை மீண்டும் வாசித்தோம்',
      saved: 'இன்றிரவு வாசிப்பு சேமிக்கப்பட்டது.',
      complete: 'கதை முடிந்தது.',
      personalize: 'நாளைய கதையை உங்கள் குழந்தையின் வயதுக்கு ஏற்றபடி தேர்ந்தெடுக்க வேண்டுமா? வயது மட்டும் போதும்; பெயரைப் பிறகு சேர்க்கலாம்.',
      age: 'வயது',
      chooseTomorrow: 'நாளைய கதையைத் தேர்வு செய்',
      tomorrow: 'நாளை இரவு',
      share: 'இந்தக் கதையைப் பகிரவும்',
      copied: 'கதை இணைப்பு நகலெடுக்கப்பட்டது',
      done: 'முடிந்தது',
      wrongSummary: 'இங்கே ஏதோ சரியாக இல்லை',
      wrongPrompt: 'பெயர், விவரம் அல்லது மரபு குறித்த ஏதாவது தவறாகத் தோன்றினால் எங்களுக்குச் சொல்லுங்கள். கணக்கோ பெயரோ தேவையில்லை; உங்கள் தனிப்பட்ட தகவலை எழுத வேண்டாம்.',
      wrongPlaceholder: 'எது தவறு? அது எப்படி தெரியும்?',
      wrongSend: 'அனுப்பு',
      wrongSending: 'அனுப்புகிறது…',
      wrongFailed: 'அனுப்ப முடியவில்லை — மீண்டும் முயலுங்கள்',
      wrongThanks: 'நன்றி. இது கதையை எழுதியவரிடம் சேரும்; ஒவ்வொரு குறிப்பும் வாசிக்கப்படும்.',
      pronunciation: 'உச்சரிப்பு',
      nameHelp: 'கதையில் இந்தப் பெயரே பயன்படுத்தப்பட்டுள்ளது.'
    }
  }
};

const STORAGE_KEY = 'sandhyakatha.locale';

export const APP_LOCALES: AppLocale[] = ['en', 'hi-IN', 'ta-IN'];

export function localeUi(locale: AppLocale): LocaleUi {
  return UI[locale] ?? UI.en;
}

export function appLocaleFromParam(value: string | null | undefined): AppLocale | null {
  const v = String(value ?? '').trim().toLowerCase();
  if (v === 'en' || v === 'en-us') return 'en';
  if (v === 'hi' || v === 'hi-in') return 'hi-IN';
  if (v === 'ta' || v === 'ta-in') return 'ta-IN';
  return null;
}

export function appLocaleFromLocation(): AppLocale {
  if (typeof window === 'undefined') return 'en';
  try {
    const explicit = appLocaleFromParam(new URL(window.location.href).searchParams.get('lang'));
    if (explicit) return explicit;
    const stored = appLocaleFromParam(window.localStorage?.getItem(STORAGE_KEY));
    return stored ?? 'en';
  } catch {
    return 'en';
  }
}

export const initialAppLocale = appLocaleFromLocation;

export function localeLanguage(locale: AppLocale): string {
  return locale === 'hi-IN' ? 'hi' : locale === 'ta-IN' ? 'ta' : 'en';
}

export function localeShelfPath(locale: AppLocale): string {
  return locale === 'hi-IN' ? '/hi/' : locale === 'ta-IN' ? '/ta/' : '/shelf/';
}

export function persistAppLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = localeUi(locale).language;
    const url = new URL(window.location.href);
    if (locale === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', localeLanguage(locale));
    const next = url.pathname + (url.searchParams.size ? `?${url.searchParams.toString()}` : '') + url.hash;
    window.history?.replaceState?.(window.history.state ?? {}, '', next);
  } catch {
    // Locale preference is progressive enhancement.
  }
}

export function localeStoryMeta(
  catalog: LocaleCatalog | null,
  locale: AppLocale,
  id: string
): LocaleCatalogStory | null {
  if (locale === 'en') return null;
  return catalog?.locales?.[locale]?.stories.find(story => story.id === id) ?? null;
}

export function cardsForAppLocale(
  cards: Card[],
  catalog: LocaleCatalog | null,
  locale: AppLocale
): Card[] {
  if (locale === 'en') return cards;
  const rows = catalog?.locales?.[locale]?.stories ?? [];
  const canonical = new Map(cards.map(card => [card.id, card]));
  return rows.flatMap(row => {
    const card = canonical.get(row.id);
    if (!card) return [];
    return [{
      ...card,
      title: row.title,
      tease: row.tease,
      minutes: { ...card.minutes, short: row.minutes }
    }];
  });
}


/* -------------------------------------------------------------------------- */
/* Native product metadata                                                     */
/* -------------------------------------------------------------------------- */

const CORPUS_NATIVE: Record<string, { hi:string; ta:string }> = {
  ramayana:{hi:'रामायण',ta:'இராமாயணம்'},
  'other-ramayana':{hi:'अन्य रामायण परंपराएँ',ta:'பிற இராமாயண மரபுகள்'},
  mahabharata:{hi:'महाभारत',ta:'மகாபாரதம்'},
  bhagavata:{hi:'भागवत',ta:'பாகவதம்'},
  'vishnu-purana':{hi:'विष्णु पुराण',ta:'விஷ்ணு புராணம்'},
  'shiva-purana':{hi:'शिव पुराण',ta:'சிவ புராணம்'},
  purana:{hi:'पुराण',ta:'புராணங்கள்'},
  'other-purana':{hi:'अन्य पुराण',ta:'பிற புராணங்கள்'},
  upanishad:{hi:'उपनिषद',ta:'உபநிடதங்கள்'},
  nayanmar:{hi:'नायनमार',ta:'நாயன்மார்கள்'},
  alvar:{hi:'आळ्वार',ta:'ஆழ்வார்கள்'},
  sant:{hi:'उत्तर भारत के संत',ta:'வடஇந்திய பக்தர்கள்'},
  panchatantra:{hi:'पञ्चतन्त्र',ta:'பஞ்சதந்திரம்'},
  origin:{hi:'कथाएँ हम तक कैसे पहुँचीं',ta:'கதைகள் நம்மிடம் வந்த பாதை'},
  folk:{hi:'लोक परंपरा',ta:'மக்கள் மரபு'}
};

const TRADITION_NATIVE: Record<string, { hi:string; ta:string }> = {
  sanskrit:{hi:'संस्कृत परंपरा',ta:'சமஸ்கிருத மரபு'},
  'tamil-shaiva':{hi:'तमिल शैव परंपरा',ta:'தமிழ்ச் சைவ மரபு'},
  'tamil-vaishnava':{hi:'तमिल वैष्णव परंपरा',ta:'தமிழ் வைணவ மரபு'},
  'north-bhakti':{hi:'उत्तर भारतीय भक्ति परंपरा',ta:'வடஇந்திய பக்தி மரபு'},
  jain:{hi:'जैन परंपरा',ta:'சமண மரபு'},
  buddhist:{hi:'बौद्ध परंपरा',ta:'பௌத்த மரபு'},
  folk:{hi:'लोक / मौखिक परंपरा',ta:'மக்கள் / வாய்மொழி மரபு'}
};

const WORK_NATIVE: Record<string, { hi:string; ta:string }> = {
  'Abhaṅgas of Janābāī':{hi:'जनाबाई के अभंग',ta:'ஜனாபாயின் அபங்கங்கள்'},
  'Bhaktamāl and Kabīr traditions':{hi:'भक्तमाल और कबीर परंपराएँ',ta:'பக்தமால் மற்றும் கபீர் மரபுகள்'},
  'Bhaktamāl; Mīrā traditions':{hi:'भक्तमाल; मीराँ परंपराएँ',ta:'பக்தமால்; மீரா மரபுகள்'},
  'Bhāgavata Purāṇa':{hi:'भागवत पुराण',ta:'பாகவத புராணம்'},
  'Bhāgavata Purāṇa; Mahābhārata Vana Parva':{hi:'भागवत पुराण; महाभारत वन पर्व',ta:'பாகவத புராணம்; மகாபாரத வன பர்வம்'},
  'Bṛhadāraṇyaka Upaniṣad':{hi:'बृहदारण्यक उपनिषद',ta:'பிருஹதாரண்யக உபநிடதம்'},
  'Chāndogya Upaniṣad':{hi:'छान्दोग्य उपनिषद',ta:'சாந்தோக்ய உபநிடதம்'},
  'Devī Bhāgavata; Śiva Purāṇa':{hi:'देवी भागवत; शिव पुराण',ta:'தேவீ பாகவதம்; சிவ புராணம்'},
  'Devī Māhātmya (Mārkaṇḍeya Purāṇa)':{hi:'देवी माहात्म्य (मार्कण्डेय पुराण)',ta:'தேவீ மாஹாத்மியம் (மார்க்கண்டேய புராணம்)'},
  'Divya Sūri Caritam and the Guruparamparā Prabhāvam':{hi:'दिव्य सूरी चरितम् और गुरुपरम्परा प्रभावम्',ta:'திவ்ய சூரி சரிதம் மற்றும் குருபரம்பரா பிரபாவம்'},
  'Gaṇeśa Purāṇa':{hi:'गणेश पुराण',ta:'கணேச புராணம்'},
  'Guruparamparā':{hi:'गुरुपरम्परा',ta:'குருபரம்பரை'},
  'Guruparamparā Prabhāvam (Āṟāyirappaḍi)':{hi:'गुरुपरम्परा प्रभावम् (आरायिरप्पडि)',ta:'குருபரம்பரா பிரபாவம் (ஆறாயிரப்படி)'},
  'Hanumannāṭaka (Mahānāṭaka)':{hi:'हनुमन्नाटक (महानाटक)',ta:'ஹனுமந்நாடகம் (மகாநாடகம்)'},
  'Kaṭha Upaniṣad':{hi:'कठ उपनिषद',ta:'கட உபநிடதம்'},
  'Kena Upaniṣad':{hi:'केन उपनिषद',ta:'கேன உபநிடதம்'},
  'Kāśī Khaṇḍa, Skanda Purāṇa':{hi:'काशी खण्ड, स्कन्द पुराण',ta:'காசி காண்டம், ஸ்கந்த புராணம்'},
  'Mahābhārata':{hi:'महाभारत',ta:'மகாபாரதம்'},
  "Mudhal Tiruvantāti, with the commentators' account":{hi:'मुदल तिरुवन्तादि और व्याख्याकारों की कथा',ta:'முதல் திருவந்தாதி மற்றும் உரையாசிரியர் மரபு'},
  'Muṇḍaka Upaniṣad':{hi:'मुण्डक उपनिषद',ta:'முண்டக உபநிடதம்'},
  'Narsinh Mehta traditions':{hi:'नरसिंह मेहता परंपराएँ',ta:'நரசிம்ம மேத்தா மரபுகள்'},
  'Paumacariya of Vimalasūri':{hi:'विमलसूरि का पउमचरिय',ta:'விமலசூரியின் பௌமசரியம்'},
  'Pañcatantra':{hi:'पञ्चतन्त्र',ta:'பஞ்சதந்திரம்'},
  'Pañcatantra; also Hitopadeśa':{hi:'पञ्चतन्त्र; हितोपदेश में भी',ta:'பஞ்சதந்திரம்; ஹிதோபதேசத்திலும்'},
  'Periya Purāṇam':{hi:'पेरिय पुराणम्',ta:'பெரியபுராணம்'},
  'Periya Purāṇam traditions':{hi:'पेरिय पुराणम् परंपरा',ta:'பெரியபுராண மரபு'},
  'Popular Gaṇeśa tradition':{hi:'लोकप्रिय गणेश परंपरा',ta:'பிரபல கணேச மரபு'},
  'Regional retellings':{hi:'क्षेत्रीय पुनर्कथन',ta:'வட்டார மறுகதைகள்'},
  'Rāmāyaṇa':{hi:'रामायण',ta:'இராமாயணம்'},
  'The Śrīvaiṣṇava hagiographies of Tiruppāṇāḻvār':{hi:'तिरुप्पाणाळ्वार की श्रीवैष्णव जीवन-कथाएँ',ta:'திருப்பாணாழ்வாரின் ஸ்ரீவைஷ்ணவ சரிதங்கள்'},
  'Uṣāharaṇa-kāvya; Skanda Purāṇa':{hi:'उषाहरण काव्य; स्कन्द पुराण',ta:'உஷாஹரண காவியம்; ஸ்கந்த புராணம்'},
  'Viṣṇu Purāṇa':{hi:'विष्णु पुराण',ta:'விஷ்ணு புராணம்'},
  'Viṣṇu Purāṇa; Bhāgavata Skandha 9':{hi:'विष्णु पुराण; भागवत स्कन्ध 9',ta:'விஷ்ணு புராணம்; பாகவதம் ஸ்கந்தம் 9'},
  'Vālmīki Rāmāyaṇa':{hi:'वाल्मीकि रामायण',ta:'வால்மீகி இராமாயணம்'},
  'Śiva Purāṇa':{hi:'शिव पुराण',ta:'சிவ புராணம்'},
  'Śiva Purāṇa, Rudra Saṃhitā':{hi:'शिव पुराण, रुद्र संहिता',ta:'சிவ புராணம், ருத்ர சம்ஹிதை'},
  'Śiva Purāṇa; Rāmāyaṇa Uttara Kāṇḍa':{hi:'शिव पुराण; रामायण उत्तर काण्ड',ta:'சிவ புராணம்; இராமாயணம் உத்தர காண்டம்'}
};

function native(locale: AppLocale, value: {hi:string;ta:string}|undefined, fallback:string): string {
  if (locale === 'hi-IN') return value?.hi ?? fallback;
  if (locale === 'ta-IN') return value?.ta ?? fallback;
  return fallback;
}

export function localizedCorpusLabel(corpus:string, locale:AppLocale):string {
  return native(locale, CORPUS_NATIVE[corpus], corpus);
}

export function localizedTraditionLabel(tradition:string, locale:AppLocale):string {
  return native(locale, TRADITION_NATIVE[tradition], tradition);
}

export function localizedSourceWork(work:string, locale:AppLocale):string {
  return native(locale, WORK_NATIVE[work], work);
}

const LOCUS_REPLACEMENTS: Record<'hi-IN'|'ta-IN', Array<[RegExp,string]>> = {
  'hi-IN': [
    [/Critical Edition/gi,'आलोचनात्मक संस्करण'], [/chapters?/gi,'अध्याय'], [/sections?/gi,'खंड'],
    [/verses?/gi,'श्लोक'], [/Book\s+V\b/g,'पुस्तक 5'], [/Book\s+I\b/g,'पुस्तक 1'], [/Book\s+1\b/g,'पुस्तक 1'],
    [/First Vallī/gi,'प्रथम वल्ली'], [/Canto\s+I\b/g,'सर्ग 1'], [/the castle in the air/gi,'हवा का महल'],
    [/The Mice That Ate Iron/gi,'लोहे को खाने वाले चूहे'], [/the building of the Setu/gi,'सेतु-निर्माण'],
    [/the return to Ayodhyā/gi,'अयोध्या वापसी'], [/the descent of Gaṅgā/gi,'गंगा का अवतरण'],
    [/The dance of Kālī/gi,'काली का नृत्य'], [/The Annapūrṇā episode/gi,'अन्नपूर्णा प्रसंग'],
    [/The traditional account of how the play came to exist/gi,'नाटक की उत्पत्ति की पारंपरिक कथा'],
    [/Modern oral\/children's retellings; early textual locus unverified/gi,'आधुनिक मौखिक / बाल पुनर्कथन; प्रारम्भिक पाठ-स्थान अपुष्ट'],
    [/Not in Vālmīki\. Rāmcaritmānas and later folk tradition/gi,'वाल्मीकि में नहीं; रामचरितमानस और बाद की लोक परंपरा'],
    [/also /gi,'साथ ही '], [/parallel dialogue at/gi,'समानांतर संवाद '], [/sandals/gi,'पादुकाएँ'],
    [/birth notice/gi,'जन्म-संदर्भ'], [/visit/gi,'आगमन'], [/at Maghar/gi,'मगहर में'], [/at Chittor/gi,'चित्तौड़ में'],
    [/of Junāgaḍh/gi,'जूनागढ़ के'], [/in Nāmdev's household/gi,'नामदेव के घर में'],
    [/and of /gi,'और '], [/The life of /gi,'जीवन-कथा: '],
    [/Araṇya Kāṇḍa/gi,'अरण्य काण्ड'], [/Ayodhyā Kāṇḍa/gi,'अयोध्या काण्ड'],
    [/Bāla Kāṇḍa/gi,'बाल काण्ड'], [/Kiṣkindhā Kāṇḍa/gi,'किष्किन्धा काण्ड'],
    [/Sundara Kāṇḍa/gi,'सुन्दर काण्ड'], [/Yuddha Kāṇḍa/gi,'युद्ध काण्ड'], [/Uttara Kāṇḍa/gi,'उत्तर काण्ड'],
    [/Uttarakāṇḍa/gi,'उत्तर काण्ड'], [/Araṇyakāṇḍa/gi,'अरण्य काण्ड'], [/Kiṣkindhākāṇḍa/gi,'किष्किन्धा काण्ड'],
    [/Ādi Parva/gi,'आदि पर्व'], [/Vana Parva/gi,'वन पर्व'], [/Droṇa Parva/gi,'द्रोण पर्व'],
    [/Udyoga Parva/gi,'उद्योग पर्व'], [/Mahāprasthānika Parva/gi,'महाप्रस्थानिक पर्व'],
    [/Nalopākhyāna Parva/gi,'नलोपाख्यान पर्व'], [/Pativratā-māhātmya Parva/gi,'पतिव्रता-माहात्म्य पर्व'],
    [/Rudra Saṃhitā/gi,'रुद्र संहिता'], [/Vidyeśvara Saṃhitā/gi,'विद्येश्वर संहिता'],
    [/Upāsanā Khaṇḍa/gi,'उपासना खण्ड'], [/Pārvatī Khaṇḍa/gi,'पार्वती खण्ड'],
    [/Skandha/gi,'स्कन्ध'], [/sarga/gi,'सर्ग']
  ],
  'ta-IN': [
    [/Critical Edition/gi,'விமர்சனப் பதிப்பு'], [/chapters?/gi,'அத்தியாயங்கள்'], [/sections?/gi,'பகுதிகள்'],
    [/verses?/gi,'சுலோகங்கள்'], [/Book\s+V\b/g,'நூல் 5'], [/Book\s+I\b/g,'நூல் 1'], [/Book\s+1\b/g,'நூல் 1'],
    [/First Vallī/gi,'முதல் வல்லி'], [/Canto\s+I\b/g,'சர்க்கம் 1'], [/the castle in the air/gi,'காற்றில் கட்டிய கோட்டை'],
    [/The Mice That Ate Iron/gi,'இரும்பைத் தின்ற எலிகள்'], [/the building of the Setu/gi,'சேது கட்டுதல்'],
    [/the return to Ayodhyā/gi,'அயோத்திக்குத் திரும்புதல்'], [/the descent of Gaṅgā/gi,'கங்கை இறங்கிய கதை'],
    [/The dance of Kālī/gi,'காளியின் நடனம்'], [/The Annapūrṇā episode/gi,'அன்னபூர்ணா நிகழ்வு'],
    [/The traditional account of how the play came to exist/gi,'நாடகம் தோன்றிய மரபுக் கதை'],
    [/Modern oral\/children's retellings; early textual locus unverified/gi,'நவீன வாய்மொழி / குழந்தைகள் மறுகதைகள்; பழைய நூல் ஆதாரம் உறுதிப்படுத்தப்படவில்லை'],
    [/Not in Vālmīki\. Rāmcaritmānas and later folk tradition/gi,'வால்மீகியில் இல்லை; ராமசரிதமானஸ் மற்றும் பிற்கால மக்கள் மரபு'],
    [/also /gi,'மேலும் '], [/parallel dialogue at/gi,'இணையான உரையாடல் '], [/sandals/gi,'பாதுகைகள்'],
    [/birth notice/gi,'பிறப்புக் குறிப்பு'], [/visit/gi,'வருகை'], [/at Maghar/gi,'மகஹரில்'], [/at Chittor/gi,'சித்தோரில்'],
    [/of Junāgaḍh/gi,'ஜூனாகட்டின்'], [/in Nāmdev's household/gi,'நாமதேவரின் இல்லத்தில்'],
    [/and of /gi,'மற்றும் '], [/The life of /gi,'வாழ்க்கைச் சரிதம்: '],
    [/Araṇya Kāṇḍa/gi,'ஆரண்ய காண்டம்'], [/Ayodhyā Kāṇḍa/gi,'அயோத்தி காண்டம்'],
    [/Bāla Kāṇḍa/gi,'பால காண்டம்'], [/Kiṣkindhā Kāṇḍa/gi,'கிஷ்கிந்தா காண்டம்'],
    [/Sundara Kāṇḍa/gi,'சுந்தர காண்டம்'], [/Yuddha Kāṇḍa/gi,'யுத்த காண்டம்'], [/Uttara Kāṇḍa/gi,'உத்தர காண்டம்'],
    [/Uttarakāṇḍa/gi,'உத்தர காண்டம்'], [/Araṇyakāṇḍa/gi,'ஆரண்ய காண்டம்'], [/Kiṣkindhākāṇḍa/gi,'கிஷ்கிந்தா காண்டம்'],
    [/Ādi Parva/gi,'ஆதி பர்வம்'], [/Vana Parva/gi,'வன பர்வம்'], [/Droṇa Parva/gi,'துரோண பர்வம்'],
    [/Udyoga Parva/gi,'உத்யோக பர்வம்'], [/Mahāprasthānika Parva/gi,'மகாபிரஸ்தானிக பர்வம்'],
    [/Nalopākhyāna Parva/gi,'நளோபாக்கியான பர்வம்'], [/Pativratā-māhātmya Parva/gi,'பதிவிரதா மாஹாத்மிய பர்வம்'],
    [/Rudra Saṃhitā/gi,'ருத்ர சம்ஹிதை'], [/Vidyeśvara Saṃhitā/gi,'வித்யேஸ்வர சம்ஹிதை'],
    [/Upāsanā Khaṇḍa/gi,'உபாசனா காண்டம்'], [/Pārvatī Khaṇḍa/gi,'பார்வதி காண்டம்'],
    [/Skandha/gi,'ஸ்கந்தம்'], [/sarga/gi,'சர்க்கம்']
  ]
};

export function localizedSourceLocus(locus:string, locale:AppLocale):string {
  if (locale === 'en') return locus;
  let out=locus;
  for (const [pattern,replacement] of LOCUS_REPLACEMENTS[locale]) out=out.replace(pattern,replacement);
  // A source locator sometimes consists almost entirely of a proper name or
  // English editorial description. Do not create a mixed-script UI line. The
  // exact canonical locus is still preserved in the source disclosure.
  return /[A-Za-z]/.test(out) ? '' : out;
}

function plainKey(value:string):string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

const PAN_NATIVE: Record<string,{hi:string;ta:string}> = {
  chaitra:{hi:'चैत्र',ta:'சைத்ரம்'}, vaisakha:{hi:'वैशाख',ta:'வைசாகம்'}, jyestha:{hi:'ज्येष्ठ',ta:'ஜ்யேஷ்டம்'},
  asadha:{hi:'आषाढ़',ta:'ஆஷாடம்'}, sravana:{hi:'श्रावण',ta:'ஸ்ராவணம்'}, bhadrapada:{hi:'भाद्रपद',ta:'பாத்ரபதம்'},
  asvina:{hi:'आश्विन',ta:'ஆஸ்வினம்'}, kartika:{hi:'कार्तिक',ta:'கார்த்திகம்'}, margasirsa:{hi:'मार्गशीर्ष',ta:'மார்கசீர்ஷம்'},
  pausa:{hi:'पौष',ta:'பௌஷம்'}, magha:{hi:'माघ',ta:'மாகம்'}, phalguna:{hi:'फाल्गुन',ta:'பால்குணம்'},
  shukla:{hi:'शुक्ल',ta:'சுக்ல'}, krishna:{hi:'कृष्ण',ta:'கிருஷ்ண'},
  pratipada:{hi:'प्रतिपदा',ta:'பிரதமை'}, dvitiya:{hi:'द्वितीया',ta:'துவிதியை'}, tritiya:{hi:'तृतीया',ta:'திருதியை'},
  chaturthi:{hi:'चतुर्थी',ta:'சதுர்த்தி'}, panchami:{hi:'पञ्चमी',ta:'பஞ்சமி'}, shashthi:{hi:'षष्ठी',ta:'ஷஷ்டி'},
  saptami:{hi:'सप्तमी',ta:'சப்தமி'}, ashtami:{hi:'अष्टमी',ta:'அஷ்டமி'}, navami:{hi:'नवमी',ta:'நவமி'},
  dashami:{hi:'दशमी',ta:'தசமி'}, ekadashi:{hi:'एकादशी',ta:'ஏகாதசி'}, dvadashi:{hi:'द्वादशी',ta:'துவாதசி'},
  trayodashi:{hi:'त्रयोदशी',ta:'திரயோதசி'}, chaturdashi:{hi:'चतुर्दशी',ta:'சதுர்த்தசி'}, purnima:{hi:'पूर्णिमा',ta:'பௌர்ணமி'},
  amavasya:{hi:'अमावस्या',ta:'அமாவாசை'},
  chithirai:{hi:'चित्तिरै',ta:'சித்திரை'}, vaikasi:{hi:'वैकासि',ta:'வைகாசி'}, ani:{hi:'आनि',ta:'ஆனி'},
  aadi:{hi:'आडि',ta:'ஆடி'}, avani:{hi:'आवणि',ta:'ஆவணி'}, purattasi:{hi:'पुरट्टासि',ta:'புரட்டாசி'},
  aippasi:{hi:'ऐप्पसि',ta:'ஐப்பசி'}, karthigai:{hi:'कार्त्तिगै',ta:'கார்த்திகை'}, margazhi:{hi:'मार्गऴि',ta:'மார்கழி'},
  thai:{hi:'तै',ta:'தை'}, maasi:{hi:'मासि',ta:'மாசி'}, panguni:{hi:'पङ्गुनि',ta:'பங்குனி'}
};

function nativePan(value:string, locale:Exclude<AppLocale,'en'>):string {
  return native(locale, PAN_NATIVE[plainKey(value)], value);
}

export function localizedPanchanga(
  pan:{ masa:string; paksha:string; tithi:string; tamil?:string; tamilDay?:number },
  locale:AppLocale
):string {
  if (locale === 'en') {
    const t=pan.tithi.split('-')[1] ?? pan.tithi;
    return `${pan.masa} · ${pan.paksha} pakṣa · ${t}${pan.tamil ? ` · ${pan.tamil} ${pan.tamilDay ?? ''}`.trimEnd() : ''}`;
  }
  const target=locale as Exclude<AppLocale,'en'>;
  const t=pan.tithi.split('-')[1] ?? pan.tithi;
  const pakshaWord=target==='hi-IN'?'पक्ष':'பக்ஷம்';
  const primary=`${nativePan(pan.masa,target)} · ${nativePan(pan.paksha,target)} ${pakshaWord} · ${nativePan(t,target)}`;
  return pan.tamil ? `${primary} · ${nativePan(pan.tamil,target)} ${pan.tamilDay ?? ''}`.trimEnd() : primary;
}

export function localizedCount(count:number, locale:AppLocale):string {
  if (locale==='hi-IN') return `${count} उपलब्ध कहानियाँ`;
  if (locale==='ta-IN') return `${count} கதைகள் இங்கே உள்ளன`;
  return `${count} stories available`;
}
