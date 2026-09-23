import { useState } from 'react';
import type { Card, CanonRow } from '../lib/types';
import { CORPUS_LABEL, STABILITY_NOTE } from '../lib/types';
import type { Pick } from '../lib/picker';
import { observanceLabel, type RuntimeObservance } from '../lib/observance';
import { titleCase, type Panchanga } from '../lib/panchanga';
import * as P from '../lib/profile';
import type { Account as Acct } from '../lib/sync';
import AccountPanel from './Account';
import { Intro } from './Chrome';
import { localeUi, localizedSourceWork, localizedSourceLocus, localizedPanchanga, localizedCount, type AppLocale } from '../lib/app-locale';

export type Len = 'short' | 'full' | 'more';

const SOURCE_PAGES = [
  { corpus: 'ramayana', href: '/ramayana/' },
  { corpus: 'mahabharata', href: '/mahabharata/' },
  { corpus: 'bhagavata', href: '/bhagavata/' },
  { corpus: 'upanishad', href: '/upanishads/' },
  { corpus: 'other-purana', href: '/other-puranas/' },
  { corpus: 'shiva-purana', href: '/shiva-purana/' },
  { corpus: 'vishnu-purana', href: '/vishnu-purana/' },
  { corpus: 'purana', href: '/puranas/' },
  { corpus: 'other-ramayana', href: '/other-ramayanas/' },
  { corpus: 'nayanmar', href: '/nayanmars/' },
  { corpus: 'alvar', href: '/alvars/' },
  { corpus: 'sant', href: '/sants/' },
  { corpus: 'panchatantra', href: '/panchatantra/' }
] as const;

interface Props {
  pick: Pick | null; pan: Panchanga; len: Len; setLen: (l: Len) => void; onRead: (id: string) => void;
  profile: P.Profile; child: P.Child | null; heard: Record<string, string>;
  cards: Card[]; canon: CanonRow[]; published: number;
  account: Acct | null; syncing: boolean; syncPending: boolean; onAccountChanged: () => void;
  onSignOut: () => Promise<'ok' | 'unsaved'>;
  setActive: (id: string) => void;
  addChild: (name: string, age: number) => void;
  patchChild: (id: string, patch: Partial<P.Child>) => void;
  removeChild: (id: string) => void;
  repairChildConflict: (id: string, historyOwnerIndex: number) => void;
  setGate: (g: boolean) => void;
  onShelf: () => void;
  onMap: () => void;
  onWhy: () => void;
  locale: AppLocale;
  observances: RuntimeObservance[];
}

