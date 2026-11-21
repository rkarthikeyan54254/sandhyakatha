import { useState } from 'react';
import { localeUi, type AppLocale } from '../lib/app-locale';

/** Share only an editorial route, never the visitor's query string or family state. */
export default function StoryShare({ title, href, locale }: { title: string; href: string; locale: AppLocale }) {
  const copy = localeUi(locale).reader;
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const labels = locale === 'hi-IN'
    ? { copy: 'लिंक कॉपी करें', failed: 'लिंक कॉपी नहीं हुआ। फिर कोशिश करें।' }
    : locale === 'ta-IN'
    ? { copy: 'இணைப்பை நகலெடுக்கவும்', failed: 'இணைப்பை நகலெடுக்க முடியவில்லை. மீண்டும் முயலவும்.' }
    : { copy: 'Copy link', failed: 'Could not copy the link. Please try again.' };
  const url = new URL(href, 'https://sandhyakatha.com');
  const text = `${title}\n${url.href}`;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url.href);
      setState('copied');
    } catch { setState('failed'); }
  }
  async function share() {
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, url: url.href }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    await copyLink();
  }
  return <section className="story-share" aria-label={copy.share}>
    <p className="eyebrow">{copy.share}</p>
    <div className="story-share-actions">
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><ShareIcon kind="whatsapp" />WhatsApp</a>
      <button onClick={() => void copyLink()}><ShareIcon kind="copy" />{labels.copy}</button>
      <button onClick={() => void share()}><ShareIcon kind="share" />{copy.share}</button>
    </div>
    <p role="status">{state === 'copied' ? copy.copied : state === 'failed' ? labels.failed : ''}</p>
  </section>;
}


function ShareIcon({ kind }: { kind: 'whatsapp' | 'copy' | 'share' }) {
  return <svg className="shareicon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {kind === 'copy' ? <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>
      : kind === 'share' ? <><path d="M12 16V3m-5 5 5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></>
      : <><path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.5-4.7A9 9 0 1 1 21 11.5Z" /><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 3-4 2-7-1S6 9 8 7Z" /></>}
  </svg>;
}
