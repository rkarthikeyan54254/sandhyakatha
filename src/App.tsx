import { useEffect, useMemo, useState } from 'react';
import type { Card, Lexicon, Story } from './lib/types';
import { panchanga } from './lib/panchanga';
import { pickTonight } from './lib/picker';

/* Everything about the child stays on this device. No account, no child
   profile on a server, nothing to leak. See PRIVACY.md before changing that. */
const local = {
  get<T>(k: string, fallback: T): T {
    try { const v = localStorage.getItem('sk.' + k); return v ? JSON.parse(v) as T : fallback; }
    catch { return fallback; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem('sk.' + k, JSON.stringify(v)); } catch { /* private mode */ } }
};

const STABILITY_NOTE: Record<string, string> = {
  variant: 'the recensions differ here',
  regional: 'not in the Sanskrit — this one reaches us through a regional tradition',
  folk: 'oral tradition; no text to check it against'
};

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [lex, setLex] = useState<Lexicon>({});
  const [open, setOpen] = useState<Story | null>(null);
  const [len, setLen] = useState<'short' | 'full'>('full');
  const [age, setAge] = useState(() => local.get('age', 8));
  const [gate, setGate] = useState(() => local.get('gate', false));
  const [heard, setHeard] = useState<Record<string, string>>(() => local.get('heard', {}));

  useEffect(() => {
    fetch('/data/index.json').then(r => r.json()).then(d => setCards(d.stories));
    fetch('/data/lexicon.json').then(r => r.json()).then(setLex);
  }, []);
  useEffect(() => { local.set('age', age); local.set('gate', gate); local.set('heard', heard); }, [age, gate, heard]);

  const pan = useMemo(() => panchanga(new Date()), []);
  const pick = useMemo(
    () => cards.length ? pickTonight(cards, { panchanga: pan, childAge: age, heard, includeGated: gate }) : null,
    [cards, pan, age, heard, gate]);

  async function read(id: string) {
    const s: Story = await (await fetch(`/data/s/${id}.json`)).json();
    setOpen(s); window.scrollTo({ top: 0 });
  }
  function markHeard(id: string) {
    setHeard(h => ({ ...h, [id]: new Date().toISOString().slice(0, 10) }));
  }

  if (open) return <Reader story={open} lex={lex} len={len} onBack={() => setOpen(null)} onHeard={markHeard} />;

  return (
    <main className="app">
      <Header />
      <p className="datestrip">
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        {!pan.approximate && <span className="pan"> · {pan.masa} · {pan.tithi}</span>}
      </p>

      {!cards.length && <p className="muted">Loading the shelf…</p>}

      {pick && (
        <section className="hero">
          <p className="why"><b>Why tonight:</b> {pick.reason}.</p>
          <p className="src">{pick.story.work} · {pick.story.locus}</p>
          <h2>{pick.story.title}</h2>
          <p className="tease">{pick.story.tease}</p>
          {pick.story.stability !== 'stable' && <p className="trad">⌁ {STABILITY_NOTE[pick.story.stability]}</p>}
          {pick.story.careNote && <p className="care"><b>Before you begin:</b> {pick.story.careNote}</p>}
          <div className="dial" role="group" aria-label="Length">
            {(['short', 'full'] as const).map(k => pick.story.minutes[k] && (
              <button key={k} aria-pressed={len === k} onClick={() => setLen(k)}>
                {k === 'short' ? 'Short' : 'Full'}<small>{pick.story.minutes[k]} min</small>
              </button>
            ))}
          </div>
          <button className="begin" onClick={() => read(pick.story.id)}>Begin reading aloud</button>
        </section>
      )}

      {pick && pick.alternates.length > 0 && <>
        <h3 className="rule">If not that one</h3>
        {pick.alternates.map(a => (
          <button key={a.id} className="mini" onClick={() => read(a.id)}>
            <b>{a.title}</b>
            <span>{a.work} · ages {a.minAge}+</span>
            <span>{a.tease}</span>
          </button>
        ))}
      </>}

      {cards.length > 0 && !pick && (
        <p className="muted">Nothing fits tonight. Every story for this age has been heard in the last three months —
          which is a good problem. Raise the age, or turn on the difficult ones below.</p>
      )}

      <h3 className="rule">Settings</h3>
      <label className="set">Child's age
        <input type="number" min={3} max={15} value={age} onChange={e => setAge(+e.target.value)} />
      </label>
      <label className="set">
        <input type="checkbox" checked={gate} onChange={e => setGate(e.target.checked)} />
        <span>Include the difficult ones
          <small>Siṟuttoṇḍar, Kaṇṇappar, Kōṭpuli and others. Nothing is cut from the collection — these simply wait
            until you have read them yourself. Each one tells you what is coming before you begin.</small>
        </span>
      </label>
      <p className="foot">{cards.length} stories published. Everything about your child stays on this device.</p>
    </main>
  );
}

