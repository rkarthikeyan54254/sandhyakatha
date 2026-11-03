import { useEffect, useState } from 'react';
import Reader from './Reader';
import { Header, LanguageBar } from './Chrome';
import { localeUi } from '../lib/app-locale';
import type { AppLocale } from '../lib/app-locale';
import type { Lexicon, Story } from '../lib/types';
import { directLanguage, type DirectCatalog, type DirectEdition, type DirectRoute } from '../lib/direct-story';

const COPY = {
  en: { parent: 'For the parent', age: 'Recommended age', continue: 'I have read the care note · Continue', loading: 'Loading…', missing: 'This story is unavailable.', failed: 'The story could not be loaded. Please try again.', retry: 'Try again', back: 'Back to the shelf', choice: 'Choose whether this story is right for your family. Continuing opens only this story; it does not change your family settings.' },
  'hi-IN': { parent: 'माता-पिता के लिए', age: 'पढ़ने की सुझाई गई उम्र', continue: 'ध्यान देने वाली बात पढ़ ली है · कहानी खोलें', loading: 'कहानी आ रही है…', missing: 'यह कहानी उपलब्ध नहीं है।', failed: 'कहानी नहीं खुल सकी। कृपया फिर कोशिश करें।', retry: 'फिर कोशिश करें', back: 'कहानियों की सूची पर लौटें', choice: 'पहले तय करें कि यह कहानी आपके परिवार के लिए उचित है या नहीं। आगे बढ़ने से केवल यह कहानी खुलेगी; परिवार की सेटिंग्स नहीं बदलेंगी।' },
  'ta-IN': { parent: 'பெற்றோருக்கு', age: 'பரிந்துரைக்கப்படும் வயது', continue: 'குறிப்பைப் படித்துவிட்டேன் · கதையைத் திறக்கவும்', loading: 'கதை வருகிறது…', missing: 'இந்தக் கதை கிடைக்கவில்லை.', failed: 'கதையைத் திறக்க முடியவில்லை. மீண்டும் முயலுங்கள்.', retry: 'மீண்டும் முயலவும்', back: 'கதைப் பட்டியலுக்குத் திரும்பவும்', choice: 'இந்தக் கதை உங்கள் குடும்பத்துக்கு ஏற்றதா என்பதை முதலில் முடிவு செய்யுங்கள். தொடர்ந்தால் இந்தக் கதை மட்டும் திறக்கும்; குடும்ப அமைப்புகள் மாறாது.' },
};
async function json<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) throw Error('Unavailable');
  return response.json() as Promise<T>;
}
export default function DirectStory({ route }: { route: DirectRoute | null }) {
  const locale = route?.locale ?? 'en', copy = COPY[locale], ui = localeUi(locale);
  const [editions, setEditions] = useState<Record<string, DirectEdition> | null>(null);
  const [story, setStory] = useState<Story | null>(null), [lex, setLex] = useState<Lexicon>({});
  const [len, setLen] = useState<'short' | 'full'>('full');
  const [error, setError] = useState(false), [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const edition = editions?.[directLanguage(locale)];
  const shelf = '/shelf/' + (locale === 'en' ? '' : `?lang=${directLanguage(locale)}`);
  useEffect(() => {
    if (!route) return;
    const controller = new AbortController();
    setError(false); setEditions(null); setStory(null);
    void json<DirectCatalog>('/data/direct-stories.json', controller.signal).then(catalog => {
      if (catalog.schemaVersion !== '1.0' || !catalog.stories[route.id]?.[directLanguage(locale)]) throw Error('Unavailable');
      setEditions(catalog.stories[route.id]);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [route?.id, locale, attempt]);
  useEffect(() => { document.documentElement.lang = directLanguage(locale); if (edition) document.title = `${edition.title} · Sandhya Katha`; }, [locale, edition]);
  useEffect(() => { if (story && typeof window.scrollTo === 'function') window.scrollTo({ top: 0 }); }, [story?.id]);
  async function continueReading() {
    if (!edition || !route || busy) return;
    setBusy(true); setError(false);
    try {
      const [loaded, words] = await Promise.all([json<Story & { status: string }>(edition.runtimePath), json<Lexicon>('/data/lexicon.json')]);
      if (loaded.id !== route.id || loaded.status !== 'published' || !loaded.audience.gated || loaded.title !== edition.title) throw Error('Unavailable');
      setLex(words); setStory(loaded);
    } catch { setError(true); } finally { setBusy(false); }
  }
  const home = () => window.location.assign(shelf);
  const selectLanguage = (next: AppLocale) => {
    const href = editions?.[directLanguage(next)]?.href;
    if (href && next !== locale) window.location.assign(href);
  };
  return <div className="app" data-locale={locale}>
    <Header locale={locale} onHome={home} onWhy={() => window.location.assign('/why/')} />
    <LanguageBar locale={locale} onLocale={selectLanguage} />
    <main id="main">
      {!route || (error && !edition) ? <section role="alert"><h1>{copy.missing}</h1><a href={shelf}>{copy.back}</a>{route && <button onClick={() => setAttempt(n => n + 1)}>{copy.retry}</button>}</section>
        : !edition ? <p role="status">{copy.loading}</p>
        : !story ? <article className="story direct-gate">
          <h1>{edition.title}</h1><p className="tease">{edition.tease}</p>
          <div className="attrib"><p><b>{copy.parent}</b> · {copy.age} {edition.minAge}+</p><p className="care">{edition.careNote}</p><p>{copy.choice}</p></div>
          {edition.hero && <figure className="storyart"><div className="storyart-frame"><img src={edition.hero} alt={edition.title} /></div></figure>}
          {error && <p role="alert">{copy.failed}</p>}
          <button className="begin" disabled={busy} onClick={() => void continueReading()}>{busy ? copy.loading : copy.continue}</button>
        </article>
        : <>
          <div className="dial" data-story-length-controls><div className="opts" role="group" aria-label={ui.storyLength}>
            {(['short', 'full'] as const).map(length => <button key={length} aria-pressed={len === length} onClick={() => setLen(length)}>{length === 'short' ? ui.short : ui.full}<small>{story.lengths[length].minutes} {ui.reader.minutes}</small></button>)}
          </div></div>
          <Reader key={story.id} story={story} lex={lex} len={len} next={null} locale={locale} hasProfile={false} readOnly onBack={home} onHeard={() => {}} onRead={() => {}} onPersonalize={home} backLabel={ui.shelfTab} />
        </>}
    </main>
  </div>;
}
