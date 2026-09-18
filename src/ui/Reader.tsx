import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Lexicon, Story, Card } from '../lib/types';
import { displayTerm } from '../lib/lexicon';
import { localeUi, type AppLocale, type ReaderUi } from '../lib/app-locale';

type Said = { term: string; rect: DOMRect } | null;

function placeVars(rect: DOMRect): React.CSSProperties {
  const W = 320, M = 16;
  const left = Math.min(Math.max(M, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - M);
  const above = rect.top > 190;
  return {
    '--pop-left': `${left}px`,
    '--pop-top': above ? 'auto' : `${rect.bottom + 10}px`,
    '--pop-bottom': above ? `${window.innerHeight - rect.top + 10}px` : 'auto',
  } as React.CSSProperties;
}

export default function Reader({ story, lex, len, next, tomorrow, readBefore, hasProfile,
  locale = 'en', onBack, onHeard, onRead, onPersonalize, backLabel = 'Tonight' }: {
  story: Story; lex: Lexicon; len: 'short' | 'full' | 'more';
  next: Card | null; tomorrow?: { story: Card; reason: string } | null; readBefore?: boolean;
  hasProfile: boolean; locale?: AppLocale;
  onBack: () => void; onHeard: (id: string) => void; onRead: (id: string) => void;
  onPersonalize: (age: number) => void;
  backLabel?: string;
}) {
  const ui = localeUi(locale);
  const copy = ui.reader;
  const localized = locale !== 'en';
  const [say, setSay] = useState<Said>(null);
  const [ask, setAsk] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [age, setAge] = useState(8);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const completionGuard = useRef(false);
  const key = localized ? 'short' : (len === 'short' ? 'short' : 'full');
  const r = story.lengths[key] ?? story.lengths.short ?? story.lengths.full;
  const heardLabel = localized
    ? `${copy.reviewedEdition} · ${r.minutes} ${copy.minutes}`
    : `${key === 'short' ? 'Short' : 'Full'} · ${r.minutes} min`;
  const canShare = !story.audience.gated;

  function completeStory() {
    if (completionGuard.current) return;
    completionGuard.current = true;
    onHeard(story.id);
    setCompleted(true);
  }

  async function shareStory() {
    const url = new URL(story.publicPath ?? `/s/${story.id}/`, window.location.origin);
    url.searchParams.set('utm_source', 'parent_share');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'story');
    url.searchParams.set('utm_content', `${story.id}_${locale}`);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${story.title} · Sandhya Katha`,
          text: `🌙 ${story.title}\n\n${story.tease}`,
          url: url.toString()
        });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString());
        setShareState('copied');
      }
    } catch {}
  }

  const line = (text: string) => (
    <Line text={text} lex={lex} displayNames={story.displayNames} onSay={setSay} />
  );

  return (
    <>
      <div className="readtop">
        <button className="back" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 10H5M9 6l-4 4 4 4" /></svg> {backLabel}
        </button>
        <span className="spacer" /><span className="len">{heardLabel}</span>
      </div>

      <article className="story" lang={ui.language}>
        <h1>{story.title}</h1>
        <div className="attrib">
          <p className="s"><b>{story.source.work}</b> — {story.source.locus}</p>
          {story.source.traditionNote && <p className="trad"><b>{copy.traditionNote}</b> {line(story.source.traditionNote)}</p>}
          {story.audience.careNote && <p className="care"><b>{copy.beforeBegin}</b> {line(story.audience.careNote)}</p>}
          {readBefore && <p className="again"><b>{copy.readBefore}</b></p>}
        </div>

        {story.hero && (
          <figure className="storyart readerart">
            <img src={story.hero} alt={`${copy.illustration}: ${story.title}`} loading="eager" decoding="async" />
            <figcaption>{copy.illustration}</figcaption>
          </figure>
        )}

        <div className="prose">
          {r.blocks.map((b, i) => b.t === 'beat'
            ? <div className="beat" key={i}><span>{copy.pause}</span></div>
            : b.t === 'aside'
            ? <aside className="note" key={i}>
                <span>{copy.aside}</span>
                <p>{line(b.text!)}</p>
              </aside>
            : <p key={i} className={b.t === 'slow' ? 'slow' : ''}>
                {b.t === 'slow' && <span className="slowtag">{copy.pause}</span>}
                {line(b.text)}
              </p>)}
        </div>

        <section className="turn">
          <span className="eyebrow">{copy.turn}</span>
          <p className="q">{line(story.close.question)}</p>
          <p className="seed">{copy.seedPrefix} <b>{line(story.close.seed)}</b></p>
          {story.close.ifTheyAsk?.map((f, i) => (
            <div className="disclose" key={i}>
              <button onClick={() => setAsk(ask === i ? null : i)} aria-expanded={ask === i}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" style={{ transform: ask === i ? 'rotate(180deg)' : undefined }}><path d="M6 8l4 4 4-4" /></svg>
                {copy.askPrefix} “{line(f.q)}”
              </button>
              {ask === i && <p className="ans">{line(f.a)}</p>}
            </div>
          ))}
          {!completed && (
            <button className="mark" onClick={completeStory}>
              {readBefore ? copy.markAgain : copy.mark}
            </button>
          )}
        </section>

        {!localized && len === 'more' && next && (
          <button className="onemore" onClick={() => onRead(next.id)}>
            <span className="eyebrow">One more, because they asked</span>
            <h3>{next.title}</h3>
            <p>{next.tease}</p>
            {story.linked?.next === next.id && <p className="link">Linked to tonight's: {story.linked.reason}.</p>}
          </button>
        )}

        {completed && (
          <section className="afterread" aria-live="polite">
            <p className="saved"><b>{hasProfile ? copy.saved : copy.complete}</b></p>

            {!hasProfile && (
              <div className="afterage">
                <p><b>{copy.personalize}</b></p>
                <div className="agerow">
                  <label>
                    <span>{copy.age}</span>
                    <input type="number" min={3} max={15} value={age}
                           onChange={e => setAge(+e.target.value)} />
                  </label>
                  <button onClick={() => onPersonalize(age)}>{copy.chooseTomorrow}</button>
                </div>
              </div>
            )}

            {hasProfile && tomorrow && (
              <aside className="tomorrow">
                <span className="eyebrow">{copy.tomorrow}</span>
                <h3>{tomorrow.story.title}</h3>
                <p>{tomorrow.story.tease}</p>
                <p className="why">{localized ? ui.reviewedPick : `Chosen because ${tomorrow.reason}.`}</p>
              </aside>
            )}

            {canShare && (
              <button className="begin sharebtn" onClick={shareStory}>
                <svg className="shareicon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 16V4" />
                  <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
                  <path d="M5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7" />
                </svg>
                <span>{shareState === 'copied' ? copy.copied : copy.share}</span>
              </button>
            )}

            <button className="mark" onClick={onBack}>{copy.done}</button>
          </section>
        )}

        <Wrong id={story.id} version={story.version} copy={copy} />
      </article>

      {say && createPortal(
        <button className="pop" style={placeVars(say.rect)} onClick={() => setSay(null)}>
          <b>{lex[say.term]?.say}</b>
          <span>{lex[say.term]?.gloss}</span>
          {lex[say.term]?.native?.taml
            ? <i>{lex[say.term].native.taml}</i>
            : lex[say.term]?.native?.deva && <i>{lex[say.term].native.deva}</i>}
        </button>, document.body)}
    </>
  );
}

function Line({ text, lex, displayNames, onSay }: {
  text: string;
  lex: Lexicon;
  displayNames?: Record<string,string>;
  onSay: (s: Said) => void;
}) {
  const parts = text.split(/(«[^»]+»|_[^_]+_)/g).filter(Boolean);
  return <>{parts.map((p, i) => {
    if (p.startsWith('«')) {
      const t = p.slice(1, -1);
      return <button key={i} className="name" title={lex[t]?.say}
                     onClick={e => onSay({ term: t, rect: e.currentTarget.getBoundingClientRect() })}>
        {displayNames?.[t] ?? displayTerm(lex, t)}
      </button>;
    }
    if (p.startsWith('_')) return <em key={i}>
      <Line text={p.slice(1, -1)} lex={lex} displayNames={displayNames} onSay={onSay} />
    </em>;
    return <span key={i}>{p}</span>;
  })}</>;
}

function Wrong({ id, version, copy }: { id: string; version: number; copy: ReaderUi }) {
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  if (state === 'sent') return (
    <aside className="wrong done"><p>{copy.wrongThanks}</p></aside>
  );

  return (
    <details className="wrong">
      <summary>{copy.wrongSummary}</summary>
      <form onSubmit={async e => {
        e.preventDefault();
        if (note.trim().length < 4) return;
        setState('sending');
        try {
          const r = await fetch('/api/correction', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ storyId: id, version, note: note.trim() })
          });
          setState(r.ok ? 'sent' : 'failed');
        } catch { setState('failed'); }
      }}>
        <p>{copy.wrongPrompt}</p>
        <textarea rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)}
                  placeholder={copy.wrongPlaceholder} />
        <button type="submit" disabled={state === 'sending' || note.trim().length < 4}>
          {state === 'sending' ? copy.wrongSending : state === 'failed' ? copy.wrongFailed : copy.wrongSend}
        </button>
      </form>
    </details>
  );
}
