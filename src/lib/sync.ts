/**
 * Optional account sync.
 *
 * The app is fully usable signed out — that is the point, and a sign-in wall in
 * front of a bedtime story is how you lose the parent who came to try one. What
 * an account buys is that the constellation survives a cleared cache and shows
 * up on the second device.
 *
 * Google first, because in India and among the diaspora almost everyone has a
 * Gmail account and a magic-link round trip at 8:40pm is friction a tired
 * parent will not push through. Email link stays as the quiet second option.
 * No passwords anywhere.
 *
 * Unconfigured (no env vars) every call is a no-op and the UI hides itself, so
 * the app ships and works before the backend exists.
 */
import type { Profile } from './profile';
import { merge } from './profile';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const syncConfigured = Boolean(URL_ && KEY_);

export interface Account { email: string | null; id: string }

type Client = Awaited<ReturnType<typeof make>>;
let client: Promise<Client> | null = null;

async function make() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(URL_!, KEY_!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
}
const sb = () => (client ??= make());

export async function currentAccount(): Promise<Account | null> {
  if (!syncConfigured) return null;
  const { data } = await (await sb()).auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

export async function onAuthChange(cb: (a: Account | null) => void) {
  if (!syncConfigured) return () => {};
  const { data } = (await sb()).auth.onAuthStateChange((_e, s) =>
    cb(s?.user ? { id: s.user.id, email: s.user.email ?? null } : null));
  return () => data.subscription.unsubscribe();
}

export async function signInWithGoogle() {
  if (!syncConfigured) return;
  await (await sb()).auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } }
  });
}

export async function signInWithEmail(email: string) {
  if (!syncConfigured) throw new Error('sync not configured');
  const { error } = await (await sb()).auth.signInWithOtp({
    email, options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

export async function signOut() {
  if (!syncConfigured) return;
  await (await sb()).auth.signOut();
}

/** Pull the account copy, merge it with this device's, write the result back. */
export async function syncProfile(local: Profile): Promise<Profile> {
  if (!syncConfigured) return local;
  const c = await sb();
  const { data: u } = await c.auth.getUser();
  if (!u.user) return local;

  const { data, error } = await c.from('profiles').select('data').eq('user_id', u.user.id).maybeSingle();
  if (error) throw error;

  const merged = data?.data ? merge(local, data.data as Profile) : local;
  const { error: upErr } = await c.from('profiles')
    .upsert({ user_id: u.user.id, data: merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (upErr) throw upErr;
  return merged;
}
