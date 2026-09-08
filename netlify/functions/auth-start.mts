import type { Context } from '@netlify/functions';

/** Redirect the parent to Google. No Google script runs in our page. */
export default async (req: Request, _ctx: Context) => {
  // Back into the app with a reason, rather than a bare error page in a tab the
  // parent now has to get themselves out of.
  const unconfigured = new Response(null, { status: 302, headers: { Location: '/?signin=unconfigured' } });
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return unconfigured;
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return unconfigured;

  const origin = new URL(req.url).origin;
  const state = crypto.randomUUID();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', id);
  url.searchParams.set('redirect_uri', `${origin}/api/auth/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email');   // openid + email. Not profile, not anything else.
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': `sk_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    }
  });
};

export const config = { path: '/api/auth/start' };
