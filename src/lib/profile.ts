/**
 * PERSISTED STATE: read docs/PERSISTED-STATE-SAFETY.md before changing this file.
 *
 * The family's own state.
 *
 * Held on the device, and — if the parent chooses — mirrored to their account
 * so it survives a cleared cache and reaches the second device. What we keep is
 * deliberately small: a first name the parent typed, an age, which stories were
 * heard and when. No behavioural events, no per-child analytics, no third
 * parties. See PRIVACY.md.
 */
export interface Child { id: string; name: string; age: number }

export interface QuarantinedHistory {
  heard: Record<string, string>;
  again: Record<string, string>;
  reason: 'retired-child-id';
  capturedAt: string;
}

export interface Profile {
  v: 1;
  children: Child[];
  activeId: string | null;
  gate: boolean;
  /** Per-child metadata clocks. Story reads never advance these. */
  childUpdatedAt?: Record<string, string>;
  /** The difficult-stories setting has its own clock. */
  gateUpdatedAt?: string;
  /** Active-child selection has its own clock. */
  activeUpdatedAt?: string;
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
  /**
   * childId -> ISO time at which the parent deliberately removed that child.
   *
   * A merge is otherwise additive, so absence cannot mean deletion: another
   * device would simply add the missing row back. Tombstones make deletion an
   * explicit fact that survives refreshes and stale devices. Optional so every
   * profile written before this field existed remains readable.
   */
  deletedChildren?: Record<string, string>;
  /** Why an id was retired. Repair ids preserve later stale history; deliberate deletions do not. */
  retiredChildReasons?: Record<string, 'deleted' | 'repaired'>;
  /** History arriving later under a retired child id is preserved here, never discarded. */
  quarantinedHistory?: Record<string, QuarantinedHistory>;
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
const now = () => new Date().toISOString();
const nextClock = (...clocks: Array<string | undefined>) => {
  let ms = Date.now();
  for (const value of clocks) {
    if (!value) continue;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) ms = Math.max(ms, parsed + 1);
  }
  return new Date(ms).toISOString();
};
const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyProfile = (): Profile =>
  ({ v: 1, children: [], activeId: null, gate: false, childUpdatedAt: {}, heard: {}, again: {},
     deletedChildren: {}, retiredChildReasons: {}, quarantinedHistory: {}, firstNight: null, owner: null, updatedAt: now() });

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
  return tidy(migrate());
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
    updatedAt: nextClock(p.updatedAt)
  };
}

/** Settings mutations own their own clocks; story reads must never impersonate them. */
export function addChildToProfile(p: Profile, name: string, age: number): Profile {
  const at = nextClock(p.updatedAt, p.activeUpdatedAt);
  if (!name.trim()) {
    const blank = p.children.find(c => !c.name.trim());
    if (blank) return setActiveChild(p, blank.id);
  }
  const c = newChild(name, age);
  return tidy({ ...p, children: [...p.children, c], activeId: c.id,
    childUpdatedAt: { ...(p.childUpdatedAt ?? {}), [c.id]: at }, activeUpdatedAt: at, updatedAt: at });
}

export function patchChildProfile(p: Profile, id: string, patch: Partial<Child>): Profile {
  const at = nextClock(p.updatedAt, p.childUpdatedAt?.[id]);
  const safePatch = { ...patch }; delete safePatch.id; // identity is never editable metadata
  return tidy({ ...p,
    children: p.children.map(c => c.id === id ? { ...c, ...safePatch } : c),
    childUpdatedAt: { ...(p.childUpdatedAt ?? {}), [id]: at }, updatedAt: at });
}

export function setActiveChild(p: Profile, id: string): Profile {
  if (!p.children.some(c => c.id === id)) return p;
  const at = nextClock(p.updatedAt, p.activeUpdatedAt);
  return tidy({ ...p, activeId: id, activeUpdatedAt: at, updatedAt: at });
}

export function setGateSetting(p: Profile, gate: boolean): Profile {
  const at = nextClock(p.updatedAt, p.gateUpdatedAt);
  return tidy({ ...p, gate, gateUpdatedAt: at, updatedAt: at });
}

/**
 * Removing a child is an explicit destructive action. Record the deletion as
 * well as removing the local row/history; otherwise an additive account merge
 * has no way to distinguish "deleted" from "this device has not seen it" and
 * will resurrect the child on refresh.
 */
