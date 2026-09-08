import type { Card, CanonRow } from '../lib/types';
import { STABILITY_NOTE } from '../lib/types';
import type { Pick } from '../lib/picker';
import type { Panchanga } from '../lib/panchanga';

export type Len = 'short' | 'full' | 'more';

export default function Tonight({ pick, pan, len, setLen, onRead, heard, canon, published, age, setAge, gate, setGate }: {
  pick: Pick | null; pan: Panchanga; len: Len; setLen: (l: Len) => void;
  onRead: (id: string) => void; heard: Record<string, string>;
  canon: CanonRow[]; published: number;
  age: number; setAge: (n: number) => void; gate: boolean; setGate: (b: boolean) => void;
}) {
  const s = pick?.story;
  const mins = s ? (len === 'short' ? s.minutes.short : len === 'full' ? s.minutes.full
      : s.minutes.full + (pick!.alternates[0]?.minutes.short ?? 3)) : 0;
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <p className="datestrip"><span className="g">{date}</span>
        {!pan.approximate && <span className="p">{pan.masa} · {pan.paksha} pakṣa · {pan.tithi}</span>}
      </p>
      <h1 className="greet">Good evening. <em>Six minutes,</em> if you have them.</h1>
      <p className="sub">One story is chosen for tonight. You do not have to think of one, search for one,
        or word a request. That is the whole idea.</p>

      {!s && <p className="sub">Nothing fits tonight — every story for this age has been heard in the last three
        months, which is a good problem to have. Raise the age below, or turn on the difficult ones.</p>}

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
              <span className="chip">Ages {s.minAge}+</span>
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

      {pick && pick.alternates.length > 0 && <>
        <div className="hair"><span className="eyebrow">If not that one</span></div>
        {pick.alternates.map((a: Card, i) => (
          <button key={a.id} className="mini" onClick={() => onRead(a.id)}>
            <span className="num">{String(i + 2).padStart(2, '0')}</span>
            <span className="t">
              <h3>{a.title}</h3>
              <p>{a.work} · {a.locus} · ages {a.minAge}+</p>
              <p>{a.tease}</p>
              {heard[a.id] && <span className="heard">Heard {ago(heard[a.id])}</span>}
            </span>
          </button>
        ))}
      </>}

      <div className="hair"><span className="eyebrow">Settings</span></div>
      <label className="set"><span>Child's age</span>
        <input type="number" min={3} max={15} value={age} onChange={e => setAge(+e.target.value)} />
      </label>
      <label className="set check">
        <input type="checkbox" checked={gate} onChange={e => setGate(e.target.checked)} />
        <span>Include the difficult ones
          <small>Siṟuttoṇḍar, Kaṇṇappar, Kōṭpuli and others. Nothing is cut from the collection — these simply
            wait until you have read them yourself. Each tells you what is coming before you begin.</small></span>
      </label>
      <p className="foot">{published} of {canon.length} stories written. Everything about your child stays on this device.</p>
    </>
  );
}

function ago(d: string) {
  const n = Math.round((Date.now() - Date.parse(d)) / 86400000);
  return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 30 ? `${n} nights ago` : `${Math.round(n / 30)} months ago`;
}
