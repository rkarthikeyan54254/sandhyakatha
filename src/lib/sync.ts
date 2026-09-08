/**
 * Optional account sync — served by this site's own functions.
 *
 * No third-party SDK in the page and no vendor dashboard: sessions are an
 * HttpOnly cookie this site issues, and the family's row lives in Netlify's
 * key-value store. The browser never holds a token, so nothing to leak from
 * localStorage and nothing to refresh.
 *
 * The app is fully usable signed out — that is the point. A sign-in wall in
 * front of a bedtime story is how you lose the parent who came to try one.
 */
import type { Profile } from './profile';
import { merge } from './profile';

export interface Account { email: string | null; kind: 'google' | 'code' }

/** The functions are always deployed; a 401 simply means "not signed in". */
export const syncConfigured = true;

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { credentials: 'same-origin', ...init });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.status === 204 ? {} : await r.json();
}

/** Signed in? Returns the account and whatever the server holds. */
export async function currentAccount(): Promise<{ account: Account; profile: Profile | null } | null> {
  try {
    const d = await api('/api/profile');
    return d ? { account: d.account as Account, profile: (d.profile as Profile | null) ?? null } : null;
  } catch { return null; }
}

export function signInWithGoogle() { window.location.href = '/api/auth/start'; }

/** Creates an account with no identity attached. Returns the code to keep. */
export async function createRecoveryCode(): Promise<string> {
  const r = await fetch('/api/code', { method: 'POST', credentials: 'same-origin' });
  if (!r.ok) throw new Error('could not create a code');
  return (await r.json()).code as string;
}

export async function useRecoveryCode(code: string): Promise<void> {
  const r = await fetch('/api/code', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code })
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'that code did not work');
}

export async function signOut() {
  await fetch('/api/signout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
}

/** Merge this device with the account copy, then write the result back. */
export async function syncProfile(local: Profile): Promise<Profile> {
  const d = await api('/api/profile');
  if (!d) return local;                       // signed out — nothing to do
  const merged = d.profile ? merge(local, d.profile as Profile) : local;
  const put = await api('/api/profile', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(merged)
  });
  // A stale write is answered with the server's copy; take it rather than argue.
  return (put?.stale ? merge(merged, put.profile as Profile) : merged);
}