export default function Tonight(p: Props) {
  const { pick, pan, len, setLen, onRead, profile, child, heard, cards, canon, published } = p;
  const an = (n: number) => ([8, 11, 18].includes(n) ? 'an' : 'a');
  const [armed, setArmed] = useState<string | null>(null);   // child id whose removal is one click from happening
  const identityConflicts = P.duplicateIdConflicts(profile);
  const name = child?.name?.trim() ?? '';
  const s = pick?.story;
  const st = P.stats(profile, child?.id ?? null);
  const anniv = P.anniversary(profile, child?.id ?? null);
  const annivStory = anniv ? cards.find(c => c.id === anniv.storyId) : null;
  const mins = s ? (len === 'short' ? s.minutes.short : len === 'full' ? s.minutes.full
      : s.minutes.full + (pick!.alternates[0]?.minutes.short ?? 3)) : 0;
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  /* Nothing new tonight is not the end of the evening. The stories they have
     already heard are the ones most likely to be asked for, and a re-read is a
     feature here rather than a fallback — longest ago first. */
  const readAgain = !s
    ? cards.filter(c => heard[c.id] && (child ? c.minAge <= child.age : true) && (!c.gated || profile.gate))
           .sort((a, b) => (heard[a.id] < heard[b.id] ? -1 : 1)).slice(0, 3)
    : [];

  // A gap worth naming: a whole section this child has not met anyone from.
  const metCorpora = new Set(cards.filter(c => heard[c.id]).map(c => c.corpus));
  const gap = st.stories >= 3
    ? [...new Set(cards.filter(c => !heard[c.id] && (child ? c.minAge <= child.age : true)).map(c => c.corpus))]
        .find(c => !metCorpora.has(c))
    : undefined;

  // Mirror the static corpus-page rule: no homepage link until that source has
  // at least two published, ungated stories. `cards` is the shipped corpus, so
  // this grows with publication rather than with an SEO checklist.
  const sourcePages = SOURCE_PAGES
    .map(x => ({
      ...x,
      count: cards.filter(c => c.corpus === x.corpus && !c.gated).length
    }))
    .filter(x => x.count >= 2);

  if (p.locale !== 'en') {
    return <LocaleTonight locale={p.locale} pick={pick} cards={cards} pan={pan} onRead={onRead} onShelf={p.onShelf} observances={p.observances} />;
  }

  return (
    <>
      <h1 className="greet">Good evening. {name
        ? <>Six minutes with <em>{name}</em>?</>
        : <><em>Six minutes,</em> if you have them.</>}</h1>
      <p className="datestrip"><span className="g">{date}</span>
        {!pan.approximate && <span className="p">{localizedPanchanga(pan, locale)}</span>}
      </p>
      {p.observances.length > 0 ? (
        <p className="festival">{p.observances.slice(0, 4).map(o => o.names.en).join(' · ')}{p.observances.length > 4 ? ` · +${p.observances.length - 4}` : ''}</p>
      ) : pan.festivals.length > 0 && (
        <p className="festival">{pan.festivals.map(f => titleCase(f)).join(' · ')}</p>
      )}
      {p.observances[0] && p.observances[0].stories.length === 0 && (
        <p className="sub">{p.observances[0].names.en} is on today's cross-checked calendar. We don't yet have a published Sandhya Katha story for it. <a href={p.observances[0].source.url} target="_blank" rel="noreferrer">{p.observances[0].source.authority}</a></p>
      )}

      {annivStory && (
        <button className="anniv" onClick={() => onRead(annivStory.id)}>
          <span className="eyebrow">{anniv!.years === 1 ? 'A year ago tonight' : `${anniv!.years} years ago tonight`}</span>
          <p>you read {name || 'them'} <b>{annivStory.title}</b>. Read it again?</p>
        </button>
      )}

      {st.stories > 0 && (
        <p className="sofar">{name || 'They'} {name ? 'has' : 'have'} heard {st.stories === 1 ? 'one story' : `${st.stories} stories`}
          {st.nights > 1 && ` across ${st.nights} nights`}
          {st.streak > 1 && <> · <b>{st.streak} nights running</b></>}.
        </p>
      )}

      {!s && <>
        <p className="sub">Nothing new fits tonight — everything written for this age has been read in the last
          three months, which is a good problem to have. Nudge the age up, or turn on the difficult ones below.</p>
        {readAgain.length > 0 && <>
          <div className="hair"><span className="eyebrow">Or read one again</span></div>
          <p className="sub">Every word will be exactly where it was. That is the whole reason they are written
            down instead of made up each time — and it is usually what a child is asking for anyway.</p>
          <div className="alts">
            {readAgain.map(a => (
              <button key={a.id} className="mini" onClick={() => onRead(a.id)}>
                <span className="num">↺</span>
                <span className="t">
                  <h3>{a.title}</h3>
                  <p>{a.work} · {a.locus} · ages {a.minAge}+</p>
                  <p>{a.tease}</p>
                  <span className="tags"><i className="tag val">read {ago(heard[a.id])}</i></span>
                </span>
              </button>
            ))}
          </div>
        </>}
      </>}

      {s && pick && (
        <section className="hero">
          <div className="why">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#f0b458" strokeWidth="1.6" aria-hidden="true">
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" /><circle cx="10" cy="10" r="3.2" />
            </svg>
            <p><b>Why tonight:</b> {pick.reason.replace(/[.]+$/, '')}.
              {pick.observance && <><br /><small>{localeUi('en').calendarSource}: <a href={pick.observance.source.url} target="_blank" rel="noreferrer">{pick.observance.source.authority}</a></small></>}
            </p>
          </div>
          <div className="body">
            <div className="srcline">{localizedSourceWork(s.work, locale)} · {localizedSourceLocus(s.locus, locale)}</div>
            <h2>{s.title}</h2>
            <p className="tease">{s.tease}</p>
            {s.hero && (
              <figure className="storyart tonightart">
                <div className="storyart-frame">
                  <img src={s.hero} alt={`Illustration for ${s.title}`} loading="eager" decoding="async" />
                </div>
                <figcaption>Illustration</figcaption>
              </figure>
            )}
            <div className="meta">
              <span className="chip lit">Chosen for {child ? `${an(child.age)} ${child.age}-year-old` : 'tonight'}</span>
              {s.values.slice(0, 2).map(v => <span key={v} className="chip val">{v}</span>)}
              {s.stability !== 'stable' && <span className="chip trad">{STABILITY_NOTE[s.stability]}</span>}
            </div>
            {s.careNote && <p className="care"><b>Before you begin:</b> {s.careNote}</p>}

            <div className="dial">
              <div className="lbl"><span className="eyebrow">How long tonight</span><span>{mins} min aloud</span></div>
              <div className="opts" role="group" aria-label="Story length">
                <button aria-pressed={len === 'short'} onClick={() => setLen('short')}>Short<small>{s.minutes.short} min</small></button>
                <button aria-pressed={len === 'full'} onClick={() => setLen('full')}>Full<small>{s.minutes.full} min</small></button>
                <button aria-pressed={len === 'more'} onClick={() => setLen('more')}>One more<small>+ a linked story</small></button>
              </div>
            </div>
            <button className="begin" onClick={() => onRead(s.id)}>
              Begin reading aloud
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 10h11M11 6l4 4-4 4" /></svg>
            </button>
          </div>
        </section>
      )}

      {/* Let a first-time parent meet the product before reading the pitch. */}
      {st.stories === 0 && (
        <Intro published={published} planned={canon.length || 68}
               onShelf={p.onShelf} onMap={p.onMap} onWhy={p.onWhy} />
      )}

      {gap && (
        <button className="gap" onClick={p.onShelf}>
          {name || 'They'} hasn't met anyone from the <b>{CORPUS_LABEL[gap] ?? gap}</b> yet. →
        </button>
      )}

      {pick && pick.alternates.length > 0 && <>
        <div className="hair"><span className="eyebrow">If not that one</span></div>
        <div className="alts">
          {pick.alternates.map((a, i) => (
            <button key={a.id} className="mini" onClick={() => onRead(a.id)}>
              <span className="num">{String(i + 2).padStart(2, '0')}</span>
              <span className="t">
                <h3>{a.title}</h3>
                <p>{a.work} · {a.locus} · ages {a.minAge}+</p>
                <p>{a.tease}</p>
              </span>
            </button>
          ))}
        </div>
      </>}

      {sourcePages.length > 0 && <>
        <div className="hair"><span className="eyebrow">Browse by source</span></div>
        <p className="sub sourceintro">Every story names the text and passage we checked, and says when the tellings differ.</p>
        <nav className="sourcegrid" aria-label="Browse stories by source">
          {sourcePages.map(x => (
            <a key={x.corpus} className="sourcecard" href={x.href}>
              <b>{CORPUS_LABEL[x.corpus] ?? x.corpus}</b>
              <span>{x.count} published {x.count === 1 ? 'story' : 'stories'} →</span>
            </a>
          ))}
        </nav>
      </>}

      {identityConflicts.length > 0 ? <>
        <div className="hair"><span className="eyebrow">Family profile needs repair</span></div>
        {identityConflicts.map(conflict => {
          const stories = Object.keys(profile.heard[conflict.id] ?? {}).length;
          return (
            <div className="account nudge" key={`repair-${conflict.id}`}>
              <p className="lede">An earlier sync bug gave two child entries one stored history.</p>
              <p>Nothing has been deleted. Because that history is stored under one shared internal id,
                Sandhya Katha will not guess which child it belongs to.</p>
              <p className="fine">Choose the child whose past {stories === 1 ? 'story' : `${stories} stories`} this history belongs to.
                Both child entries will receive fresh ids; the recorded history moves only to the child you choose.</p>
              {conflict.children.map((c, i) => (
                <button key={`${i}-${c.name}-${c.age}`} className="ghost"
                        onClick={() => p.repairChildConflict(conflict.id, i)}>
                  Past reading belongs to {c.name.trim() || `the ${c.age}-year-old`}
                </button>
              ))}
              <p className="fine">If those recorded stories include reading done with both children, do not choose yet.
                Leave this as it is; the app will preserve the conflict rather than invent an attribution.</p>
            </div>
          );
        })}
      </> : profile.children.length > 0 && <>
        <div className="hair"><span className="eyebrow">{profile.children.length > 1 ? 'Children' : 'Who you are reading to'}</span></div>
        {profile.children.map(c => {
          const nights = Object.keys(profile.heard[c.id] ?? {}).length;
          return (
            <div key={c.id} className={'kid' + (c.id === child?.id ? ' on' : '')}>
              <button className="pickkid" onClick={() => p.setActive(c.id)} aria-pressed={c.id === child?.id}
                      aria-label={`Read to ${c.name.trim() || 'this child'}`}>
                <span className="dot" />
              </button>
              <input className="kidname" value={c.name} placeholder="Add a name"
                     onChange={e => p.patchChild(c.id, { name: e.target.value })} />
              <input className="kidage" type="number" min={3} max={15} value={c.age}
                     aria-label="Age"
                     onChange={e => p.patchChild(c.id, { age: +e.target.value })} />
              <button className={'dropkid' + (armed === c.id ? ' armed' : '')}
                      aria-label={armed === c.id
                        ? `Confirm removing ${c.name.trim() || 'this child'}`
                        : `Remove ${c.name.trim() || 'this child'}`}
                      onClick={() => {
                        if (!nights || armed === c.id) { setArmed(null); p.removeChild(c.id); }
                        else setArmed(c.id);
                      }}>
                {armed === c.id ? `Remove, and ${nights} night${nights === 1 ? '' : 's'}?` : '×'}
              </button>
            </div>
          );
        })}
        <button className="linkbtn add" onClick={() => p.addChild('', 8)}>+ Add another child</button>

        <label className="set check">
          <input type="checkbox" checked={profile.gate} onChange={e => p.setGate(e.target.checked)} />
          <span>Include the difficult ones
            <small>Siṟuttoṇḍar, Kaṇṇappar, Kōṭpuli and others. Nothing is cut from the collection — these simply
              wait until you have read them yourself. Each tells you what is coming before you begin.</small></span>
        </label>
      </>}

      <div className="hair"><span className="eyebrow">Keeping this</span></div>
      <AccountPanel account={p.account} syncing={p.syncing} pending={p.syncPending} nudge={st.stories >= 3} onSignOut={p.onSignOut}
                    onChanged={p.onAccountChanged} />

      <p className="foot">{published} of {canon.length} stories written.</p>
    </>
  );
}

