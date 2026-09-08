import type { Context } from '@netlify/functions';
import { clearCookie } from '../lib/session.mts';

export default async (_req: Request, _ctx: Context) =>
  new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookie() } });

export const config = { path: '/api/signout' };
