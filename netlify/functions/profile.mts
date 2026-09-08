import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { readSession, keyFor } from '../lib/session.mts';

/**
 * The family's row. One JSON blob per account, in Netlify's own key-value
 * store — no extra vendor, no extra bill, and it lives beside the site it
 * belongs to.
 *
 * What is stored: a first name the parent typed, an age, which stories were
 * read and on what night, and the difficult-stories setting. See PRIVACY.md
 * before adding anything.
 */
export default async (req: Request, _ctx: Context) => {
  const session = await readSession(req);
  if (!session) return Response.json({ error: 'not signed in' }, { status: 401 });

  const store = getStore({ name: 'profiles', consistency: 'strong' });
  const key = keyFor(session);

  if (req.method === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return Response.json({ account: { email: session.email ?? null, kind: session.kind }, profile: data ?? null },
      { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'PUT') {
    let incoming: any;
    try { incoming = await req.json(); } catch { return Response.json({ error: 'bad json' }, { status: 400 }); }
    if (!incoming || incoming.v !== 1) return Response.json({ error: 'unknown profile version' }, { status: 400 });
    if (JSON.stringify(incoming).length > 512_000) return Response.json({ error: 'too large' }, { status: 413 });

    // Last writer wins, but never let a stale device roll the family back.
    const current: any = await store.get(key, { type: 'json' });
    if (current?.updatedAt && incoming.updatedAt && Date.parse(incoming.updatedAt) < Date.parse(current.updatedAt))
      return Response.json({ profile: current, stale: true });

    await store.setJSON(key, incoming);
    return Response.json({ profile: incoming });
  }

  if (req.method === 'DELETE') {
    await store.delete(key);
    return Response.json({ deleted: true });
  }

  return new Response('method not allowed', { status: 405 });
};

export const config = { path: '/api/profile' };
