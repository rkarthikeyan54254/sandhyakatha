/**
 * PERSISTED STATE: read docs/PERSISTED-STATE-SAFETY.md before changing this file.
 *
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
import { merge, emptyProfile, tidy } from './profile';

export interface Account { id: string; email: string | null; kind: 'google' | 'code' }
export interface AuthConfig { google: boolean; code: boolean }

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

export async function currentAccount(): Promise<{ account: Account; profile: Profile | null } | null> {
  try {
    const d = await api('/api/profile');
    return d ? { account: d.account as Account, profile: (d.profile as Profile | null) ?? null } : null;
  } catch { return null; }
}

export function signInWithGoogle() { window.location.href = '/api/auth/start'; }

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
 * Sign out only after syncProfile has received a server acknowledgement. A
 * conflict that cannot be written safely is an unsaved sign-out, not permission
 * to clear the browser and hope.
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
      ? tidy({ ...(d.profile as Profile), owner: id })
      : { ...emptyProfile(), owner: id, updatedAt: new Date().toISOString() };
  }

  /*
   * Only a genuinely anonymous, unread device gets replaced wholesale by the
   * account copy. A signed-in profile with zero reading nights may still contain
   * a rename, age edit or deletion that must be merged rather than discarded.
   */
  const readNothingHere = !Object.values(local.heard ?? {}).some(n => Object.keys(n).length > 0);
  if (d.profile && readNothingHere && local.owner !== id)
    return tidy({ ...(d.profile as Profile), owner: id });

  let candidate: Profile = {
    ...(d.profile ? merge(local, d.profile as Profile, { canonicalIdsFrom: 'b' }) : tidy(local)),
    owner: id
  };

  /*
   * GET -> merge -> PUT can race another device. The server answers a stale PUT
   * with its current profile. Merge that response and retry; resolving without a
   * successful acknowledgement is not safe because sign-out may clear local
   * storage immediately afterward.
   */
  for (let attempt = 0; attempt < 3; attempt++) {
    const put = await api('/api/profile', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(candidate)
    });
    if (!put?.stale)
      return put?.profile ? tidy({ ...(put.profile as Profile), owner: id }) : candidate;
    candidate = { ...merge(candidate, put.profile as Profile, { canonicalIdsFrom: 'b' }), owner: id };
  }

  throw new Error('profile changed repeatedly while syncing');
}
