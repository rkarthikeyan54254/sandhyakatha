import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, CanonRow, Lexicon, Relations, Story } from './lib/types';
import { panchanga, type PanchangaTable } from './lib/panchanga';
import { pickTonight } from './lib/picker';
import { observancesForDate, type RuntimeObservanceCatalog } from './lib/observance';
import * as P from './lib/profile';
import { track } from './lib/track';
import { recordStoryOpen } from './lib/retention';
import { currentAccount, syncProfile, signOut, type Account as Acct } from './lib/sync';
import { adoptSnapshot, sameSnapshot } from './lib/sync-adoption';
import { Header, LanguageBar, Tabs, type Tab } from './ui/Chrome';
import Tonight, { type Len } from './ui/Tonight';
import Reader from './ui/Reader';
import Shelf from './ui/Shelf';
import Constellation from './ui/Constellation';
import Why from './ui/Why';
import { currentTab, onRoutePop, pushTabPath } from './lib/route';
import { appLocaleFromLocation, cardsForAppLocale, initialAppLocale, localeLanguage, localeStoryMeta, localeUi, persistAppLocale, type AppLocale, type LocaleCatalog } from './lib/app-locale';

function analyticsMode(len: Len): 'short' | 'full' {
  return len === 'short' ? 'short' : 'full';
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [canon, setCanon] = useState<CanonRow[]>([]);
  const [lex, setLex] = useState<Lexicon>({});
  const [rel, setRel] = useState<Relations | null>(null);
  const [cal, setCal] = useState<PanchangaTable | null>(null);
  const [localeCatalog, setLocaleCatalog] = useState<LocaleCatalog | null>(null);
  const [observanceCatalog, setObservanceCatalog] = useState<RuntimeObservanceCatalog | null>(null);
  const [appLocale, setAppLocale] = useState<AppLocale>(initialAppLocale);
  const [open, setOpen] = useState<Story | null>(null);
  const [tab, setTab] = useState<Tab>(currentTab);
  const [from, setFrom] = useState<Tab>(currentTab);   // where the reader was opened from
  const [len, setLen] = useState<Len>('full');
  const [readerWasTonightPick, setReaderWasTonightPick] = useState(false);
  const [readerWasReadBefore, setReaderWasReadBefore] = useState(false);

  const [profile, renderProfile] = useState<P.Profile>(() => P.load());
  const [account, setAccount] = useState<Acct | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const profileRef = useRef(profile);
  const syncInFlight = useRef(0);
  const syncGeneration = useRef(0);
  // Keep the snapshot current synchronously, including edits before React's
  // next render. Updaters run once here, never as replayable React side effects.
  const setProfile = useCallback((update: P.Profile | ((p: P.Profile) => P.Profile)) => {
    const next = typeof update === 'function' ? update(profileRef.current) : update;
    profileRef.current = next;
    renderProfile(next);
  }, []);

  const syncAndAdopt = useCallback(async (snapshot: P.Profile, generation = syncGeneration.current, expectedAccount?: string) => {
    // A queued task from an account generation that has already been signed out
    // is stale before it even reaches the network.
    if (generation !== syncGeneration.current) return snapshot;
    setSyncPending(true);
    syncInFlight.current += 1;
    setSyncing(true);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        // A retry may contain real edits made during first sign-in. Such an
        // anonymous snapshot is no longer an untouched fresh-device placeholder.
        const next = await syncProfile(snapshot, expectedAccount, attempt > 0);
        // Sign-out (or another account boundary) invalidates every response that
        // began in the previous generation. Never repopulate cleared family data.
        if (generation !== syncGeneration.current) return next;
        const current = profileRef.current;
        if (!sameSnapshot(current, snapshot)) {
          // Preserve an intervening edit and reconcile it before claiming backup.
          snapshot = current;
          continue;
        }
        setProfile(adoptSnapshot(current, snapshot, next, generation, syncGeneration.current));
        setSyncPending(false);
        return next;
      }
      throw new Error('local profile changed repeatedly while syncing');
    } catch (e) {
      if (generation === syncGeneration.current) setSyncPending(true);
      throw e;
    } finally {
      syncInFlight.current -= 1;
      if (syncInFlight.current === 0) setSyncing(false);
    }
  }, [setProfile]);

  useEffect(() => { P.save(profile); }, [profile]);
  useEffect(() => { P.requestPersistence(); }, []);

  /*
   * One-time-by-existence cache migration.
   *
   * Older Sandhya Katha service workers cached story JSON at stable URLs such
   * as /data/s/pusalar-temple.json. Those entries can outlive both a story
   * version change and the addition of reviewed art. The app now requests a
   * content-revisioned URL, so these caches are no longer valid inputs.
   *
   * Cache deletion is intentionally best-effort and does not touch profile
   * storage, account state, the Workbox precache, fonts, or current art.
   */
  useEffect(() => {
    if (!('caches' in window)) return;
    const retired = new Set([
      'stories', 'corpus', 'story-art',
      'stories-v2', 'corpus-v2'
    ]);
    void caches.keys()
      .then(names => Promise.all(names.filter(n => retired.has(n)).map(n => caches.delete(n))))
      .catch(() => {});
  }, []);

  /*
   * Story completion already syncs immediately. Settings used not to sync at
   * all: rename, age, active child, gate and deletion lived only in localStorage
   * until some unrelated later action. Debounce just those settings so typing a
   * name does not issue one request per keystroke.
   */
  const settingsKey = useMemo(() => JSON.stringify({
    children: profile.children,
    activeId: profile.activeId,
    gate: profile.gate,
    deletedChildren: profile.deletedChildren ?? {}
  }), [profile.children, profile.activeId, profile.gate, profile.deletedChildren]);

  useEffect(() => {
    if (!account || profile.owner !== account.id) return;
    const snapshot = profile;
    const generation = syncGeneration.current;
    setSyncPending(true);
    const timer = window.setTimeout(() => {
      void syncAndAdopt(snapshot, generation).catch(() => {});
    }, 400);
    return () => window.clearTimeout(timer);
  }, [account?.id, profile.owner, settingsKey, syncAndAdopt]);

  useEffect(() => {
    const j = (p: string) => fetch(p).then(r => r.json());
    j('/data/index.json').then(d => setCards(d.stories)).catch(() => {});
    j('/data/canon.json').then(setCanon).catch(() => {});
    j('/data/lexicon.json').then(setLex).catch(() => {});
    j('/data/relations.json').then(setRel).catch(() => {});
    j('/data/panchanga.json').then(setCal).catch(() => {});
    j('/data/observances.json').then(setObservanceCatalog).catch(() => {});
    j('/data/locale-catalog.json').then(setLocaleCatalog).catch(() => {});
  }, []);

  /* Signed in? Then merge this device with the account copy, both directions. */
  const refresh = useCallback(async () => {
    const generation = ++syncGeneration.current;
    const found = await currentAccount();
    if (generation !== syncGeneration.current) return;
    setAccount(found?.account ?? null);
    if (!found) { setSyncPending(!!profileRef.current.owner); return; }
    setSyncPending(true);
    void syncAndAdopt(profileRef.current, generation, found.account.id).catch(() => {});
  }, [syncAndAdopt]);

  useEffect(() => {
    void refresh();
    // Coming back from Google leaves ?signin= on the URL; clean it up.
    const u = new URL(window.location.href);
    if (u.searchParams.has('signin')) {
      u.searchParams.delete('signin');
      window.history.replaceState({}, '', u.pathname + u.search + u.hash);
    }
  }, [refresh]);

  /**
   * One surface, one address.
   *
   * `go` is the only thing that changes the current surface: it pushes unless we
   * are already on that path, so closing the reader back onto the tab it was
   * opened from does not stack a duplicate entry the user then has to press
   * back through twice.
   */
  const go = useCallback((next: Tab) => {
    setOpen(null);
    setTab(next);
    // The surface changes even in a partial/non-browser environment; the route
    // helper writes history only when that capability really exists.
    pushTabPath(next);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function')
      window.scrollTo({ top: 0 });
  }, []);

  const chooseLocale = useCallback((next: AppLocale) => {
    setAppLocale(next);
    setOpen(null);
    setTab('tonight');
    setFrom('tonight');
    setLen(next === 'en' ? 'full' : 'short');
    persistAppLocale(next);
    pushTabPath('tonight');
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function')
      window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined')
      document.documentElement.lang = localeUi(appLocale).language;
    if (appLocale !== 'en' && len !== 'short') setLen('short');
  }, [appLocale, len]);

  // The back button should go back a screen, not leave the site. On Android it
  // is a hardware button and this is the commonest way out of a PWA by accident.
  useEffect(() => {
    const onPop = () => {
      const next = currentTab();
      setAppLocale(appLocaleFromLocation());
      setOpen(null);
      setTab(next);
      setFrom(next);
    };
    return onRoutePop(onPop);
  }, []);

  const child = P.activeChild(profile);
  const heard = P.heardOf(profile, child?.id ?? null);
  const favourites = P.againOf(profile, child?.id ?? null);
  const localeCards = useMemo(() => cardsForAppLocale(cards, localeCatalog, appLocale), [cards, localeCatalog, appLocale]);
  const pan = useMemo(() => panchanga(new Date(), cal), [cal]);
  const todayObservances = useMemo(
    () => observancesForDate(observanceCatalog, pan.date),
    [observanceCatalog, pan.date]);
  const pick = useMemo(
    () => localeCards.length ? pickTonight(localeCards, {
      // Before a parent gives us an age, choose conservatively. A story that is
      // safe for a four-year-old is still usable by an older child; the reverse
      // is not true.
      panchanga: pan, childAge: child?.age ?? 4, heard, favourites, includeGated: profile.gate,
      allowRepeatFallback: appLocale !== 'en', observances: todayObservances
    }) : null,
    [localeCards, pan, child?.age, heard, favourites, profile.gate, appLocale, todayObservances]);

  /**
   * Tomorrow night, named while this reader is still open.
   *
   * This is anchored to the story that was the primary Tonight pick when the
   * reader opened. It deliberately does not follow `pick` after completion:
   * marking tonight heard changes `pick`, which used to make tomorrow vanish at
   * exactly the moment we wanted to show it.
   */
  const tomorrowForOpen = useMemo(() => {
    if (!localeCards.length || !open || !readerWasTonightPick) return null;
    const d = new Date(); d.setDate(d.getDate() + 1);
    const tomorrowPan = panchanga(d, cal);
    return pickTonight(localeCards, {
      panchanga: tomorrowPan, childAge: child?.age ?? 4,
      heard: { ...heard, [open.id]: P.today() }, favourites, includeGated: profile.gate,
      allowRepeatFallback: appLocale !== 'en',
      observances: observancesForDate(observanceCatalog, tomorrowPan.date)
    });
  }, [localeCards, cal, observanceCatalog, open, readerWasTonightPick, child?.age, heard, favourites, profile.gate, appLocale]);

  const publishedIds = useMemo(() => new Set(cards.map(c => c.id)), [cards]);

  async function read(id: string) {
    setFrom(tab);
    setReaderWasTonightPick(tab === 'tonight' && id === pick?.story.id);
    setReaderWasReadBefore(!!heard[id]);
    try {
      const card = cards.find(c => c.id === id);
      const localized = localeStoryMeta(localeCatalog, appLocale, id);
      const storyUrl = appLocale === 'en'
        ? (card?.storyRevision ? `/data/s/${id}.json?v=${card.storyRevision}` : `/data/s/${id}.json`)
        : `/data/l/${localeLanguage(appLocale)}/${id}.json?v=${localized?.storyRevision ?? ''}`;
      if (appLocale !== 'en' && !localized)
        throw new Error(`${appLocale}/${id}: reviewed runtime edition missing`);
      const s: Story = await (await fetch(storyUrl)).json();
      const retention = recordStoryOpen(new Date());
      track('story_opened', {
        story_id: s.id,
        corpus: s.source.corpus,
        from: tab,
        mode: appLocale === 'en' ? analyticsMode(len) : 'short',
        repeat: !!heard[id],
        one_more: appLocale === 'en' && len === 'more',
        locale: appLocale,
        ...retention
      });
      setOpen(s); window.scrollTo({ top: 0 });
    } catch { /* not written yet */ }
  }

  function markHeard(storyId: string) {
    const current = P.activeChild(profile);
    const corpus = open?.id === storyId
      ? open.source.corpus
      : cards.find(card => card.id === storyId)?.corpus ?? 'unknown';

    track('story_finished', {
      story_id: storyId,
      corpus,
      from,
      mode: analyticsMode(len),
      repeat: !!(current && P.heardOf(profile, current.id)[storyId]),
      one_more: (open?.locale ?? 'en') === 'en' && len === 'more',
      locale: open?.locale ?? 'en'
    });

    // A first-time visitor can finish a story without giving us any child data.
    // The aggregate event above is still useful measurement; reading history
    // begins only after the parent explicitly gives us an age.
    if (!current) return;

    setProfile(p => {
      const c = P.activeChild(p);
      if (!c) return p;
      const next = P.markHeard(p, c.id, storyId);
      // Always attempt the push. `account` is set asynchronously after load, so
      // gating on it meant a story marked in the first second of a session was
      // saved on the device and never uploaded — and sign-out then cleared the
      // device. syncProfile already does nothing when signed out.
      void syncAndAdopt(next).catch(() => {});
      return next;
    });
  }

  /** The first personal detail we need is age, and only after the product has
   *  delivered a story. The name can stay blank indefinitely. */
  function startProfileAfterRead(storyId: string, age: number) {
    const safeAge = Math.max(3, Math.min(15, Math.round(age)));
    setProfile(p => {
      let base = p;
      let c = P.activeChild(base);
      if (!c) {
        base = P.addChildToProfile(base, '', safeAge);
        c = P.activeChild(base);
        if (!c) return p;
      }
      const next = P.markHeard(base, c.id, storyId);
      void syncAndAdopt(next).catch(() => {});
      return next;
    });
  }

  /**
   * Signing out forgets this device's copy — see sync.signOut. Only after the
   * server has confirmed, and only if the last night was saved first; a failed
   * save leaves the family signed in with their history intact.
   */
  async function handleSignOut(): Promise<'ok' | 'unsaved'> {
    const generation = ++syncGeneration.current;
    const snapshot = profileRef.current;
    const r = await signOut(snapshot, () => generation === syncGeneration.current && sameSnapshot(profileRef.current, snapshot));
    if (r === 'ok') {
      // Cross an account boundary before clearing React/local state so every
      // older in-flight or queued sync becomes permanently ineligible to adopt.
      syncGeneration.current += 1;
      const empty = P.emptyProfile();
      profileRef.current = empty;
      setProfile(empty);
      setAccount(null);
      setSyncPending(false);
      setSyncing(false);
    }
    void refresh();
    return r;
  }

  const addChild = (name: string, age: number) => setProfile(p => P.addChildToProfile(p, name, age));
  const removeChild = (id: string) => setProfile(p => P.removeChild(p, id));
  const repairChildConflict = (id: string, historyOwnerIndex: number) =>
    setProfile(p => P.repairDuplicateId(p, id, historyOwnerIndex));
  const patchChild = (id: string, patch: Partial<P.Child>) =>
    setProfile(p => P.patchChildProfile(p, id, patch));


  const nextCard = open?.linked ? localeCards.find(c => c.id === open.linked!.next) ?? null : null;

  return (
    <div className="app" data-locale={appLocale}>
      <a className="skip" href="#main">Skip to tonight's story</a>
      <Header onHome={() => go('tonight')} onWhy={() => go('why')} />
      <LanguageBar locale={appLocale} onLocale={chooseLocale} />
      <main id="main" key={open ? open.id : tab}>
        {open ? (
          <Reader story={open} lex={lex} len={len} next={nextCard} locale={appLocale}
                  tomorrow={tomorrowForOpen}
                  readBefore={readerWasReadBefore}
                  hasProfile={!!child}
                  onBack={() => go(from)} onHeard={markHeard} onRead={read}
                  onPersonalize={age => startProfileAfterRead(open.id, age)}
                  backLabel={appLocale === 'en' ? (from === 'shelf' ? 'The shelf' : from === 'map' ? 'The constellation' : 'Tonight') : localeUi(appLocale).tonightTab} />
        ) : tab === 'tonight' ? (
          <Tonight pick={pick} pan={pan} len={len} setLen={setLen} onRead={read}
                   profile={profile} child={child} heard={heard} cards={localeCards}
                   canon={canon} published={cards.length}
                   account={account} syncing={syncing} syncPending={syncPending} onAccountChanged={refresh} onSignOut={handleSignOut}
                   setActive={id => setProfile(p => P.setActiveChild(p, id))}
                   addChild={addChild} patchChild={patchChild} removeChild={removeChild}
                   repairChildConflict={repairChildConflict}
                   setGate={g => setProfile(p => P.setGateSetting(p, g))}
                   onShelf={() => go('shelf')}
                   onMap={() => go('map')}
                   onWhy={() => go('why')} locale={appLocale} observances={todayObservances} />
        ) : tab === 'shelf' ? (
          <Shelf canon={canon} publishedIds={publishedIds} gate={profile.gate} onRead={read} />
        ) : tab === 'map' ? (
          <Constellation lex={lex} rel={rel} heard={heard} cards={cards} childName={child?.name ?? ''} onTonight={() => go('tonight')} />
        ) : <Why />}
      </main>
      <Tabs tab={open ? from : tab} onTab={go} locale={appLocale} />
    </div>
  );
}
