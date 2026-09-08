import type { Context } from '@netlify/functions';
import { issue, setCookie } from '../lib/session.mts';

/**
 * The no-Google option: an account with no identity attached to it.
 *
 * We mint 128 bits of randomness, shape it into something a parent can write
 * on the inside cover of a book, and treat it as the whole credential. Nothing
 * about the family is knowable from it, and we never learn who they are.
 *
 * POST { }          -> a new code, and a session
 * POST { code }     -> a session for an existing code
 */
const WORDS = ['lamp', 'squirrel', 'river', 'mountain', 'bridge', 'monsoon', 'jasmine', 'temple',
  'peacock', 'banyan', 'conch', 'anthill', 'mango', 'chariot', 'lotus', 'ember'];

const mint = () => {
  const b = crypto.getRandomValues(new Uint8Array(16));
  const w = (i: number) => WORDS[b[i] % WORDS.length];
  const n = ((b[2] << 16 | b[3] << 8 | b[4]) % 900000 + 100000).toString();
  return `${w(0)}-${w(1)}-${n}-${Array.from(b.slice(5, 11)).map(x => x.toString(36)).join('')}`;
};

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  let body: { code?: string } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const code = body.code?.trim();
  if (code && !/^[a-z0-9-]{20,80}$/.test(code))
    return Response.json({ error: 'That does not look like a recovery code.' }, { status: 400 });

  const value = code || mint();
  const token = await issue({ sub: value, kind: 'code' });
  return Response.json({ code: value, created: !code },
    { headers: { 'Set-Cookie': setCookie(token), 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/code' };
