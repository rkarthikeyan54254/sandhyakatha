/**
 * Sessions, without a vendor.
 *
 * A signed cookie this site issues itself. Google is the identity provider and
 * nothing else — the OAuth exchange happens server-side, so no Google script is
 * ever loaded in the page and Google never sees a visitor who does not sign in.
 * That is the difference between using an identity provider and embedding one.
 */
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'sk_session';
const DAYS = 60;

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET is missing or under 32 characters');
  return new TextEncoder().encode(s);
};

export interface Session { sub: string; email?: string; kind: 'google' | 'code' }

export async function issue(s: Session) {
  return new SignJWT({ email: s.email, kind: s.kind })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(secret());
}

export async function readSession(req: Request): Promise<Session | null> {
  const raw = (req.headers.get('cookie') ?? '')
    .split(';').map(c => c.trim()).find(c => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(decodeURIComponent(raw), secret());
    return { sub: payload.sub as string, email: payload.email as string | undefined, kind: payload.kind as Session['kind'] };
  } catch { return null; }
}

export const setCookie = (token: string) =>
  `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${DAYS * 86400}`;
export const clearCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

/** The blob key a session owns. Kinds are namespaced so a recovery code can
 *  never collide with a Google subject. */
export const keyFor = (s: Session) => `${s.kind}:${s.sub}`;

/**
 * An opaque, stable id for the account, safe to keep on the device.
 *
 * The device needs to know WHICH account its local copy belongs to, or a second
 * family signing in on the same browser inherits the first one's children. It
 * does not need to know the Google subject to answer that, so this is a hash:
 * enough to compare, nothing to leak out of localStorage.
 */
export async function accountId(s: Session): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sk:' + keyFor(s)));
  return [...new Uint8Array(digest)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
