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
import { merge, emptyProfile } from './profile';

export interface Account { id: string; email: string | null; kind: 'google' | 'code' }

export interface AuthConfig { google: boolean; code: boolean }

/**
 * Whether this deploy can actually sign anyone in. The functions may not be
 * deployed yet at all, in which case the SPA catch-all answers with HTML and
 * the parse throws — which is the same answer: not available. The panel says
 * so plainly rather than offering a button that goes nowhere.
 */
export async function authConfig(): Promise<AuthConfig> {
  try {
    const r = await fetch('/api/config', { credentials: 'same-origin' });
    if (!r.ok) return { google: false, code: false };
    const d = await r.json();
    return { google: !!d.google, code: !!d.code };
  } catch { return { google: false, code: false }; }
}

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

/**
 * Sign out, and only then let the caller forget this device's copy.
 *
 * Signing out has to clear the local profile: a browser is shared, and leaving
 * one family's children's names on screen for whoever signs in next is not
 * acceptable for a product that keeps children's data. But clearing before the
 * last night is safely on the server would lose it, so a failed sync means we
 * stay signed in and say so, rather than trading their history for a tidy
 * screen.
 */
export async function signOut(local: Profile): Promise<'ok' | 'unsaved'> {
  try { await syncProfile(local); } catch { return 'unsaved'; }
  try {
    const r = await fetch('/api/signout', { method: 'POST', credentials: 'same-origin' });
    return r.ok ? 'ok' : 'unsaved';
  } catch { return 'unsaved'; }
}

/**
 * Reconcile this device with the account.
 *
 * The one rule that matters: a local copy belonging to a DIFFERENT account is
 * never merged and never pushed. Anonymous local state (owner null) is claimed
 * on first sign-in — that is the parent who set the app up before signing in,
 * and they should keep what they did. Anything else is another family's, and
 * the account's own copy replaces it.
 */
export async function syncProfile(local: Profile): Promise<Profile> {
  const d = await api('/api/profile');
  if (!d) return local;                       // signed out — nothing to do
  const id = (d.account as Account).id;

  if (local.owner && local.owner !== id) {
    return d.profile
      ? { ...(d.profile as Profile), owner: id }
      : { ...emptyProfile(), owner: id, updatedAt: new Date().toISOString() };
  }

  const merged: Profile = { ...(d.profile ? merge(local, d.profile as Profile) : local), owner: id };
  const put = await api('/api/profile', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(merged)
  });
  // A stale write is answered with the server's copy; take it rather than argue.
  return put?.stale ? { ...merge(merged, put.profile as Profile), owner: id } : merged;
}
