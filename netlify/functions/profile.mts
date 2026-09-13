/**
 * PERSISTED STATE: read docs/PERSISTED-STATE-SAFETY.md before changing this file.
 */
import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { readSession, keyFor, accountId } from '../lib/session.mts';

const EPOCH = '1970-01-01T00:00:00.000Z';
const later = (a: string | undefined, b: string | undefined) => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
};
const latestDeletion = (a: string | undefined, b: string) => later(a, b) ?? b;
const childKey = (c: any) => `${String(c?.name ?? '').trim().toLowerCase()}|${Number(c?.age ?? 0)}`;
const profileClock = (p: any, explicit: string | undefined) => explicit ?? p?.updatedAt ?? EPOCH;

function deletionsOf(...profiles: any[]) {
  const out: Record<string, string> = {};
  for (const p of profiles) for (const [id, at] of Object.entries(p?.deletedChildren ?? {}) as [string, string][])
    out[id] = latestDeletion(out[id], at);
  return out;
}

function retiredReasonsOf(...profiles: any[]) {
  const out: Record<string, 'deleted' | 'repaired'> = {};
  for (const p of profiles) {
    for (const [id, reason] of Object.entries(p?.retiredChildReasons ?? {}) as [string, 'deleted' | 'repaired'][]) {
      out[id] = out[id] === 'repaired' || reason === 'repaired' ? 'repaired' : 'deleted';
    }
  }
  return out;
}

function groupsById(children: any[] = []) {
  const order: string[] = [];
  const groups = new Map<string, any[]>();
  for (const c of children) {
    if (!c?.id || typeof c.id !== 'string') continue;
    if (!groups.has(c.id)) { groups.set(c.id, []); order.push(c.id); }
    groups.get(c.id)!.push(c);
  }
  return { order, groups };
}
const conflicting = (group: any[]) => group.length > 1 && new Set(group.map(childKey)).size > 1;

function normalizeChildren(children: any[], deleted: Record<string, string>) {
  const { order, groups } = groupsById(children);
  const out: any[] = [];
  for (const id of order) {
    if (deleted[id]) continue;
    const group = groups.get(id)!;
    if (conflicting(group)) out.push(...group);
    else out.push(group.at(-1));
  }
  return out;
}

function mergeQuarantined(a: any, b: any) {
  const out: Record<string, any> = {};
  for (const src of [a ?? {}, b ?? {}]) {
    for (const [id, q] of Object.entries(src) as [string, any][]) {
      const prev = out[id];
      const heard = { ...(prev?.heard ?? {}) };
      for (const [story, date] of Object.entries(q?.heard ?? {}) as [string, string][]) {
        const old = heard[story]; heard[story] = old && old < date ? old : date;
      }
      const again = { ...(prev?.again ?? {}) };
      for (const [story, date] of Object.entries(q?.again ?? {}) as [string, string][]) {
        const old = again[story]; again[story] = old && old > date ? old : date;
      }
      out[id] = { heard, again, reason: 'retired-child-id', capturedAt: later(prev?.capturedAt, q?.capturedAt) ?? new Date().toISOString() };
    }
  }
  return out;
}

function unionHistory(
  older: Record<string, Record<string, string>> | undefined,
  newer: Record<string, Record<string, string>> | undefined,
  deleted: Record<string, string>,
  pick: (a: string, b: string) => string,
  mapNewer: (id: string) => string = id => id
) {
  const out: Record<string, Record<string, string>> = {};
  const add = (src: Record<string, Record<string, string>> | undefined, mapId: (id: string) => string) => {
    for (const [child, nights] of Object.entries(src ?? {})) {
      const k = mapId(child);
      if (deleted[k]) continue;
      out[k] = { ...(out[k] ?? {}) };
      for (const [story, date] of Object.entries(nights)) {
        const prev = out[k][story]; out[k][story] = prev ? pick(prev, date) : date;
      }
    }
  };
  add(older, id => id); add(newer, mapNewer);
  return out;
}

