import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Card, CanonRow, Lexicon, Relations, Story } from './lib/types';
import { panchanga } from './lib/panchanga';
import { pickTonight } from './lib/picker';
import * as P from './lib/profile';
import { currentAccount, onAuthChange, syncConfigured, syncProfile, type Account as Acct } from './lib/sync';
import { Header, Tabs, type Tab } from './ui/Chrome';
import Tonight, { type Len } from './ui/Tonight';
import Reader from './ui/Reader';
import Shelf from './ui/Shelf';
import Constellation from './ui/Constellation';
import Why from './ui/Why';
import Setup from './ui/Setup';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [canon, setCanon] = useState<CanonRow[]>([]);
  const [lex, setLex] = useState<Lexicon>({});
  const [rel, setRel] = useState<Relations | null>(null);
  const [open, setOpen] = useState<Story | null>(null);
  const [tab, setTab] = useState<Tab>('tonight');
  const [len, setLen] = useState<Len>('full');

  const [profile, setProfile] = useState<P.Profile>(() => P.load());
  const [skipped, setSkipped] = useState(false);
  const [account, setAccount] = useState<Acct | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { P.save(profile); }, [profile]);
  useEffect(() => { P.requestPersistence(); }, []);

  useEffect(() => {
    const j = (p: string) => fetch(p).then(r => r.json());
    j('/data/index.json').then(d => setCards(d.stories)).catch(() => {});
    j('/data/canon.json').then(setCanon).catch(() => {});
    j('/data/lexicon.json').then(setLex).catch(() => {});
    j('/data/relations.json').then(setRel).catch(() => {});
  }, []);

  /* account → merge this device with the account copy, both directions */
  const pull = useCallback(async () => {
    if (!syncConfigured) return;
    setSyncing(true);
    try { setProfile(p => { syncProfile(p).then(setProfile).catch(() => {}); return p; }); }
    finally { setTimeout(() => setSyncing(false), 600); }
  }, []);

  useEffect(() => {
    if (!syncConfigured) return;
    currentAccount().then(a => { setAccount(a); if (a) pull(); });
    const off = onAuthChange(a => { setAccount(a); if (a) pull(); });
    return () => { off.then(f => f()); };
  }, [pull]);

  const child = P.activeChild(profile);
  const heard = P.heardOf(profile, child?.id ?? null);
  const pan = useMemo(() => panchanga(new Date()), []);
  const pick = useMemo(
    () => cards.length ? pickTonight(cards, {
      panchanga: pan, childAge: child?.age ?? 8, heard, includeGated: profile.gate
    }) : null,
    [cards, pan, child?.age, heard, profile.gate]);

  const publishedIds = useMemo(() => new Set(cards.map(c => c.id)), [cards]);

  async function read(id: string) {
    try {
      const s: Story = await (await fetch(`/data/s/${id}.json`)).json();
      setOpen(s); window.scrollTo({ top: 0 });
    } catch { /* not written yet */ }
  }

  function markHeard(storyId: string) {
    setProfile(p => {
      const c = P.activeChild(p);
      if (!c) return p;
      const next = P.markHeard(p, c.id, storyId);
      if (account) syncProfile(next).then(setProfile).catch(() => {});
      return next;
    });
  }

  const addChild = (name: string, age: number) => setProfile(p => {
    const c = P.newChild(name, age);
    return { ...p, children: [...p.children, c], activeId: c.id, updatedAt: new Date().toISOString() };
  });
  const patchChild = (id: string, patch: Partial<P.Child>) => setProfile(p => ({
    ...p, children: p.children.map(c => c.id === id ? { ...c, ...patch } : c), updatedAt: new Date().toISOString()
  }));

  if (!profile.children.length && !skipped)
    return <div className="app plain"><Setup onDone={addChild} onSkip={() => { setSkipped(true); addChild('', 8); }} /></div>;

  const nextCard = open?.linked ? cards.find(c => c.id === open.linked!.next) ?? null : null;

  return (
    <div className="app">
      <Header onWhy={() => { setOpen(null); setTab('why'); }} />
      <main key={open ? open.id : tab}>
        {open ? (
          <Reader story={open} lex={lex} len={len} next={nextCard}
                  onBack={() => setOpen(null)} onHeard={markHeard} onRead={read} />
        ) : tab === 'tonight' ? (
          <Tonight pick={pick} pan={pan} len={len} setLen={setLen} onRead={read}
                   profile={profile} child={child} heard={heard} cards={cards}
                   canon={canon} published={cards.length}
                   account={account} syncing={syncing}
                   setActive={id => setProfile(p => ({ ...p, activeId: id }))}
                   addChild={addChild} patchChild={patchChild}
                   setGate={g => setProfile(p => ({ ...p, gate: g, updatedAt: new Date().toISOString() }))}
                   onShelf={() => setTab('shelf')} />
        ) : tab === 'shelf' ? (
          <Shelf canon={canon} publishedIds={publishedIds} gate={profile.gate} onRead={read} />
        ) : tab === 'map' ? (
          <Constellation lex={lex} rel={rel} heard={heard} cards={cards} childName={child?.name ?? ''} />
        ) : <Why />}
      </main>
      <Tabs tab={open ? 'tonight' : tab} onTab={t => { setOpen(null); setTab(t); }} />
    </div>
  );
}
