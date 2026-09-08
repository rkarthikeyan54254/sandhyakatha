import type { Card, CanonRow } from '../lib/types';
import { CORPUS_LABEL, STABILITY_NOTE } from '../lib/types';
import type { Pick } from '../lib/picker';
import type { Panchanga } from '../lib/panchanga';
import * as P from '../lib/profile';
import type { Account as Acct } from '../lib/sync';
import AccountPanel from './Account';

export type Len = 'short' | 'full' | 'more';

interface Props {
  pick: Pick | null; pan: Panchanga; len: Len; setLen: (l: Len) => void; onRead: (id: string) => void;
  profile: P.Profile; child: P.Child | null; heard: Record<string, string>;
  cards: Card[]; canon: CanonRow[]; published: number;
  account: Acct | null; syncing: boolean;
  setActive: (id: string) => void;
  addChild: (name: string, age: number) => void;
  patchChild: (id: string, patch: Partial<P.Child>) => void;
  setGate: (g: boolean) => void;
  onShelf: () => void;
}

export default function Tonight(p: Props) {
  const { pick, pan, len, setLen, onRead, profile, child, heard, cards, canon, published } = p;
  const name = child?.name?.trim() ?? '';
  const s = pick?.story;
  const st = P.stats(profile, child?.id ?? null);
  const anniv = P.anniversary(profile, child?.id ?? null);
  const annivStory = anniv ? cards.find(c => c.id === anniv.storyId) : null;
  const mins = s ? (len === 'short' ? s.minutes.short : len === 'full' ? s.minutes.full
      : s.minutes.full + (pick!.alternates[0]?.minutes.short ?? 3)) : 0;
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // A gap worth naming: a whole section this child has not met anyone from.
  const metCorpora = new Set(cards.filter(c => heard[c.id]).map(c => c.corpus));
  const gap = st.stories >= 3
    ? [...new Set(cards.filter(c => !heard[c.id] && (child ? c.minAge <= child.age : true)).map(c => c.corpus))]
        .find(c => !metCorpora.has(c))
    : undefined;

  return (
    <>
      <p className="datestrip"><span className="g">{date}</span>
        {!pan.approximate && <span className="p">{pan.masa} · {pan.paksha} pakṣa · {pan.tithi}</span>}
      </p>
      <h1 className="greet">Good evening. {name
        ? <>Six minutes with <em>{name}</em>?</>
        : <><em>Six minutes,</em> if you have them.</>}</h1>

      {annivStory && (
        <button className="anniv" onClick={() => onRead(annivStory.id)}>
          <span className="eyebrow">{anniv!.years === 1 ? 'A year ago tonight' : `${anniv!.years} years ago tonight`}</span>
          <p>you read {name || 'them'} <b>{annivStory.title}</b>. Read it again?</p>
        </button>
      )}

      {st.stories === 0 && <p className="sub">One story is chosen each night. You do not have to think of one,
        search for one, or word a request. That is the whole idea.</p>}

      {st.stories > 0 && (
        <p className="sofar">{name || 'They'} {st.stories === 1 ? 'has heard one story' : `has heard ${st.stories} stories`}
          {st.nights > 1 && ` across ${st.nights} nights`}
          {st.streak > 1 && <> · <b>{st.streak} nights running</b></>}.
        </p>
      )}

      {!s && <p className="sub">Nothing new fits tonight — everything for this age has been heard in the last three
        months, which is a good problem to have. Nudge the age up, or turn on the difficult ones below.</p>}

      {s && pick && (
        <section className="hero">
          <div className="why">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#f0b458" strokeWidth="1.6" aria-hidden="true">
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" /><circle cx="10" cy="10" r="3.2" />
            </svg>
            <p><b>Why tonight:</b> {pick.reason}.</p>
          </div>
          <div className="body">
            <div className="srcline">{s.work} · {s.locus}</div>
            <h2>{s.title}</h2>
            <p className="tease">{s.tease}</p>
            <div className="meta">
              <span className="chip lit">Chosen for {child ? `a ${child.age}-year-old` : 'tonight'}</span>
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

      <div className="hair"><span className="eyebrow">{profile.children.length > 1 ? 'Children' : 'Who you are reading to'}</span></div>
      {profile.children.map(c => (
        <div key={c.id} className={'kid' + (c.id === child?.id ? ' on' : '')}>
          <button className="pickkid" onClick={() => p.setActive(c.id)} aria-pressed={c.id === child?.id}>
            <span className="dot" />
          </button>
          <input className="kidname" value={c.name} placeholder="Add a name"
                 onChange={e => p.patchChild(c.id, { name: e.target.value })} />
          <input className="kidage" type="number" min={3} max={15} value={c.age}
                 onChange={e => p.patchChild(c.id, { age: +e.target.value })} />
        </div>
      ))}
      <button className="linkbtn add" onClick={() => p.addChild('', 8)}>+ Add another child</button>

      <label className="set check">
        <input type="checkbox" checked={profile.gate} onChange={e => p.setGate(e.target.checked)} />
        <span>Include the difficult ones
          <small>Siṟuttoṇḍar, Kaṇṇappar, Kōṭpuli and others. Nothing is cut from the collection — these simply
            wait until you have read them yourself. Each tells you what is coming before you begin.</small></span>
      </label>

      <div className="hair"><span className="eyebrow">Keeping this</span></div>
      <AccountPanel account={p.account} syncing={p.syncing} nudge={st.stories >= 3} />

      <p className="foot">{published} of {canon.length} stories written.</p>
    </>
  );
}