function LocaleTonight({ locale, pick, cards, pan, onRead, observances }: {
  locale: Exclude<AppLocale,'en'>;
  pick: Pick | null;
  cards: Card[];
  pan: Panchanga;
  onRead: (id: string) => void;
  onShelf: () => void;
  observances: RuntimeObservance[];
}) {
  const ui = localeUi(locale);
  const s = pick?.story;
  const date = new Date().toLocaleDateString(locale, {
    weekday:'long', day:'numeric', month:'long'
  });

  return (
    <>
      <h1 className="greet locale-copy">{ui.greeting}</h1>
      <p className="datestrip locale-copy"><span className="g">{date}</span>
        {!pan.approximate && <span className="p">
          {titleCase(pan.masa)} · {titleCase(pan.paksha)} pakṣa · {titleCase(pan.tithi.split('-')[1] ?? '')}
          {pan.tamil ? ` · ${pan.tamil} ${pan.tamilDay}` : ''}
        </span>}
      </p>
      {observances.some(o => observanceLabel(o, locale)) && (
        <p className="festival">{observances.map(o => observanceLabel(o, locale)).filter(Boolean).slice(0, 4).join(' · ')}</p>
      )}

      {!s && <p className="sub locale-copy">{ui.loading}</p>}

      {s && pick && (
        <section className="hero locale-hero" lang={ui.language}>
          <div className="why">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#f0b458" strokeWidth="1.6" aria-hidden="true">
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" /><circle cx="10" cy="10" r="3.2" />
            </svg>
            <p><b>{ui.whyTonight}</b> {localeReason(pick.reason, locale)}
              {pick.observance && <><br /><small>{ui.calendarSource}: <a href={pick.observance.source.url} target="_blank" rel="noreferrer">{pick.observance.source.authority}</a></small></>}
            </p>
          </div>
          <div className="body">
            <div className="srcline">{s.work} · {s.locus}</div>
            <h2>{s.title}</h2>
            <p className="tease">{s.tease}</p>
            {s.hero && (
              <figure className="storyart tonightart">
                <div className="storyart-frame">
                  <img src={s.hero} alt={s.title} loading="eager" decoding="async" />
                </div>
                <figcaption>{ui.reader.illustration}</figcaption>
              </figure>
            )}
            <div className="meta">
              <span className="chip lit">{ui.reviewedEdition}</span>
              <span className="chip val">{s.minutes.short} {ui.minutes}</span>
            </div>
            <button className="begin" onClick={() => onRead(s.id)}>
              {ui.begin}
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 10h11M11 6l4 4-4 4" /></svg>
            </button>
          </div>
        </section>
      )}

      <button className="locale-home-shelf locale-copy" lang={ui.language} onClick={onShelf}>
        <b>{ui.allStories}</b>
        <span>{localizedCount(cards.length, locale)} →</span>
      </button>

      {pick && pick.alternates.length > 0 && <>
        <div className="hair"><span className="eyebrow locale-copy">{ui.ifNot}</span></div>
        <div className="alts locale-copy" lang={ui.language}>
          {pick.alternates.map((a, i) => (
            <button key={a.id} className="mini" onClick={() => onRead(a.id)}>
              <span className="num">{String(i + 2).padStart(2, '0')}</span>
              <span className="t">
                <h3>{a.title}</h3>
                <p>{localizedSourceWork(a.work, locale)} · {localizedSourceLocus(a.locus, locale)}</p>
                <p>{a.tease}</p>
              </span>
            </button>
          ))}
        </div>
      </>}

      <p className="locale-integrity locale-copy" lang={ui.language}>{ui.integrity}</p>
    </>
  );
}

