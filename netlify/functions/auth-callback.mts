import type { Context } from '@netlify/functions';
import { decodeJwt } from 'jose';
import { issue, setCookie } from '../lib/session.mts';

export default async (req: Request, _ctx: Context) => {
  const u = new URL(req.url);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const want = (req.headers.get('cookie') ?? '').split(';').map(c => c.trim())
    .find(c => c.startsWith('sk_state='))?.slice(9);

  const back = (q: string) => new Response(null,
    { status: 302, headers: { Location: `/?signin=${q}`, 'Set-Cookie': 'sk_state=; Path=/; Max-Age=0' } });

  if (!code || !state || !want || state !== want) return back('failed');

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirect_uri: `${u.origin}/api/auth/callback`,
    grant_type: 'authorization_code'
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body
  });
  if (!res.ok) return back('failed');

  // The id_token comes straight from Google's token endpoint over TLS in
  // response to our own client_secret, so its issuer is already established.
  const { id_token } = await res.json() as { id_token?: string };
  if (!id_token) return back('failed');
  const claims = decodeJwt(id_token) as { sub?: string; email?: string; email_verified?: boolean };
  if (!claims.sub) return back('failed');

  const token = await issue({ sub: claims.sub, email: claims.email, kind: 'google' });
  return new Response(null, {
    status: 302,
    headers: [
      ['Location', '/?signin=ok'],
      ['Set-Cookie', setCookie(token)],
      ['Set-Cookie', 'sk_state=; Path=/; Max-Age=0']
    ]
  });
};

export const config = { path: '/api/auth/callback' };
