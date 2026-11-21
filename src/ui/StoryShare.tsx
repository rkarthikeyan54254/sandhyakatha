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
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <button onClick={() => void copyLink()}>{labels.copy}</button>
      <button onClick={() => void share()}>{copy.share}</button>
    </div>
    <p role="status">{state === 'copied' ? copy.copied : state === 'failed' ? labels.failed : ''}</p>
  </section>;
}