function reconcileChildren(current: any, incoming: any, deleted: Record<string, string>) {
  const currentChildren = normalizeChildren(current?.children ?? [], deleted);
  const incomingChildren = normalizeChildren(incoming?.children ?? [], deleted);
  const currentGroups = groupsById(currentChildren), incomingGroups = groupsById(incomingChildren);
  const currentUnique = currentChildren.filter(c => (currentGroups.groups.get(c.id)?.length ?? 0) === 1);
  const incomingUnique = incomingChildren.filter(c => (incomingGroups.groups.get(c.id)?.length ?? 0) === 1);
  const countKeys = (children: any[]) => {
    const out = new Map<string, number>();
    for (const c of children) out.set(childKey(c), (out.get(childKey(c)) ?? 0) + 1);
    return out;
  };
  const currentCounts = countKeys(currentUnique), incomingCounts = countKeys(incomingUnique);
  const currentByKey = new Map(currentUnique.map(c => [childKey(c), c]));
  const remapIncoming: Record<string, string> = {};
  for (const c of incomingUnique) {
    if (currentGroups.groups.has(c.id) || deleted[c.id]) continue;
    const key = childKey(c), match = currentByKey.get(key);
    if (match && currentCounts.get(key) === 1 && incomingCounts.get(key) === 1) remapIncoming[c.id] = match.id;
  }
  const to = (id: string) => remapIncoming[id] ?? id;
  const ids: string[] = [], seen = new Set<string>();
  for (const id of [...currentGroups.order, ...incomingGroups.order]) {
    const canonical = to(id);
    if (!deleted[canonical] && !seen.has(canonical)) { seen.add(canonical); ids.push(canonical); }
  }
  const sourceIdsFor = (id: string) => [id, ...Object.entries(remapIncoming).filter(([, t]) => t === id).map(([s]) => s)];
  const incomingGroupFor = (id: string) => sourceIdsFor(id).flatMap(source => incomingGroups.groups.get(source) ?? []);
  const incomingClockFor = (id: string) => {
    const explicit = sourceIdsFor(id).map(source => incoming?.childUpdatedAt?.[source]).filter(Boolean) as string[];
    if (explicit.length) {
      const clock = explicit.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
      const currentClock = current?.childUpdatedAt?.[id] ?? current?.updatedAt ?? EPOCH;
      const currentGroup = currentGroups.groups.get(id) ?? [];
      const incomingGroup = incomingGroupFor(id);
      const metadataChanged = currentGroup.length === 1 && incomingGroup.length === 1 &&
        childKey(currentGroup[0]) !== childKey(incomingGroup[0]);
      // Migration window for an already-open pre-v5 tab: it may echo the field
      // clock it received from the account, then edit name/age while only moving
      // whole-profile updatedAt. Promote that edit only when the echoed field
      // clock still exactly equals the account's current field clock. A stale tab
      // whose metadata lost a later race has an older field clock and cannot win.
      if (metadataChanged && Date.parse(clock) === Date.parse(currentClock) &&
          Date.parse(incoming?.updatedAt ?? EPOCH) > Date.parse(clock))
        return incoming.updatedAt;
      return clock;
    }
    // Once the account has an explicit metadata clock, an old browser with no
    // such clock cannot override it merely because it read a story later.
    if (current?.childUpdatedAt?.[id]) return EPOCH;
    return incoming?.updatedAt ?? EPOCH;
  };
  const currentClockFor = (id: string) => current?.childUpdatedAt?.[id] ?? current?.updatedAt ?? EPOCH;

  const out: any[] = [];
  const childUpdatedAt: Record<string, string> = {};
  for (const id of ids) {
    const a = currentGroups.groups.get(id) ?? [], b = incomingGroupFor(id);
    const ca = currentClockFor(id), cb = incomingClockFor(id);
    childUpdatedAt[id] = later(ca, cb) ?? ca;
    if (!a.length) { out.push(...b.map(c => ({ ...c, id }))); continue; }
    if (!b.length) { out.push(...a); continue; }
    if (conflicting(a) || conflicting(b)) {
      const variants = new Map<string, any>();
      for (const c of [...a, ...b]) if (!variants.has(childKey(c))) variants.set(childKey(c), { ...c, id });
      out.push(...variants.values());
    } else {
      out.push({ ...(Date.parse(cb) > Date.parse(ca) ? b.at(-1)! : a.at(-1)!), id });
    }
  }
  return { children: out, childUpdatedAt, remapIncoming };
}

