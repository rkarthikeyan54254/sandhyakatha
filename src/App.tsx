import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Card, CanonRow, Lexicon, Relations, Story } from './lib/types';
import { panchanga, type PanchangaTable } from './lib/panchanga';
import { pickTonight } from './lib/picker';
import * as P from './lib/profile';
import { track } from './lib/track';
import { currentAccount, syncProfile, signOut, type Account as Acct } from './lib/sync';
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
  const [cal, setCal] = useState<PanchangaTable | null>(null);
  const [open, setOpen] = useState<Story | null>(null);
  const [tab, setTab] = useState<Tab>('tonight');
  const [from, setFrom] = useState<Tab>('tonight');   // where the reader was opened from
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
    j('/data/panchanga.json').then(setCal).catch(() => {});
  }, []);

  /* Signed in? Then merge this device with the account copy, both directions. */
  const refresh = useCallback(async () => {
    const found = await currentAccount();
    setAccount(found?.account ?? null);
    if (!found) return;
    setSyncing(true);
    try { setProfile(p => { void syncProfile(p).then(setProfile).catch(() => {}); return p; }); }
    finally { setTimeout(() => setSyncing(false), 700); }
  }, []);

  useEffect(() => {
    void refresh();
    // Coming back from Google leaves ?signin= on the URL; clean it up.
    const u = new URL(window.location.href);
    if (u.searchParams.has('signin')) {
      u.searchParams.delete('signin');
      window.history.replaceState({}, '', u.pathname + u.search + u.hash);
    }
  }, [refresh]);

  const child = P.activeChild(profile);
  const heard = P.heardOf(profile, child?.id ?? null);
  const favourites = P.againOf(profile, child?.id ?? null);
  const pan = useMemo(() => panchanga(new Date(), cal), [cal]);
  const pick = useMemo(
    () => cards.length ? pickTonight(cards, {
      panchanga: pan, childAge: child?.age ?? 8, heard, favourites, includeGated: profile.gate
    }) : null,
    [cards, pan, child?.age, heard, favourites, profile.gate]);

  /**
   * Tomorrow night, named tonight.
   *
   * The pick is a pure function of (date, corpus, what has been heard), so the
   * app can say what tomorrow holds without a server and without waiting for
   * tomorrow. Ending a story on a named, dated appointment is the difference
   * between a shelf someone finishes and a routine someone keeps — and it is
   * the honest answer to "why would I come back", because the reason is on the
   * calendar rather than in a notification.
   *
   * Tonight's story counts as heard for this calculation even if the parent
   * has not pressed the button yet; otherwise tomorrow offers the same story.
   */
  const tomorrow = useMemo(() => {
    if (!cards.length || !pick) return null;
    const d = new Date(); d.setDate(d.getDate() + 1);
    return pickTonight(cards, {
      panchanga: panchanga(d, cal), childAge: child?.age ?? 8,
      heard: { ...heard, [pick.story.id]: P.today() }, favourites, includeGated: profile.gate
    });
  }, [cards, cal, pick, child?.age, heard, favourites, profile.gate]);

  const publishedIds = useMemo(() => new Set(cards.map(c => c.id)), [cards]);

  async function read(id: string) {
    setFrom(tab);
    try {
      const s: Story = await (await fetch(`/data/s/${id}.json`)).json();
      track('story_opened', { story_id: s.id, corpus: s.source.corpus, from: tab });
      setOpen(s); window.scrollTo({ top: 0 });
    } catch { /* not written yet */ }
  }

  function markHeard(storyId: string) {
    setProfile(p => {
      const c = P.activeChild(p);
      if (!c) return p;
      track('story_finished', { story_id: storyId });
      const next = P.markHeard(p, c.id, storyId);
      // Always attempt the push. `account` is set asynchronously after load, so
      // gating on it meant a story marked in the first second of a session was
      // saved on the device and never uploaded — and sign-out then cleared the
      // device. syncProfile already does nothing when signed out.
      syncProfile(next).then(setProfile).catch(() => {});
      return next;
    });
  }

  /**
   * Signing out forgets this device's copy — see sync.signOut. Only after the
   * server has confirmed, and only if the last night was saved first; a failed
   * save leaves the family signed in with their history intact.
   */
  async function handleSignOut(): Promise<'ok' | 'unsaved'> {
    const r = await signOut(profile);
    // skipped stays TRUE: dropping a signed-out parent onto the setup screen
    // forces them to type a child's name before they can reach sign-in again,
    // which mints a second child id and hides the history behind it.
    if (r === 'ok') { setProfile(P.emptyProfile()); setSkipped(true); setAccount(null); }
    void refresh();
    return r;
  }

  // A second blank row helps nobody. If one is already sitting there waiting
  // for a name, make that one active instead of stacking another underneath —
  // this is how a settings screen ends up nine rows of "Add a name" deep.
  const addChild = (name: string, age: number) => setProfile(p => {
    if (!name.trim()) {
      const blank = p.children.find(c => !c.name.trim());
      if (blank) return { ...p, activeId: blank.id, updatedAt: new Date().toISOString() };
    }
    const c = P.newChild(name, age);
    return { ...p, children: [...p.children, c], activeId: c.id, updatedAt: new Date().toISOString() };
  });

  /** Remove a child, and the nights recorded against them. There was no way to
   *  do this at all, which is the reason the list could only ever grow. */
  const removeChild = (id: string) => setProfile(p => {
    const children = p.children.filter(c => c.id !== id);
    const heard = { ...p.heard }; delete heard[id];
    const again = { ...(p.again ?? {}) }; delete again[id];
    return {
      ...p, children, heard, again,
      activeId: p.activeId === id ? (children[0]?.id ?? null) : p.activeId,
      updatedAt: new Date().toISOString()
    };
  });
  const patchChild = (id: string, patch: Partial<P.Child>) => setProfile(p => ({
    ...p, children: p.children.map(c => c.id === id ? { ...c, ...patch } : c), updatedAt: new Date().toISOString()
  }));

  if (!profile.children.length && !skipped)
    return <div className="app plain"><Setup onDone={addChild} onSkip={() => { setSkipped(true); addChild('', 8); }} /></div>;

  const nextCard = open?.linked ? cards.find(c => c.id === open.linked!.next) ?? null : null;

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to tonight's story</a>
      <Header onHome={() => { setOpen(null); setTab('tonight'); }}
              onWhy={() => { setOpen(null); setTab('why'); }} />
      <main id="main" key={open ? open.id : tab}>
        {open ? (
          <Reader story={open} lex={lex} len={len} next={nextCard}
                  tomorrow={open.id === pick?.story.id ? tomorrow : null}
                  readBefore={!!heard[open.id]}
                  onBack={() => { setOpen(null); setTab(from); }} onHeard={markHeard} onRead={read}
                  backLabel={from === 'shelf' ? 'The shelf' : from === 'map' ? 'The constellation' : 'Tonight'} />
        ) : tab === 'tonight' ? (
          <Tonight pick={pick} pan={pan} len={len} setLen={setLen} onRead={read}
                   profile={profile} child={child} heard={heard} cards={cards}
                   canon={canon} published={cards.length}
                   account={account} syncing={syncing} onAccountChanged={refresh} onSignOut={handleSignOut}
                   setActive={id => setProfile(p => ({ ...p, activeId: id }))}
                   addChild={addChild} patchChild={patchChild} removeChild={removeChild}
                   setGate={g => setProfile(p => ({ ...p, gate: g, updatedAt: new Date().toISOString() }))}
                   onShelf={() => setTab('shelf')} />
        ) : tab === 'shelf' ? (
          <Shelf canon={canon} publishedIds={publishedIds} gate={profile.gate} onRead={read} />
        ) : tab === 'map' ? (
          <Constellation lex={lex} rel={rel} heard={heard} cards={cards} childName={child?.name ?? ''} />
        ) : <Why />}
      </main>
      <Tabs tab={open ? from : tab} onTab={t => { setOpen(null); setTab(t); }} />
    </div>
  );
}
