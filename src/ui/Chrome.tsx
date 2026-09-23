import { localeUi, type AppLocale } from '../lib/app-locale';

export type Tab = 'tonight' | 'shelf' | 'map' | 'why';

export function Header({ onHome, onWhy, locale = 'en' }: { onHome: () => void; onWhy: () => void; locale?: AppLocale }) {
  const subtitle = locale === 'hi-IN'
    ? 'रामायण · महाभारत · पुराण · उपनिषद'
    : locale === 'ta-IN'
      ? 'இராமாயணம் · மகாபாரதம் · புராணங்கள் · உபநிடதங்கள்'
      : 'Rāmāyaṇa · Mahābhārata · Purāṇas · Upaniṣads';
  const whyLabel = locale === 'hi-IN' ? 'यह क्यों है' : locale === 'ta-IN' ? 'இது ஏன்' : 'Why this exists';
  return (
    <header className="bar">
      {/* Everyone tries the wordmark. It should go home. */}
      <button className="brand" onClick={onHome} aria-label="Sandhya Katha — tonight's story">
        <svg className="flame" viewBox="0 0 22 26" aria-hidden="true">
          <path d="M3 22h16" stroke="#a97c3a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M5 22c0-2.6 2.7-3.4 6-3.4s6 .8 6 3.4" fill="#2b2338" stroke="#a97c3a" strokeWidth="1.2" />
          <g className="f">
            <path d="M11 5c2.6 3.1 3.8 5 3.8 7.2A3.8 3.8 0 0 1 11 16a3.8 3.8 0 0 1-3.8-3.8C7.2 10 8.4 8.1 11 5z" fill="#f0b458" />
            <path d="M11 9.4c1.2 1.6 1.7 2.5 1.7 3.4A1.7 1.7 0 0 1 11 14.5a1.7 1.7 0 0 1-1.7-1.7c0-.9.5-1.8 1.7-3.4z" fill="#fff0d0" />
          </g>
        </svg>
        <span className="wordmark">
          <b>Sandhya Katha</b>
          <i>{subtitle}</i>
        </span>
      </button>
      <span className="spacer" />
      <button className="iconbtn" onClick={onWhy} aria-label={whyLabel} title={whyLabel}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="10" r="8" /><path d="M10 9v5M10 6.2v.1" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  );
}

const TABS: [Tab, string][] = [['tonight', 'Tonight'], ['shelf', 'Shelf'], ['map', 'Map'], ['why', 'Why']];

export function LanguageBar({ locale, onLocale }: {
  locale: AppLocale;
  onLocale: (locale: AppLocale) => void;
}) {
  const ui = localeUi(locale);
  return (
    <nav className="languagebar" aria-label="Story language">
      <span>{ui.readIn}</span>
      <button aria-pressed={locale === 'en'} onClick={() => onLocale('en')}>English</button>
      <button aria-pressed={locale === 'hi-IN'} onClick={() => onLocale('hi-IN')}>हिन्दी</button>
      <button aria-pressed={locale === 'ta-IN'} onClick={() => onLocale('ta-IN')}>தமிழ்</button>
    </nav>
  );
}

export function Tabs({ tab, onTab, locale = 'en' }: {
  tab: Tab;
  onTab: (t: Tab) => void;
  locale?: AppLocale;
}) {
  const ui = localeUi(locale);
  const labels: [Tab,string][] = locale === 'en'
    ? TABS
    : [
        ['tonight', ui.tonightTab],
        ['shelf', ui.shelfTab],
        ['map', ui.mapTab],
        ['why', ui.whyTab]
      ];
  return (
    <nav className={'tabs' + (locale !== 'en' ? ' locale-tabs' : '')} aria-label="Main">
      {labels.map(([k,label]) => (
        <button key={k} aria-current={tab === k} onClick={() => onTab(k)}>
          <span className="dot" />{label}
        </button>
      ))}
    </nav>
  );
}

/** What this is, for someone who has just arrived and does not know.
 *  Retires itself once a story has been read — a returning parent at 8:40pm
 *  should not have to scroll past the pitch to reach tonight's story. */
export function Intro({ published, planned, onShelf, onMap, onWhy }: {
  published: number;
  planned: number;
  onShelf: () => void;
  onMap: () => void;
  onWhy: () => void;
}) {
  return (
    <section className="intro">
      <p className="eyebrow">What this is</p>
      <h2>The old stories, told properly, for children.</h2>
      <p>Rāmāyaṇa, Mahābhārata, Bhāgavatam, the Upaniṣads — and the Tamil saints
        most collections leave out. One story a night, chosen for your child's age,
        and written to be read aloud in about six minutes.</p>
      <ul>
        <li><b>Every story says where it comes from.</b> Work and chapter, at the top of the page. Where the tellings differ, we say so.</li>
        <li><b>It ends with a question, not a moral.</b> One thing to ask your child, and an honest answer ready for the follow-up.</li>
        <li><b>Nothing is generated while you wait.</b> Each story is written and checked before it ships, so it works offline and reads the same twice.</li>
      </ul>
      <div className="intro-nav" aria-label="Explore Sandhya Katha">
        <p className="eyebrow">Around here</p>
        <div className="intro-navgrid">
          <button type="button" onClick={onShelf}><b>Shelf</b><span>Browse the written collection by source, tradition and age.</span></button>
          <button type="button" onClick={onMap}><b>Map</b><span>Watch names and curated relationships light up as stories are heard.</span></button>
          <button type="button" onClick={onWhy}><b>Why</b><span>How the stories are sourced, checked and kept the same twice.</span></button>
        </div>
      </div>
      <p className="fine">Ages 4 to 15 · nothing to install · {published} of {planned} stories written so far</p>
    </section>
  );
}
