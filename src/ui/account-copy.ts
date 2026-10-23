import type { AppLocale } from '../lib/app-locale';
const en = {
  heading: 'Keeping this', signedIn: 'Signed in', withCode: 'with a recovery code', syncing: 'Syncing…',
  pending: 'Saved on this device — backup pending.', backedUp: 'Everything is backed up.',
  signOutDetail: 'Signing out clears this history from this browser. It stays in your account and comes back when you sign in again, keeping a shared computer safe.',
  signingOut: 'Signing out…', signOut: 'Sign out',
  unsaved: 'Could not save tonight to your account, so you are still signed in. Check your connection and try again.',
  unconfigured: 'Sign-in is not switched on for this site yet.', unavailable: 'Backup is unavailable here.',
  unavailableDetail: 'Your reading history is still safe in this browser. Everything works signed out; keep reading and try account backup again later.',
  keepSafe: 'Keep this safe.', keepHistory: 'Keep your family’s reading history across devices.',
  signInDetail: 'Signing in lets the same history follow you from laptop to tablet to phone. It is optional: signed out, everything still works on this device.',
  google: 'Continue with Google', checking: 'Checking…', alternate: 'Rather not use Google?',
  codeDetail: 'A recovery code is an account with no name attached. If you lose the code, we cannot recover the history for you. Write it down.',
  create: 'Create a recovery code', createError: 'Could not create a code. Try again in a moment.',
  codeError: 'That code did not work. Check it and try again.', codeLabel: 'Recovery code', use: 'Use',
  writeDown: 'Write this down now.', madeDetail: 'It is the only way back to this history. There is no reset, because we have no identifying information to reset it against.',
  privacy: 'If you sign in, we store only a first name, an age, and which stories were read. Nothing else, and nothing is shared onward.'
};
type Copy = typeof en;
const hi: Copy = {
  heading: 'इतिहास सँभालकर रखें', signedIn: 'साइन इन है', withCode: 'रिकवरी कोड से', syncing: 'सिंक हो रहा है…',
  pending: 'इस डिवाइस पर सुरक्षित है—खाते में बैकअप बाकी है।', backedUp: 'पूरा इतिहास खाते में सुरक्षित है।',
  signOutDetail: 'साइन आउट करने से इस ब्राउज़र का इतिहास हट जाता है। वह आपके खाते में रहता है और फिर साइन इन करने पर लौट आता है। इससे साझा कंप्यूटर पर आपकी जानकारी सुरक्षित रहती है।',
  signingOut: 'साइन आउट हो रहा है…', signOut: 'साइन आउट करें',
  unsaved: 'आज का इतिहास खाते में सुरक्षित नहीं हो सका, इसलिए आप अभी भी साइन इन हैं। इंटरनेट कनेक्शन जाँचकर फिर कोशिश करें।',
  unconfigured: 'इस साइट पर साइन इन अभी चालू नहीं है।', unavailable: 'यहाँ खाते में बैकअप उपलब्ध नहीं है।',
  unavailableDetail: 'आपका पढ़ने का इतिहास इस ब्राउज़र में सुरक्षित है। साइन इन के बिना भी पढ़ सकते हैं; खाते में बैकअप की कोशिश बाद में करें।',
  keepSafe: 'यह इतिहास सुरक्षित रखें।', keepHistory: 'परिवार का पढ़ने का इतिहास दूसरे डिवाइस पर भी पाएँ।',
  signInDetail: 'साइन इन करने से यही इतिहास लैपटॉप, टैबलेट और फोन पर मिलता है। यह आपकी इच्छा पर है; साइन इन के बिना भी इस डिवाइस पर सब काम करता है।',
  google: 'Google से आगे बढ़ें', checking: 'जाँच हो रही है…', alternate: 'Google इस्तेमाल नहीं करना चाहते?',
  codeDetail: 'रिकवरी कोड से बिना नाम के खाता बनता है। कोड खो जाए तो हम आपका इतिहास वापस नहीं ला सकते। इसे लिखकर रखें।',
  create: 'रिकवरी कोड बनाएँ', createError: 'कोड नहीं बन सका। थोड़ी देर में फिर कोशिश करें।',
  codeError: 'इस कोड से साइन इन नहीं हुआ। कोड जाँचकर फिर कोशिश करें।', codeLabel: 'रिकवरी कोड', use: 'इस्तेमाल करें',
  writeDown: 'इसे अभी लिख लें।', madeDetail: 'इस इतिहास तक वापस पहुँचने का यही रास्ता है। कोड रीसेट नहीं हो सकता, क्योंकि हमारे पास आपकी पहचान की जानकारी नहीं है।',
  privacy: 'साइन इन करने पर हम केवल पहला नाम, उम्र और पढ़ी गई कहानियों का इतिहास रखते हैं। यह जानकारी आगे किसी को नहीं दी जाती।'
};
const ta: Copy = {
  heading: 'வாசிப்பு வரலாற்றைப் பாதுகாக்க', signedIn: 'உள்நுழைந்துள்ளீர்கள்', withCode: 'மீட்புக் குறியீட்டுடன்', syncing: 'ஒத்திசைக்கப்படுகிறது…',
  pending: 'இந்தச் சாதனத்தில் சேமிக்கப்பட்டுள்ளது; கணக்கில் காப்புப் பிரதி இன்னும் சேரவில்லை.', backedUp: 'முழு வரலாறும் கணக்கில் பாதுகாக்கப்பட்டுள்ளது.',
  signOutDetail: 'வெளியேறினால் இந்த உலாவியில் உள்ள வரலாறு அழிக்கப்படும். உங்கள் கணக்கில் அது இருக்கும்; மீண்டும் உள்நுழைந்தால் திரும்பக் கிடைக்கும். பகிர்ந்து பயன்படுத்தும் கணினியில் உங்கள் விவரங்கள் பாதுகாப்பாக இருக்கும்.',
  signingOut: 'வெளியேறுகிறது…', signOut: 'வெளியேறவும்',
  unsaved: 'இன்றைய வரலாற்றைக் கணக்கில் சேமிக்க முடியவில்லை; அதனால் நீங்கள் இன்னும் உள்நுழைந்துள்ளீர்கள். இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயலுங்கள்.',
  unconfigured: 'இந்தத் தளத்தில் உள்நுழைவு இன்னும் செயல்படுத்தப்படவில்லை.', unavailable: 'இங்கே கணக்கில் காப்புப் பிரதி வசதி கிடைக்கவில்லை.',
  unavailableDetail: 'வாசிப்பு வரலாறு இந்த உலாவியில் பாதுகாப்பாக உள்ளது. உள்நுழையாமலும் தொடர்ந்து வாசிக்கலாம்; கணக்கில் காப்புப் பிரதி சேர்க்கப் பிறகு முயலுங்கள்.',
  keepSafe: 'இந்த வரலாற்றைப் பாதுகாக்கவும்.', keepHistory: 'குடும்பத்தின் வாசிப்பு வரலாற்றைப் பிற சாதனங்களிலும் பெறுங்கள்.',
  signInDetail: 'உள்நுழைந்தால் இதே வரலாறு மடிக்கணினி, டேப்லெட், கைப்பேசியிலும் கிடைக்கும். இது உங்கள் விருப்பம்; உள்நுழையாமலும் இந்தச் சாதனத்தில் எல்லாம் செயல்படும்.',
  google: 'Google மூலம் தொடரவும்', checking: 'சரிபார்க்கப்படுகிறது…', alternate: 'Google பயன்படுத்த விருப்பமில்லையா?',
  codeDetail: 'மீட்புக் குறியீடு பெயரில்லாத கணக்கை உருவாக்குகிறது. குறியீட்டை இழந்தால் உங்கள் வரலாற்றை எங்களால் மீட்டுத் தர முடியாது. அதை எழுதி வைத்துக்கொள்ளுங்கள்.',
  create: 'மீட்புக் குறியீட்டை உருவாக்கவும்', createError: 'குறியீட்டை உருவாக்க முடியவில்லை. சிறிது நேரத்தில் மீண்டும் முயலுங்கள்.',
  codeError: 'இந்தக் குறியீட்டால் உள்நுழைய முடியவில்லை. சரிபார்த்து மீண்டும் முயலுங்கள்.', codeLabel: 'மீட்புக் குறியீடு', use: 'பயன்படுத்தவும்',
  writeDown: 'இப்போதே எழுதி வைத்துக்கொள்ளுங்கள்.', madeDetail: 'இந்த வரலாற்றை மீண்டும் பெற இதுவே ஒரே வழி. உங்கள் அடையாள விவரங்கள் எங்களிடம் இல்லாததால் குறியீட்டை மீண்டும் அமைக்க முடியாது.',
  privacy: 'உள்நுழைந்தால் முதல் பெயர், வயது, வாசித்த கதைகளின் வரலாறு மட்டும் சேமிக்கப்படும். இந்த விவரங்கள் பிறருக்குப் பகிரப்படாது.'
};
export function accountCopy(locale: AppLocale): Copy { return locale === 'hi-IN' ? hi : locale === 'ta-IN' ? ta : en; }
