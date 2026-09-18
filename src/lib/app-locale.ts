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
      wrongThanks: 'Thank you. That goes to the person who wrote it, and every report is read.'
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
    allStories: 'सभी 5 हिन्दी कहानियाँ',
    ifNot: 'अगर यह नहीं',
    loading: 'आज रात की कहानी चुन रहे हैं…',
    minutes: 'मिनट · पढ़कर सुनाने के लिए',
    integrity: 'यहाँ केवल वही हिन्दी कहानियाँ आती हैं जिनकी भाषा, पढ़कर सुनाने और मूल स्रोत—तीनों की समीक्षा पूरी हो चुकी है।',
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
      wrongThanks: 'धन्यवाद। यह टिप्पणी कहानी लिखने वाले व्यक्ति तक पहुँचेगी और हर रिपोर्ट पढ़ी जाती है।'
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
    allStories: '5 தமிழ் கதைகளையும் பார்க்க',
    ifNot: 'இது வேண்டாமென்றால்',
    loading: 'இன்றிரவு கதையைத் தேர்ந்தெடுக்கிறோம்…',
    minutes: 'நிமிடம் · வாசித்துச் சொல்ல',
    integrity: 'மொழி, வாசித்துச் சொல்லும் சோதனை, மூல ஆதார ஒப்பீடு ஆகியவை முடிந்த தமிழ் கதைகள் மட்டுமே இங்கே வரும்.',
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
      wrongThanks: 'நன்றி. இது கதையை எழுதியவரிடம் சேரும்; ஒவ்வொரு குறிப்பும் வாசிக்கப்படும்.'
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
