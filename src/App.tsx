import { useEffect, useMemo, useState } from 'react';
import type { Card, CanonRow, Lexicon, Relations, Story } from './lib/types';
import { panchanga } from './lib/panchanga';
import { pickTonight } from './lib/picker';
import { useLocal } from './lib/store';
import { Header, Tabs, type Tab } from './ui/Chrome';
import Tonight, { type Len } from './ui/Tonight';
import Reader from './ui/Reader';
import Shelf from './ui/Shelf';
import Constellation from './ui/Constellation';
import Why from './ui/Why';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [canon, setCanon] = useState<CanonRow[]>([]);
  const [lex, setLex] = useState<Lexicon>({});
  const [rel, setRel] = useState<Relations | null>(null);
  const [open, setOpen] = useState<Story | null>(null);
  const [tab, setTab] = useState<Tab>('tonight');
  const [len, setLen] = useState<Len>('full');

  const [age, setAge] = useLocal('age', 8);
  const [gate, setGate] = useLocal('gate', false);
  const [heard, setHeard] = useLocal<Record<string, string>>('heard', {});

  useEffect(() => {
    const j = (p: string) => fetch(p).then(r => r.json());
    j('/data/index.json').then(d => setCards(d.stories)).catch(() => {});
    j('/data/canon.json').then(setCanon).catch(() => {});
    j('/data/lexicon.json').then(setLex).catch(() => {});
    j('/data/relations.json').then(setRel).catch(() => {});
  }, []);

  const pan = useMemo(() => panchanga(new Date()), []);
  const pick = useMemo(
    () => cards.length ? pickTonight(cards, { panchanga: pan, childAge: age, heard, includeGated: gate }) : null,
    [cards, pan, age, heard, gate]);

  const publishedIds = useMemo(() => new Set(cards.map(c => c.id)), [cards]);

  async function read(id: string) {
    try {
      const s: Story = await (await fetch(`/data/s/${id}.json`)).json();
      setOpen(s); window.scrollTo({ top: 0 });
    } catch { /* not written yet */ }
  }
  const markHeard = (id: string) =>
    setHeard(h => ({ ...h, [id]: new Date().toISOString().slice(0, 10) }));

  const nextCard = open?.linked ? cards.find(c => c.id === open.linked!.next) ?? null : null;

  return (
    <div className="app">
      <Header onWhy={() => { setOpen(null); setTab('why'); }} />
      <main key={open ? open.id : tab}>
        {open ? (
          <Reader story={open} lex={lex} len={len} next={nextCard}
                  onBack={() => setOpen(null)} onHeard={markHeard} onRead={read} />
        ) : tab === 'tonight' ? (
          <Tonight pick={pick} pan={pan} len={len} setLen={setLen} onRead={read} heard={heard}
                   canon={canon} published={cards.length}
                   age={age} setAge={setAge} gate={gate} setGate={setGate} />
        ) : tab === 'shelf' ? (
          <Shelf canon={canon} publishedIds={publishedIds} gate={gate} onRead={read} />
        ) : tab === 'map' ? (
          <Constellation lex={lex} rel={rel} heard={heard} cards={cards} />
        ) : <Why />}
      </main>
      <Tabs tab={open ? 'tonight' : tab} onTab={t => { setOpen(null); setTab(t); }} />
    </div>
  );
}
