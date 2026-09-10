/**
 * The family's own state.
 *
 * Held on the device, and — if the parent chooses — mirrored to their account
 * so it survives a cleared cache and reaches the second device. What we keep is
 * deliberately small: a first name the parent typed, an age, which stories were
 * heard and when. No behavioural events, no per-child analytics, no third
 * parties. See PRIVACY.md.
 */
export interface Child { id: string; name: string; age: number }

export interface Profile {
  v: 1;
  children: Child[];
  activeId: string | null;
  gate: boolean;
  /** childId -> storyId -> yyyy-mm-dd of the night it was read */
  heard: Record<string, Record<string, string>>;
  /**
   * childId -> storyId -> the last night it was asked for AGAIN.
   *
   * The one thing a generator cannot do is tell the same story twice, and a
   * child asking for a story a second time is the strongest signal in the whole
   * system. Optional because profiles written before this existed do not have
   * it; read it through `againOf`, never directly.
   */
  again?: Record<string, Record<string, string>>;
  firstNight: string | null;
  /**
   * Which account this device's copy belongs to — null while nobody has ever
   * signed in here. Without it, signing out and signing in as someone else
   * leaves the first family's children on screen and, worse, merges them into
   * the second family's account on the next write. See sync.ts.
   */
  owner?: string | null;
  updatedAt: string;
}

const KEY = 'sk.profile';
export const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyProfile = (): Profile =>
  ({ v: 1, children: [], activeId: null, gate: false, heard: {}, again: {}, firstNight: null,
     owner: null, updatedAt: new Date().toISOString() });

export const newChild = (name: string, age: number): Child => ({ id: uid(), name: name.trim(), age });

/** Ask the browser to stop evicting us. Safari clears script-writable storage
 *  after ~7 days without a first-party visit; Chrome evicts under pressure.
 *  A family that skips a week should not come back to an empty constellation. */
export async function requestPersistence() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); }
  catch { /* not supported */ }
}

export function load(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return tidy(JSON.parse(raw) as Profile);
  } catch { /* fall through */ }
  return migrate();
}

/** Carry over the pre-profile keys so nobody loses a history to an upgrade. */
function migrate(): Profile {
  const p = emptyProfile();
  try {
    const age = JSON.parse(localStorage.getItem('sk.age') ?? 'null');
    const gate = JSON.parse(localStorage.getItem('sk.gate') ?? 'false');
    const heard = JSON.parse(localStorage.getItem('sk.heard') ?? '{}') as Record<string, string>;
    if (age == null && !Object.keys(heard).length) return p;
    const c = newChild('', typeof age === 'number' ? age : 8);
    p.children = [c]; p.activeId = c.id; p.gate = !!gate;
    p.heard = { [c.id]: heard };
    p.firstNight = Object.values(heard).sort()[0] ?? null;
  } catch { /* nothing to carry */ }
  return p;
}

export function save(p: Profile) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
}

export const activeChild = (p: Profile) => p.children.find(c => c.id === p.activeId) ?? p.children[0] ?? null;
export const heardOf = (p: Profile, childId: string | null) => (childId && p.heard[childId]) || {};
export const againOf = (p: Profile, childId: string | null) => (childId && p.again?.[childId]) || {};

/**
 * A second reading is not a duplicate. The first night goes in `heard`; every
 * night after that also lands in `again`, which is what marks a story as one
 * this child comes back to.
 */
