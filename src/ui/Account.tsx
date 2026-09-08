import { useEffect, useState } from 'react';
import { signInWithGoogle, signOut, createRecoveryCode, useRecoveryCode, authConfig,
         type AuthConfig, type Account as Acct } from '../lib/sync';
import { track } from '../lib/track';

export default function Account({ account, syncing, nudge, onChanged }: {
  account: Acct | null; syncing: boolean; nudge: boolean; onChanged: () => void;
}) {
  const [cfg, setCfg] = useState<AuthConfig | null>(null);
  const [mode, setMode] = useState<'none' | 'code'>('none');
  const [code, setCode] = useState('');
  const [made, setMade] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void authConfig().then(setCfg); }, [account]);
  useEffect(() => {
    if (new URL(window.location.href).searchParams.get('signin') === 'unconfigured')
      setErr('Sign-in is not switched on for this site yet.');
  }, []);

  if (account) return (
    <div className="account in">
      <p><b>Signed in</b>{account.email ? ` as ${account.email}` : ' with a recovery code'}. {syncing ? 'Syncing…' : 'Everything is backed up.'}</p>
      <button className="linkbtn" onClick={async () => { await signOut(); onChanged(); }}>Sign out</button>
    </div>
  );

  if (cfg && !cfg.google && !cfg.code) return (
    <div className="account">
      <p className="lede">Not switched on yet.</p>
      <p>This history lives in this browser only. Backing it up needs a one-time setup on the site —
        see <code>docs/SETUP-ACCOUNTS.md</code>. Everything else works exactly as it does now.</p>
    </div>
  );

  return (
    <div className={'account' + (nudge ? ' nudge' : '')}>
      <p className="lede">{nudge ? 'Keep this safe.' : 'Right now this lives only in this browser.'}</p>
      <p>Clearing your history, or picking up a different phone, starts the constellation over.
        Signing in keeps it — and puts it on every device you read from.</p>

      {cfg?.google !== false && (
        <button className="google" disabled={!cfg} onClick={() => { track('signin_started', { method: 'google' }); signInWithGoogle(); }}>
          <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.8H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"/>
            <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/>
            <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
          </svg>
          {cfg ? 'Continue with Google' : 'Checking…'}
        </button>
      )}

      {cfg?.code && mode === 'none' &&
        <button className="linkbtn" onClick={() => setMode('code')}>Rather not use Google?</button>}

      {mode === 'code' && !made && (
        <div className="codebox">
          <p>A recovery code is an account with no name attached. We never learn who you are —
            but if you lose the code, we cannot get the history back for you. Write it down.</p>
          <button className="ghost" disabled={busy} onClick={async () => {
            setBusy(true); setErr(null);
            try { setMade(await createRecoveryCode()); onChanged(); }
            catch { setErr('Could not create a code. Try again in a moment.'); }
            finally { setBusy(false); }
          }}>Create a recovery code</button>
          <form className="emailrow" onSubmit={async e => {
            e.preventDefault(); setBusy(true); setErr(null);
            try { await useRecoveryCode(code); onChanged(); }
            catch (x) { setErr(x instanceof Error ? x.message : 'That code did not work.'); }
            finally { setBusy(false); }
          }}>
            <input value={code} placeholder="lamp-squirrel-482193-…" onChange={e => setCode(e.target.value)} />
            <button type="submit" disabled={busy || !code.trim()}>Use</button>
          </form>
        </div>
      )}

      {made && (
        <div className="codebox made">
          <p className="lede">Write this down now.</p>
          <code>{made}</code>
          <p>It is the only way back to this history. There is no reset, because there is nothing
            we know about you to reset it against.</p>
        </div>
      )}

      {err && <p className="err">{err}</p>}
      <p className="fine">We store a first name, an age, and which stories were read. Nothing else,
        and nothing is shared onward.</p>
    </div>
  );
}