export function reconcileStored(current: any | null, incoming: any) {
  const deletedChildren = deletionsOf(current, incoming);
  const retiredChildReasons = retiredReasonsOf(current, incoming);
  const reconciled = reconcileChildren(current, incoming, deletedChildren);
  const children = reconciled.children;
  const to = (id: string) => reconciled.remapIncoming[id] ?? id;
  const heard = unionHistory(current?.heard, incoming.heard, deletedChildren, (a, b) => a < b ? a : b, to);
  const again = unionHistory(current?.again, incoming.again, deletedChildren, (a, b) => a > b ? a : b, to);

  let quarantinedHistory = mergeQuarantined(current?.quarantinedHistory, incoming?.quarantinedHistory);
  // Only repaired ids quarantine later stale activity. A deliberate child deletion
  // is allowed to discard later writes from a tab that should have refreshed.
  for (const [oldId, reason] of Object.entries(current?.retiredChildReasons ?? {}) as [string, string][]) {
    if (reason !== 'repaired') continue;
    const h = incoming?.heard?.[oldId] ?? {}, a = incoming?.again?.[oldId] ?? {};
    if (!Object.keys(h).length && !Object.keys(a).length) continue;
    quarantinedHistory = mergeQuarantined(quarantinedHistory, {
      [oldId]: { heard: h, again: a, reason: 'retired-child-id', capturedAt: new Date().toISOString() }
    });
  }

  const currentGateClock = profileClock(current, current?.gateUpdatedAt);
  let incomingGateClock = incoming?.gateUpdatedAt ?? (current?.gateUpdatedAt ? EPOCH : incoming?.updatedAt ?? EPOCH);
  if (current?.gateUpdatedAt && incoming?.gateUpdatedAt && incoming.gate !== current?.gate &&
      Date.parse(incoming.gateUpdatedAt) === Date.parse(current.gateUpdatedAt) &&
      Date.parse(incoming?.updatedAt ?? EPOCH) > Date.parse(incoming.gateUpdatedAt))
    incomingGateClock = incoming.updatedAt;
  const gate = Date.parse(incomingGateClock) > Date.parse(currentGateClock) ? incoming.gate : (current?.gate ?? incoming.gate);
  const gateUpdatedAt = later(currentGateClock, incomingGateClock);

  const currentActiveClock = profileClock(current, current?.activeUpdatedAt);
  let incomingActiveClock = incoming?.activeUpdatedAt ?? (current?.activeUpdatedAt ? EPOCH : incoming?.updatedAt ?? EPOCH);
  if (current?.activeUpdatedAt && incoming?.activeUpdatedAt && incoming.activeId !== current?.activeId &&
      Date.parse(incoming.activeUpdatedAt) === Date.parse(current.activeUpdatedAt) &&
      Date.parse(incoming?.updatedAt ?? EPOCH) > Date.parse(incoming.activeUpdatedAt))
    incomingActiveClock = incoming.updatedAt;
  const incomingActive = incoming.activeId ? to(incoming.activeId) : null;
  const preferredActive = Date.parse(incomingActiveClock) > Date.parse(currentActiveClock) ? incomingActive : current?.activeId;
  const fallbackActive = preferredActive === incomingActive ? current?.activeId : incomingActive;
  const activeId = preferredActive && children.some((c: any) => c.id === preferredActive) ? preferredActive :
    (fallbackActive && children.some((c: any) => c.id === fallbackActive) ? fallbackActive : (children[0]?.id ?? null));
  const activeUpdatedAt = later(currentActiveClock, incomingActiveClock);

  const firstNight = Object.values(heard).flatMap((n: any) => Object.values(n as Record<string, string>)).sort()[0] ?? null;
  return {
    ...incoming,
    children,
    childUpdatedAt: reconciled.childUpdatedAt,
    activeId,
    activeUpdatedAt,
    gate,
    gateUpdatedAt,
    heard,
    again,
    deletedChildren,
    retiredChildReasons,
    quarantinedHistory,
    firstNight,
    updatedAt: later(current?.updatedAt, incoming?.updatedAt) ?? incoming?.updatedAt ?? current?.updatedAt
  };
}

function safeStored(data: any | null) {
  if (!data) return null;
  // Reconcile the object with itself to materialize legacy clocks without making
  // any semantic change or mutating storage on GET.
  return reconcileStored(null, data);
}

/** Atomic compare-and-swap write. Every conflict re-reads and re-reconciles. */
export async function writeReconciled(store: any, key: string, incoming: any, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const snapshot = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
    const current = snapshot?.data ?? null;
    const safe = reconcileStored(current, incoming);
    if (JSON.stringify(safe).length > 512_000) throw new Error('profile too large after reconciliation');

    if (current && !snapshot?.etag) throw new Error('profile read returned no etag');
    const result = current
      ? await store.setJSON(key, safe, { onlyIfMatch: snapshot.etag })
      : await store.setJSON(key, safe, { onlyIfNew: true });

    // Netlify issue #741: some failed conditional writes have reported
    // { modified: true, etag: '' }. A real successful write always has an ETag.
    if (result?.modified && result?.etag) return safe;
    if (result?.modified && !result?.etag) throw new Error('conditional profile write was not acknowledged');
    // modified:false is an ordinary CAS conflict; loop and merge against the winner.
  }
  throw new Error('profile changed repeatedly while saving');
}

export default async (req: Request, _ctx: Context) => {
  const session = await readSession(req);
  if (!session) return Response.json({ error: 'not signed in' }, { status: 401 });
  const store = getStore({ name: 'profiles', consistency: 'strong' });
  const key = keyFor(session);

  if (req.method === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return Response.json({
      account: { id: await accountId(session), email: session.email ?? null, kind: session.kind },
      profile: safeStored(data)
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'PUT') {
    let incoming: any;
    try { incoming = await req.json(); } catch { return Response.json({ error: 'bad json' }, { status: 400 }); }
    if (!incoming || incoming.v !== 1) return Response.json({ error: 'unknown profile version' }, { status: 400 });
    if (JSON.stringify(incoming).length > 512_000) return Response.json({ error: 'too large' }, { status: 413 });
    try {
      return Response.json({ profile: await writeReconciled(store, key, incoming) });
    } catch (e) {
      console.error('profile write failed', e);
      return Response.json({ error: 'could not safely save profile' }, { status: 503 });
    }
  }

  if (req.method === 'DELETE') {
    await store.delete(key);
    return Response.json({ deleted: true });
  }
  return new Response('method not allowed', { status: 405 });
};

export const config = { path: '/api/profile' };