export function markHeard(p: Profile, childId: string, storyId: string): Profile {
  const d = today();
  const before = p.heard[childId]?.[storyId];
  const again = before
    ? { ...(p.again ?? {}), [childId]: { ...(p.again?.[childId] ?? {}), [storyId]: d } }
    : (p.again ?? {});
  return {
    ...p,
    heard: { ...p.heard, [childId]: { ...(p.heard[childId] ?? {}), [storyId]: before ?? d } },
    again,
    firstNight: p.firstNight ?? d,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Two devices invent different ids for the same child — the id is minted where
 * the name was typed. A name and an age is the only thing the two copies agree
 * on, so that is what folds them together. Without this, typing "Rakshu, 8" on
 * a second device produces a second Rakshu with no history, and the app makes
 * her the active one.
 */
const childKey = (c: Child) => `${c.name.trim().toLowerCase()}|${c.age}`;

/**
 * One child list, cleaned. Three things go wrong on their own, and they are
 * fixed in one place because fixing them at each call site is how they came
 * back last time.
 *
 * 1. Duplicates. merge() folds two lists against each other but never folds a
 *    list against itself, so the same name and age twice in one list stayed
 *    twice, and then synced.
 * 2. Blanks. Skipping setup mints a nameless child so the app has an age to
 *    work with. Do that on five sign-ins and there are five of them, and the
 *    settings screen turns into a wall of "Add a name" that the parent has no
 *    way to clear.
 * 3. An activeId pointing at a child that is no longer in the list.
 *
 * A nameless child that has actually heard something is never dropped —
 * somebody skipped setup and then read six stories, and those six nights are
 * the entire point of the product. One nameless empty is kept only when there
 * is no named child at all, because that one is holding the age.
 */
export function tidy(p: Profile): Profile {
  const lived = (id: string) =>
    Object.keys(p.heard[id] ?? {}).length > 0 || Object.keys(p.again?.[id] ?? {}).length > 0;

  // Fold same name + age within the one list, moving nights onto the survivor.
  const byKey = new Map<string, Child>();
  const remap: Record<string, string> = {};
  const folded: Child[] = [];
  for (const c of p.children) {
    const first = byKey.get(childKey(c));
    if (first) { if (first.id !== c.id) remap[c.id] = first.id; }
    else { byKey.set(childKey(c), c); folded.push(c); }
  }

  // Then the blanks. Named children are never dropped, whatever else is true.
  const named = folded.filter(c => c.name.trim() || lived(c.id));
  const kept = named.length
    ? named
    : folded.slice(0, 1);   // nothing named: keep one, it is holding the age

  const dropped = new Set(folded.filter(c => !kept.includes(c)).map(c => c.id));
  if (!Object.keys(remap).length && !dropped.size && p.children.length === kept.length) {
    const stillThere = p.activeId && kept.some(c => c.id === p.activeId);
    if (stillThere || (!p.activeId && !kept.length)) return p;   // nothing to do
  }

  const move = (id: string) => remap[id] ?? id;
  const roll = (src: Record<string, Record<string, string>> | undefined,
                pick: (a: string, b: string) => string) => {
    const out: Record<string, Record<string, string>> = {};
    for (const [child, nights] of Object.entries(src ?? {})) {
      const k = move(child);
      if (dropped.has(k)) continue;              // a dropped blank had no nights
      out[k] = { ...(out[k] ?? {}) };
      for (const [story, date] of Object.entries(nights)) {
        const prev = out[k][story];
        out[k][story] = prev ? pick(prev, date) : date;
      }
    }
    return out;
  };

  const active = p.activeId ? move(p.activeId) : null;
  return {
    ...p,
    children: kept,
    activeId: active && kept.some(c => c.id === active) ? active : (kept[0]?.id ?? null),
    heard: roll(p.heard, (a, b) => (a < b ? a : b)),      // earliest first night wins
    again: roll(p.again, (a, b) => (a > b ? a : b))       // latest re-read wins
  };
}

/**
 * Merge a device and an account. Heard nights are a union and the earliest date
 * wins — a story read on the iPad was still read. Everything else follows the
 * more recently touched copy, which is the closest thing to intent we have.
 */
export function merge(a: Profile, b: Profile): Profile {
  const [older, newer] = Date.parse(a.updatedAt) <= Date.parse(b.updatedAt) ? [a, b] : [b, a];

  // Fold the child lists first, and carry anything the newer copy recorded
  // against its own id over to the id the account already uses.
  const byKey = new Map(older.children.map(c => [childKey(c), c]));
  const folded: Child[] = [...older.children];
  const remap: Record<string, string> = {};
  for (const c of newer.children) {
    const match = byKey.get(childKey(c));
    if (match) { if (match.id !== c.id) remap[c.id] = match.id; }
    else { folded.push(c); byKey.set(childKey(c), c); }
  }
  const to = (id: string) => remap[id] ?? id;

  const heard: Profile['heard'] = { ...older.heard };
  for (const [child, nights] of Object.entries(newer.heard)) {
    const k = to(child);
    heard[k] = { ...(heard[k] ?? {}) };
    for (const [story, date] of Object.entries(nights)) {
      const prev = heard[k][story];
      heard[k][story] = prev && prev < date ? prev : date;
    }
  }
  // Re-reads union too, but the LATEST wins — unlike a first night, what
  // matters about "again" is that it is still happening.
  const again: NonNullable<Profile['again']> = { ...(older.again ?? {}) };
  for (const [child, nights] of Object.entries(newer.again ?? {})) {
    const k = to(child);
    again[k] = { ...(again[k] ?? {}) };
    for (const [story, date] of Object.entries(nights)) {
      const prev = again[k][story];
      again[k][story] = prev && prev > date ? prev : date;
    }
  }
  const firsts = [older.firstNight, newer.firstNight].filter(Boolean).sort() as string[];
  const active = newer.activeId ? to(newer.activeId) : null;
  return tidy({
    v: 1, children: folded,
    activeId: (active && folded.some(c => c.id === active) ? active : null) ?? older.activeId ?? folded[0]?.id ?? null,
    gate: newer.gate, heard, again,
    owner: newer.owner ?? older.owner ?? null,
    firstNight: firsts[0] ?? null,
    updatedAt: newer.updatedAt
  });
}

/* ---------- what the app says back to the parent ---------- */

export interface Stats { stories: number; nights: number; streak: number; since: string | null }

export function stats(p: Profile, childId: string | null): Stats {
  const nights = Object.values(heardOf(p, childId));
  const days = [...new Set(nights)].sort();
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (days.includes(key)) { streak++; d.setDate(d.getDate() - 1); }
    else if (streak === 0 && key === today()) { d.setDate(d.getDate() - 1); }  // tonight not read yet
    else break;
  }
  return { stories: nights.length, nights: days.length, streak, since: days[0] ?? null };
}

/** "A year ago tonight you read her the squirrel story." */
export function anniversary(p: Profile, childId: string | null): { storyId: string; years: number } | null {
  const now = new Date(today());
  for (const [storyId, date] of Object.entries(heardOf(p, childId))) {
    const then = new Date(date);
    const years = now.getFullYear() - then.getFullYear();
    if (years >= 1 && then.getMonth() === now.getMonth() && then.getDate() === now.getDate())
      return { storyId, years };
  }
  return null;
}