export function removeChild(p: Profile, id: string): Profile {
  const at = nextClock(p.updatedAt, p.activeUpdatedAt, p.childUpdatedAt?.[id], p.deletedChildren?.[id]);
  const children = p.children.filter(c => c.id !== id);
  const heard = { ...p.heard }; delete heard[id];
  const again = { ...(p.again ?? {}) }; delete again[id];
  return tidy({
    ...p,
    children, heard, again,
    deletedChildren: { ...(p.deletedChildren ?? {}), [id]: at },
    retiredChildReasons: { ...(p.retiredChildReasons ?? {}), [id]: 'deleted' },
    activeId: p.activeId === id ? (children[0]?.id ?? null) : p.activeId,
    activeUpdatedAt: p.activeId === id ? at : p.activeUpdatedAt,
    updatedAt: at
  });
}

/** Two devices invent different ids for the same child — the id is minted where
 *  the name was typed. Name+age is therefore a FALLBACK identity across
 *  different ids. Same id is always stronger when each profile contains one
 *  row for that id. A legacy profile that already contains conflicting rows
 *  for the same id is ambiguous and must be repaired by the parent, not guessed. */
const childKey = (c: Child) => `${c.name.trim().toLowerCase()}|${c.age}`;

/** Union deletion facts. Once an id is deleted it is never reused, so the latest
 *  timestamp is diagnostic rather than an "undelete" mechanism. */
function mergeDeleted(a: Profile['deletedChildren'], b: Profile['deletedChildren']) {
  const out: Record<string, string> = { ...(a ?? {}) };
  for (const [id, at] of Object.entries(b ?? {})) {
    const prev = out[id];
    if (!prev || Date.parse(at) > Date.parse(prev)) out[id] = at;
  }
  return out;
}

function mergeRetiredReasons(a: Profile['retiredChildReasons'], b: Profile['retiredChildReasons']) {
  const out: NonNullable<Profile['retiredChildReasons']> = { ...(a ?? {}) };
  for (const [id, reason] of Object.entries(b ?? {}) as [string, 'deleted' | 'repaired'][]) {
    // Preserve the safer meaning if copies disagree: repaired ids quarantine stale history.
    out[id] = out[id] === 'repaired' || reason === 'repaired' ? 'repaired' : 'deleted';
  }
  return out;
}

const later = (a: string | undefined, b: string | undefined) => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
};

function mergeQuarantined(a: Profile['quarantinedHistory'], b: Profile['quarantinedHistory']) {
  const out: NonNullable<Profile['quarantinedHistory']> = {};
  for (const src of [a ?? {}, b ?? {}]) {
    for (const [id, q] of Object.entries(src)) {
      const prev = out[id];
      const heard = { ...(prev?.heard ?? {}) };
      for (const [story, date] of Object.entries(q.heard ?? {})) {
        const old = heard[story];
        heard[story] = old && old < date ? old : date;
      }
      const again = { ...(prev?.again ?? {}) };
      for (const [story, date] of Object.entries(q.again ?? {})) {
        const old = again[story];
        again[story] = old && old > date ? old : date;
      }
      out[id] = { heard, again, reason: 'retired-child-id', capturedAt: later(prev?.capturedAt, q.capturedAt) ?? now() };
    }
  }
  return out;
}

function profileClock(p: Profile, explicit: string | undefined) {
  return explicit ?? p.updatedAt;
}

function groupsById(children: Child[]) {
  const order: string[] = [];
  const groups = new Map<string, Child[]>();
  for (const c of children) {
    if (!groups.has(c.id)) { groups.set(c.id, []); order.push(c.id); }
    groups.get(c.id)!.push(c);
  }
  return { order, groups };
}

const distinctChildKeys = (children: Child[]) => new Set(children.map(childKey));
const conflictingGroup = (children: Child[]) => children.length > 1 && distinctChildKeys(children).size > 1;

export interface DuplicateIdConflict { id: string; children: Child[] }

/**
 * A legacy corruption state we cannot safely normalize without the parent's
 * knowledge: two different child rows share one history bucket because they
 * have the same id. Preserve it until the parent explicitly says whose history
 * that bucket represents.
 */
export function duplicateIdConflicts(p: Profile): DuplicateIdConflict[] {
  const { order, groups } = groupsById(p.children.filter(c => !p.deletedChildren?.[c.id]));
  return order
    .map(id => ({ id, children: groups.get(id)! }))
    .filter(g => conflictingGroup(g.children));
}

