import type { Context } from '@netlify/functions';

/** What this deploy can actually offer. Sign-in that is not configured should
 *  say so in the panel, not fail after a redirect. */
export default async (_req: Request, _ctx: Context) =>
  Response.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    code: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32)
  }, { headers: { 'Cache-Control': 'no-store' } });

export const config = { path: '/api/config' };
