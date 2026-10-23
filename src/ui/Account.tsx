import { accountCopy } from './account-copy';
import type { AppLocale } from '../lib/app-locale';
import { useEffect, useState } from 'react';
import { signInWithGoogle, createRecoveryCode, useRecoveryCode, authConfig,
         type AuthConfig, type Account as Acct } from '../lib/sync';
import { track } from '../lib/track';

export default function Account({ account, syncing, pending, nudge, onChanged, onSignOut, locale = 'en' }: {
  locale?: AppLocale; account: Acct | null; syncing: boolean; pending: boolean; nudge: boolean; onChanged: () => void;
  onSignOut: () => Promise<'ok' | 'unsaved'>;
}) {
  const copy = accountCopy(locale);
  const [cfg, setCfg] = useState<AuthConfig | null>(null);
  const [mode, setMode] = useState<'none' | 'code'>('none');
  const [code, setCode] = useState('');
  const [made, setMade] = useState<string | null>(null);
  const [err, setErr] = useState<'unconfigured' | 'unsaved' | 'createError' | 'codeError' | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void authConfig().then(setCfg); }, [account]);
  useEffect(() => {
    if (new URL(window.location.href).searchParams.get('signin') === 'unconfigured')
      setErr('unconfigured');
  }, []);

  if (account) return (
    <div className="account in">
      <p><b>{copy.signedIn}</b>{account.email ? ` · ${account.email}` : ` · ${copy.withCode}`}. {syncing ? copy.syncing : pending ? copy.pending : copy.backedUp}</p>
      <p className="fine">{copy.signOutDetail}</p>
      <button className="linkbtn" disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        const r = await onSignOut();
        setBusy(false);
        if (r === 'unsaved')
          setErr('unsaved');
      }}>{busy ? copy.signingOut : copy.signOut}</button>
      {err && <p className="err">{copy[err]}</p>}
    </div>
  );

  if (cfg && !cfg.google && !cfg.code) return (
    <div className="account">
      <p className="lede">{copy.unavailable}</p>
      <p>{copy.unavailableDetail}</p>
    </div>
  );

  return (
    <div className={'account' + (nudge ? ' nudge' : '')}>
      <p className="lede">{nudge ? copy.keepSafe : copy.keepHistory}</p>
      <p>{copy.signInDetail}</p>

      {cfg?.google !== false && (
        <button className="google" disabled={!cfg} onClick={() => { track('signin_started', { method: 'google' }); signInWithGoogle(); }}>
          <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.8H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"/>
            <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/>
            <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
          </svg>
          {cfg ? copy.google : copy.checking}
        </button>
      )}

      {cfg?.code && mode === 'none' &&
        <button className="linkbtn" onClick={() => setMode('code')}>{copy.alternate}</button>}

      {mode === 'code' && !made && (
        <div className="codebox">
          <p>{copy.codeDetail}</p>
          <button className="ghost" disabled={busy} onClick={async () => {
            setBusy(true); setErr(null);
            try { setMade(await createRecoveryCode()); onChanged(); }
            catch { setErr('createError'); }
            finally { setBusy(false); }
          }}>{copy.create}</button>
          <form className="emailrow" onSubmit={async e => {
            e.preventDefault(); setBusy(true); setErr(null);
            try { await useRecoveryCode(code); onChanged(); }
            catch { setErr('codeError'); }
            finally { setBusy(false); }
          }}>
            <input aria-label={copy.codeLabel} value={code} placeholder="lamp-squirrel-482193-…" onChange={e => setCode(e.target.value)} />
            <button type="submit" disabled={busy || !code.trim()}>{copy.use}</button>
          </form>
        </div>
      )}

      {made && (
        <div className="codebox made">
          <p className="lede">{copy.writeDown}</p>
          <code>{made}</code>
          <p>{copy.madeDetail}</p>
        </div>
      )}

      {err && <p className="err">{copy[err]}</p>}
      <p className="fine">{copy.privacy}</p>
    </div>
  );
}