/**
 * One child list, cleaned.
 *
 * Healthy duplicate rows with the same id AND the same metadata are harmless
 * copies and may collapse. Conflicting metadata under one id is different: that
 * can represent two real children sharing one old history bucket. Preserve both
 * rows so the UI can ask the parent; never silently choose one.
 */
export function tidy(p: Profile): Profile {
  const deletedChildren = p.deletedChildren ?? {};
  const retiredChildReasons = p.retiredChildReasons ?? {};
  const lived = (id: string) =>
    Object.keys(p.heard[id] ?? {}).length > 0 || Object.keys(p.again?.[id] ?? {}).length > 0;

  const { order, groups } = groupsById(p.children);
  const folded: Child[] = [];
  for (const id of order) {
    if (deletedChildren[id]) continue;
    const group = groups.get(id)!;
    if (conflictingGroup(group)) folded.push(...group);       // ambiguous: preserve
    else folded.push(group.at(-1)!);                          // identical duplicate: safe collapse
  }

  const named = folded.filter(c => c.name.trim() || lived(c.id));
  // A blank row with its own metadata clock is deliberate editing state created
  // by '+ Add another child'. Preserve exactly that active placeholder. Old
  // legacy blanks have no childUpdatedAt entry and continue to be cleaned up.
  const activeDraft = folded.find(c =>
    c.id === p.activeId && !c.name.trim() && !lived(c.id) && !!p.childUpdatedAt?.[c.id]);
  const kept = named.length
    ? [...named, ...(activeDraft ? [activeDraft] : [])]
    : folded.slice(0, 1);
  const keptIds = new Set(kept.map(c => c.id));

  const quarantinedHistory = mergeQuarantined(p.quarantinedHistory, undefined);
  for (const id of Object.keys(deletedChildren)) {
    if (retiredChildReasons[id] !== 'repaired') continue;
    const h = p.heard[id] ?? {};
    const a = p.again?.[id] ?? {};
    if (!Object.keys(h).length && !Object.keys(a).length) continue;
    const prev = quarantinedHistory[id];
    quarantinedHistory[id] = mergeQuarantined(
      prev ? { [id]: prev } : undefined,
      { [id]: { heard: h, again: a, reason: 'retired-child-id', capturedAt: now() } }
    )[id];
  }

  const roll = (src: Record<string, Record<string, string>> | undefined) => {
    const out: Record<string, Record<string, string>> = {};
    for (const [child, nights] of Object.entries(src ?? {})) {
      if (deletedChildren[child] || !keptIds.has(child)) continue;
      out[child] = { ...nights };
    }
    return out;
  };

  const active = p.activeId;
  const heard = roll(p.heard);
  const again = roll(p.again);
  const firstNight = Object.values(heard).flatMap(n => Object.values(n)).sort()[0] ?? null;

  // Materialize legacy whole-profile clocks exactly once. After this, a story
  // read can advance updatedAt without pretending that a name, age or gate changed.
  const childUpdatedAt: Record<string, string> = { ...(p.childUpdatedAt ?? {}) };
  for (const c of kept) if (!childUpdatedAt[c.id]) childUpdatedAt[c.id] = p.updatedAt;

  return {
    ...p,
    children: kept,
    activeId: active && kept.some(c => c.id === active) ? active : (kept[0]?.id ?? null),
    gateUpdatedAt: p.gateUpdatedAt ?? p.updatedAt,
    activeUpdatedAt: p.activeUpdatedAt ?? p.updatedAt,
    childUpdatedAt,
    heard,
    again,
    firstNight,
    deletedChildren,
    retiredChildReasons,
    quarantinedHistory
  };
}

/**
 * Resolve one ambiguous duplicate-id group only after the parent chooses whose
 * existing reading history it represents.
 *
 * Every conflicting row receives a NEW id and the corrupt old id is tombstoned,
 * so an older browser can never resurrect it. The one shared history bucket is
 * moved only to the row the parent chose. Other rows start with empty history;
 * nothing is guessed or duplicated.
 */