function localeReason(reason: string, locale: Exclude<AppLocale,'en'>): string {
  const hi = locale === 'hi-IN';
  const detail = (raw: string) => {
    const key = raw.trim().toLowerCase();
    const hiMap: Record<string,string> = {
      'monsoon': 'मानसून',
      'monsoon end': 'मानसून का अंत',
      'summer': 'गर्मी',
      'spring': 'वसंत',
      'autumn': 'शरद ऋतु',
      'winter': 'सर्दी'
    };
    const taMap: Record<string,string> = {
      'monsoon': 'மழைக்காலம்',
      'monsoon end': 'மழைக்கால முடிவு',
      'summer': 'கோடை',
      'spring': 'வசந்த காலம்',
      'autumn': 'இலையுதிர் காலம்',
      'winter': 'குளிர்காலம்'
    };
    return (hi ? hiMap : taMap)[key] ?? raw;
  };

  if (reason.startsWith('of where we are in the year — ')) {
    const value = detail(reason.slice('of where we are in the year — '.length));
    return hi ? `साल के इस समय की वजह से — ${value}` : `ஆண்டின் இந்தக் காலத்தைச் சேர்ந்ததால் — ${value}`;
  }
  if (reason.startsWith('it is ')) {
    const value = reason.slice('it is '.length);
    return hi ? `आज ${value} है` : `இன்று ${value}`;
  }
  if (reason.startsWith('tonight is ')) {
    const value = reason.slice('tonight is '.length);
    return hi ? `आज रात ${value} है` : `இன்றிரவு ${value}`;
  }
  if (reason.startsWith('it belongs to ')) {
    const value = reason.slice('it belongs to '.length);
    return hi ? `यह ${value} से जुड़ी है` : `இது ${value}-ஐச் சேர்ந்தது`;
  }
  if (reason === 'this is one that got asked for twice')
    return hi ? 'यह वह कहानी है जिसे फिर से सुनने को कहा गया था' : 'இந்தக் கதையை மீண்டும் கேட்கச் சொன்னார்கள்';
  if (reason === 'this is the reviewed story you have gone longest without hearing')
    return hi ? 'समीक्षित कहानियों में इसे सुने सबसे ज़्यादा समय हो गया है' : 'மதிப்பாய்வு செய்யப்பட்ட கதைகளில் இதைக் கேட்டு அதிக நாட்கள் ஆகிவிட்டது';

  return hi
    ? 'आज के लिए उम्र और समीक्षित संग्रह में सबसे ठीक बैठती है'
    : 'இன்றைக்கு வயதுக்கும் மதிப்பாய்வு செய்யப்பட்ட தொகுப்பிற்கும் ஏற்ற கதை';
}

/** "three weeks ago" — vague on purpose; the exact date is not the point. */
function ago(date: string | undefined): string {
  if (!date) return 'a while back';
  const days = Math.round((Date.now() - Date.parse(date)) / 86_400_000);
  if (days <= 1) return 'last night';
  if (days < 14) return `${days} nights ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