function Header() {
  return <header className="bar"><span className="lamp">🪔</span>
    <span><b>Sandhya Katha</b><i>संध्या कथा</i></span></header>;
}

function Reader({ story, lex, len, onBack, onHeard }:
  { story: Story; lex: Lexicon; len: 'short' | 'full'; onBack: () => void; onHeard: (id: string) => void }) {
  const [say, setSay] = useState<string | null>(null);
  const [ask, setAsk] = useState<number | null>(null);
  const r = story.lengths[len] ?? story.lengths.full;

  return (
    <main className="app reader">
      <button className="back" onClick={onBack}>← Tonight</button>
      <h1>{story.title}</h1>
      <div className="attrib">
        <p><b>{story.source.work}</b> — {story.source.locus}</p>
        {story.source.traditionNote && <p className="trad"><b>Tradition note.</b> {story.source.traditionNote}</p>}
        {story.audience.careNote && <p className="care"><b>Before you begin.</b> {story.audience.careNote}</p>}
      </div>

      <div className="prose">
        {r.blocks.map((b, i) => b.t === 'beat'
          ? <div className="beat" key={i}><span>pause</span></div>
          : <p key={i} className={b.t === 'slow' ? 'slow' : ''}>
              {b.t === 'slow' && <span className="slowtag">slow down here</span>}
              <Line text={b.text} lex={lex} onSay={setSay} />
            </p>)}
      </div>

      {say && <div className="pop" onClick={() => setSay(null)}>
        <b>{lex[say]?.say}</b><span>{lex[say]?.gloss}</span></div>}

      <section className="turn">
        <span className="eyebrow">Now turn to your child</span>
        <p className="q"><Line text={story.close.question} lex={lex} onSay={setSay} /></p>
        <p className="seed">And if they shrug: <b>{story.close.seed}</b></p>
        {story.close.ifTheyAsk?.map((f, i) => (
          <div className="disc" key={i}>
            <button onClick={() => setAsk(ask === i ? null : i)}>If they ask: “{f.q}”</button>
            {ask === i && <p><Line text={f.a} lex={lex} onSay={setSay} /></p>}
          </div>
        ))}
        <button className="begin" onClick={() => { onHeard(story.id); onBack(); }}>We read this tonight</button>
      </section>
    </main>
  );
}

/** Renders «Term» as a tappable pronunciation and _text_ as emphasis. */
function Line({ text, lex, onSay }: { text: string; lex: Lexicon; onSay: (t: string) => void }) {
  const parts = text.split(/(«[^»]+»|_[^_]+_)/g).filter(Boolean);
  return <>{parts.map((p, i) => {
    if (p.startsWith('«')) {
      const t = p.slice(1, -1);
      return <button key={i} className="name" onClick={() => onSay(t)}
                     title={lex[t]?.say}>{t}</button>;
    }
    if (p.startsWith('_')) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  })}</>;
}