export function repairDuplicateId(p: Profile, id: string, historyOwnerIndex: number): Profile {
  const positions = p.children.map((c, index) => ({ c, index })).filter(x => x.c.id === id);
  if (positions.length < 2 || !conflictingGroup(positions.map(x => x.c))) return p;
  if (historyOwnerIndex < 0 || historyOwnerIndex >= positions.length) return p;

  const at = nextClock(p.updatedAt, p.activeUpdatedAt, p.childUpdatedAt?.[id], p.deletedChildren?.[id]);
  const used = new Set(p.children.map(c => c.id));
  const fresh = () => {
    let id2 = uid();
    while (used.has(id2)) id2 = uid();
    used.add(id2);
    return id2;
  };
  const newIds = positions.map(() => fresh());
  const ownerId = newIds[historyOwnerIndex];
  const byPosition = new Map(positions.map((x, i) => [x.index, newIds[i]]));
  const children = p.children.map((c, index) => {
    const replacement = byPosition.get(index);
    return replacement ? { ...c, id: replacement } : c;
  });

  const heard = { ...p.heard };
  const oldHeard = heard[id]; delete heard[id];
  if (oldHeard) heard[ownerId] = { ...oldHeard };
  const again = { ...(p.again ?? {}) };
  const oldAgain = again[id]; delete again[id];
  if (oldAgain) again[ownerId] = { ...oldAgain };
  const childUpdatedAt = { ...(p.childUpdatedAt ?? {}) };
  delete childUpdatedAt[id];
  for (const freshId of newIds) childUpdatedAt[freshId] = at;

  return tidy({
    ...p, children, heard, again, childUpdatedAt,
    activeId: p.activeId === id ? ownerId : p.activeId,
    activeUpdatedAt: p.activeId === id ? at : p.activeUpdatedAt,
    deletedChildren: { ...(p.deletedChildren ?? {}), [id]: at },
    retiredChildReasons: { ...(p.retiredChildReasons ?? {}), [id]: 'repaired' },
    updatedAt: at
  });
}

/**
 * Merge a device and an account. Heard nights are a union and the earliest date
 * wins. Identity reconciliation is conservative when either copy already
 * contains an ambiguous duplicate-id group.
 */
export interface MergeOptions {
  /**
   * Which copy supplies the canonical child id when two different ids are
   * folded by the unique name+age cross-device fallback.
   *
   * Account sync passes "b" because the account copy is the durable namespace.
   * The default keeps the historical behaviour for non-account callers.
   */
  canonicalIdsFrom?: 'a' | 'b' | 'older';
}

