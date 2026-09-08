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
  firstNight: string | null;
  updatedAt: string;
}

const KEY = 'sk.profile';
export const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyProfile = (): Profile =>
  ({ v: 1, children: [], activeId: null, gate: false, heard: {}, firstNight: null, updatedAt: new Date().toISOString() });

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
    if (raw) return JSON.parse(raw) as Profile;
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

export function markHeard(p: Profile, childId: string, storyId: string): Profile {
  const d = today();
  return {
    ...p,
    heard: { ...p.heard, [childId]: { ...(p.heard[childId] ?? {}), [storyId]: d } },
    firstNight: p.firstNight ?? d,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Merge a device and an account. Heard nights are a union and the earliest date
 * wins — a story read on the iPad was still read. Everything else follows the
 * more recently touched copy, which is the closest thing to intent we have.
 */
export function merge(a: Profile, b: Profile): Profile {
  const [older, newer] = Date.parse(a.updatedAt) <= Date.parse(b.updatedAt) ? [a, b] : [b, a];
  const heard: Profile['heard'] = { ...older.heard };
  for (const [child, nights] of Object.entries(newer.heard)) {
    heard[child] = { ...(heard[child] ?? {}) };
    for (const [story, date] of Object.entries(nights)) {
      const prev = heard[child][story];
      heard[child][story] = prev && prev < date ? prev : date;
    }
  }
  const byId = new Map(older.children.map(c => [c.id, c]));
  for (const c of newer.children) byId.set(c.id, c);
  const firsts = [older.firstNight, newer.firstNight].filter(Boolean).sort() as string[];
  return {
    v: 1, children: [...byId.values()],
    activeId: newer.activeId ?? older.activeId,
    gate: newer.gate, heard,
    firstNight: firsts[0] ?? null,
    updatedAt: newer.updatedAt
  };
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
