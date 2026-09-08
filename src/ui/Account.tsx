import { useState } from 'react';
import { syncConfigured, signInWithGoogle, signInWithEmail, signOut, type Account as Acct } from '../lib/sync';

export default function Account({ account, syncing, nudge }: { account: Acct | null; syncing: boolean; nudge: boolean }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  if (!syncConfigured) return null;

  if (account) return (
    <div className="account in">
      <p><b>Signed in</b>{account.email ? ` as ${account.email}` : ''}. {syncing ? 'Syncing…' : 'Everything is backed up.'}</p>
      <button className="linkbtn" onClick={() => signOut()}>Sign out</button>
    </div>
  );

  return (
    <div className={'account' + (nudge ? ' nudge' : '')}>
      <p className="lede">{nudge
        ? 'Keep this safe.'
        : 'Right now this lives only in this browser.'}</p>
      <p>Clearing your history, or picking up a different phone, starts the constellation over.
        Signing in keeps it — and puts it on every device you read from.</p>
      <button className="google" onClick={() => signInWithGoogle()}>
        <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.8H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"/>
          <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/>
          <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
        </svg>
        Continue with Google
      </button>

      {!showEmail && <button className="linkbtn" onClick={() => setShowEmail(true)}>Use an email link instead</button>}
      {showEmail && (sent
        ? <p className="ok">Check {email} — the link signs you in, there is no password.</p>
        : <form className="emailrow" onSubmit={async e => {
            e.preventDefault();
            try { await signInWithEmail(email); setSent(true); setErr(null); }
            catch { setErr('That did not go through. Check the address and try again.'); }
          }}>
            <input type="email" required value={email} placeholder="you@example.com"
                   onChange={e => setEmail(e.target.value)} />
            <button type="submit">Send</button>
          </form>)}
      {err && <p className="err">{err}</p>}
      <p className="fine">We store a first name, an age, and which stories were read. Nothing else,
        and nothing is shared onward.</p>
    </div>
  );
}