export function merge(a: Profile, b: Profile, options: MergeOptions = {}): Profile {
  const deletedChildren = mergeDeleted(a.deletedChildren, b.deletedChildren);
  const retiredChildReasons = mergeRetiredReasons(a.retiredChildReasons, b.retiredChildReasons);
  const aa = tidy({ ...a, deletedChildren, retiredChildReasons });
  const bb = tidy({ ...b, deletedChildren, retiredChildReasons });
  const canonicalProfile = options.canonicalIdsFrom === 'a' ? aa : options.canonicalIdsFrom === 'b' ? bb :
    (Date.parse(aa.updatedAt) <= Date.parse(bb.updatedAt) ? aa : bb);
  const otherProfile = canonicalProfile === aa ? bb : aa;

  const ag = groupsById(aa.children), bg = groupsById(bb.children);
  const cg = groupsById(canonicalProfile.children), og = groupsById(otherProfile.children);
  const uniqueRows = (profile: Profile, groups: ReturnType<typeof groupsById>) =>
    profile.children.filter(c => (groups.groups.get(c.id)?.length ?? 0) === 1);
  const canonicalUnique = uniqueRows(canonicalProfile, cg), otherUnique = uniqueRows(otherProfile, og);
  const countKeys = (children: Child[]) => {
    const counts = new Map<string, number>();
    for (const c of children) counts.set(childKey(c), (counts.get(childKey(c)) ?? 0) + 1);
    return counts;
  };
  const canonicalKeyCounts = countKeys(canonicalUnique), otherKeyCounts = countKeys(otherUnique);
  const canonicalByKey = new Map(canonicalUnique.map(c => [childKey(c), c]));
  const remap: Record<string, string> = {};
  for (const c of otherUnique) {
    if (cg.groups.has(c.id) || deletedChildren[c.id]) continue;
    const key = childKey(c), match = canonicalByKey.get(key);
    if (match && canonicalKeyCounts.get(key) === 1 && otherKeyCounts.get(key) === 1) remap[c.id] = match.id;
  }

  const to = (id: string) => remap[id] ?? id;
  const ids: string[] = [], seen = new Set<string>();
  for (const id of [...ag.order, ...bg.order]) {
    const canonical = to(id);
    if (!deletedChildren[canonical] && !seen.has(canonical)) { seen.add(canonical); ids.push(canonical); }
  }
  const sourceIdsFor = (id: string) => [id, ...Object.entries(remap).filter(([, t]) => t === id).map(([src]) => src)];
  const groupFor = (groups: ReturnType<typeof groupsById>, id: string) =>
    sourceIdsFor(id).flatMap(source => groups.groups.get(source) ?? []);
  const clockFor = (p: Profile, groups: ReturnType<typeof groupsById>, id: string) => sourceIdsFor(id)
    .filter(source => groups.groups.has(source))
    .map(source => profileClock(p, p.childUpdatedAt?.[source]))
    .sort((x, y) => Date.parse(y) - Date.parse(x))[0] ?? p.updatedAt;

  const folded: Child[] = [];
  const childUpdatedAt: Record<string, string> = {};
  for (const id of ids) {
    const aGroup = groupFor(ag, id), bGroup = groupFor(bg, id);
    const aClock = clockFor(aa, ag, id), bClock = clockFor(bb, bg, id);
    childUpdatedAt[id] = later(aClock, bClock) ?? aa.updatedAt;
    if (!aGroup.length) { folded.push(...bGroup.map(c => ({ ...c, id }))); continue; }
    if (!bGroup.length) { folded.push(...aGroup.map(c => ({ ...c, id }))); continue; }
    if (conflictingGroup(aGroup) || conflictingGroup(bGroup)) {
      const variants = new Map<string, Child>();
      for (const c of [...aGroup, ...bGroup]) if (!variants.has(childKey(c))) variants.set(childKey(c), { ...c, id });
      folded.push(...variants.values());
      continue;
    }
    const chooseA = Date.parse(aClock) > Date.parse(bClock) ||
      (Date.parse(aClock) === Date.parse(bClock) && canonicalProfile === aa);
    folded.push({ ...(chooseA ? aGroup.at(-1)! : bGroup.at(-1)!), id });
  }

  const heard: Profile['heard'] = {};
  for (const src of [aa.heard, bb.heard]) for (const [child, nights] of Object.entries(src)) {
    const k = to(child); if (deletedChildren[k]) continue;
    heard[k] = { ...(heard[k] ?? {}) };
    for (const [story, date] of Object.entries(nights)) {
      const prev = heard[k][story]; heard[k][story] = prev && prev < date ? prev : date;
    }
  }
  const again: NonNullable<Profile['again']> = {};
  for (const src of [aa.again ?? {}, bb.again ?? {}]) for (const [child, nights] of Object.entries(src)) {
    const k = to(child); if (deletedChildren[k]) continue;
    again[k] = { ...(again[k] ?? {}) };
    for (const [story, date] of Object.entries(nights)) {
      const prev = again[k][story]; again[k][story] = prev && prev > date ? prev : date;
    }
  }

  const aGateClock = profileClock(aa, aa.gateUpdatedAt), bGateClock = profileClock(bb, bb.gateUpdatedAt);
  const chooseAGate = Date.parse(aGateClock) > Date.parse(bGateClock) ||
    (Date.parse(aGateClock) === Date.parse(bGateClock) && canonicalProfile === aa);
  const aActiveClock = profileClock(aa, aa.activeUpdatedAt), bActiveClock = profileClock(bb, bb.activeUpdatedAt);
  const chooseAActive = Date.parse(aActiveClock) > Date.parse(bActiveClock) ||
    (Date.parse(aActiveClock) === Date.parse(bActiveClock) && canonicalProfile === aa);
  const preferredActive = to((chooseAActive ? aa.activeId : bb.activeId) ?? '');
  const fallbackActive = to((chooseAActive ? bb.activeId : aa.activeId) ?? '');
  const updatedAt = later(aa.updatedAt, bb.updatedAt) ?? aa.updatedAt;

  return tidy({
    v: 1, children: folded, childUpdatedAt,
    activeId: folded.some(c => c.id === preferredActive) ? preferredActive :
      (folded.some(c => c.id === fallbackActive) ? fallbackActive : (folded[0]?.id ?? null)),
    activeUpdatedAt: later(aActiveClock, bActiveClock),
    gate: chooseAGate ? aa.gate : bb.gate,
    gateUpdatedAt: later(aGateClock, bGateClock),
    heard, again, deletedChildren, retiredChildReasons,
    quarantinedHistory: mergeQuarantined(aa.quarantinedHistory, bb.quarantinedHistory),
    owner: canonicalProfile.owner ?? otherProfile.owner ?? null,
    firstNight: null,
    updatedAt
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
