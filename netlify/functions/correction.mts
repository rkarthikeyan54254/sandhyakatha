import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

/**
 * "Something isn't right here."
 *
 * The most valuable reviewer this project will ever have is a grandmother who
 * knows the story better than we do. This is the only way she can tell us.
 *
 * Deliberately anonymous: no name, no email, no account, nothing joined to a
 * reading history. We take a story id, the version it was reported against —
 * so a correction against text we have since changed is obvious — and what the
 * person typed. If they put personal details in the note anyway, that is the
 * one thing we hold, and PRIVACY.md says what happens to it.
 *
 * POST /api/correction        { storyId, version, note }
 * GET  /api/correction         everything, for whoever holds CORRECTIONS_KEY,
 *                              sent as `Authorization: Bearer <key>`.
 *
 * The key goes in a header, never a query string. A query string is written to
 * Netlify's access log, kept in shell history, and handed to every proxy in
 * between; a header is not logged. Compared in constant time so that a wrong
 * key cannot be found one character at a time by timing the replies.
 */
const MAX_NOTE = 2000;

/** Constant-time compare. Length is allowed to leak; the bytes are not. */
const sameSecret = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export default async (req: Request, _ctx: Context) => {
  const store = getStore({ name: 'corrections', consistency: 'strong' });

  if (req.method === 'GET') {
    const auth = req.headers.get('authorization') ?? '';
    const key = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim() ?? '';
    const expected = process.env.CORRECTIONS_KEY ?? '';
    if (expected.length < 16 || !sameSecret(key, expected))
      return new Response('not found', { status: 404 });
    const { blobs } = await store.list();
    const out = [];
    for (const b of blobs) {
      const v = await store.get(b.key, { type: 'json' });
      if (v) out.push({ key: b.key, ...(v as object) });
    }
    out.sort((a: any, b: any) => (a.at < b.at ? 1 : -1));
    return Response.json({ count: out.length, corrections: out },
      { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  let body: { storyId?: string; version?: number; note?: string; hp?: string };
  try { body = await req.json(); } catch { return Response.json({ error: 'bad json' }, { status: 400 }); }

  // A field no human sees and no human fills in.
  if (body.hp) return Response.json({ ok: true });

  const storyId = String(body.storyId ?? '').trim();
  const note = String(body.note ?? '').trim();
  if (!/^[a-z0-9-]{3,60}$/.test(storyId))
    return Response.json({ error: 'unknown story' }, { status: 400 });
  if (note.length < 4) return Response.json({ error: 'tell us what is wrong' }, { status: 400 });
  if (note.length > MAX_NOTE) return Response.json({ error: 'too long' }, { status: 413 });

  const at = new Date().toISOString();
  const rand = crypto.getRandomValues(new Uint8Array(4));
  const key = `${storyId}/${at}-${Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  await store.setJSON(key, {
    storyId, at, note,
    version: Number.isFinite(body.version) ? Number(body.version) : null,
    // Coarse enough to spot a flood, useless for identifying anybody.
    country: req.headers.get('x-nf-geo') ? JSON.parse(req.headers.get('x-nf-geo')!)?.country?.code ?? null : null
  });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/correction' };
