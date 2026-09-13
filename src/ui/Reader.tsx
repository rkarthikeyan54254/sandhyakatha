import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Lexicon, Story, Card } from '../lib/types';

type Said = { term: string; rect: DOMRect } | null;

/**
 * Where the popover goes.
 *
 * On a phone it is a sheet at the bottom, because a thumb is already there and
 * a tooltip beside the word would sit under the hand. On a desktop the word can
 * be anywhere in a tall window, so it anchors to the word — above it where
 * there is room, below it near the top of the page.
 *
 * Two things here are deliberate, and both are scars:
 *
 * 1. The numbers are published as CSS custom properties rather than as `top`
 *    and `bottom` directly, so the phone/desktop breakpoint lives in exactly
 *    one place — the media query in styles.css. It used to live in both, in JS
 *    and in CSS, which is two things to keep in agreement and one to forget.
 *
 * 2. The popover is rendered through a portal into <body>. `position: fixed`
 *    resolves against the nearest *transformed* ancestor, not the viewport, and
 *    <main> carries a transform from the page-transition animation — so the
 *    popover was being positioned from the bottom of the story rather than the
 *    bottom of the screen, and landed thousands of pixels down the page. The
 *    portal makes that impossible to reintroduce from anywhere above it.
 */
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
  onBack, onHeard, onRead, onPersonalize, backLabel = 'Tonight' }: {
  story: Story; lex: Lexicon; len: 'short' | 'full' | 'more';
  next: Card | null; tomorrow?: { story: Card; reason: string } | null; readBefore?: boolean;
  hasProfile: boolean;
  onBack: () => void; onHeard: (id: string) => void; onRead: (id: string) => void;
  onPersonalize: (age: number) => void;
  backLabel?: string;
}) {
  const [say, setSay] = useState<Said>(null);
  const [ask, setAsk] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [age, setAge] = useState(8);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const completionGuard = useRef(false);
  const key = len === 'short' ? 'short' : 'full';
  const r = story.lengths[key] ?? story.lengths.full;
  const heardLabel = `${key === 'short' ? 'Short' : 'Full'} · ${r.minutes} min`;
  const canShare = !story.audience.gated;

  function completeStory() {
    // The button disappears after one press, but the guard also protects an
    // impatient double-tap from recording two finishes before React rerenders.
    if (completionGuard.current) return;
    completionGuard.current = true;
    onHeard(story.id);
    setCompleted(true);
  }

  async function shareStory() {
    // Public story routes contain no child/profile state. Gated stories never
    // render this action because they are deliberately not prerendered.
    const url = new URL(`/s/${story.id}/`, window.location.origin);
    url.searchParams.set('utm_source', 'parent_share');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'story');
    url.searchParams.set('utm_content', story.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${story.title} · Sandhya Katha`,
          text:
            `🌙 ${story.title}\n\n` +
            `${story.tease}\n\n` +
            `A ${story.lengths.full.minutes}-minute, source-checked story to read aloud with your child tonight.`,
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
    } catch { /* sharing is optional; never disturb a completed story */ }
  }

  return (
    <>
      <div className="readtop">
        <button className="back" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 10H5M9 6l-4 4 4 4" /></svg> {backLabel}
        </button>
        <span className="spacer" /><span className="len">{heardLabel}</span>
      </div>

      <article className="story">
        <h1>{story.title}</h1>
        <div className="attrib">
          <p className="s"><b>{story.source.work}</b> — {story.source.locus}</p>
          {story.source.traditionNote && <p className="trad"><b>Tradition note.</b> {story.source.traditionNote}</p>}
          {story.audience.careNote && <p className="care"><b>Before you begin.</b> {story.audience.careNote}</p>}
          {readBefore && <p className="again"><b>You have read this one before.</b> Every word is where it was.
            That is the whole reason it is written down and not made up each time.</p>}
        </div>

        {story.hero && (
          <figure className="storyart readerart">
            <img src={story.hero} alt={`Illustration for ${story.title}`} loading="eager" decoding="async" />
            <figcaption>Illustration</figcaption>
          </figure>
        )}

        <div className="prose">
          {r.blocks.map((b, i) => b.t === 'beat'
            ? <div className="beat" key={i}><span>pause</span></div>
            : b.t === 'aside'
            ? <aside className="note" key={i}>
                <span>for you, not aloud</span>
                <p><Line text={b.text!} lex={lex} onSay={setSay} /></p>
              </aside>
            : <p key={i} className={b.t === 'slow' ? 'slow' : ''}>
                {b.t === 'slow' && <span className="slowtag">slow down here</span>}
                <Line text={b.text} lex={lex} onSay={setSay} />
              </p>)}
        </div>

        <section className="turn">
          <span className="eyebrow">Now turn to your child</span>
          <p className="q"><Line text={story.close.question} lex={lex} onSay={setSay} /></p>
          <p className="seed">And if they shrug, you can leave it at this: <b>{story.close.seed}</b></p>
          {story.close.ifTheyAsk?.map((f, i) => (
            <div className="disclose" key={i}>
              <button onClick={() => setAsk(ask === i ? null : i)} aria-expanded={ask === i}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" style={{ transform: ask === i ? 'rotate(180deg)' : undefined }}><path d="M6 8l4 4 4-4" /></svg>
                If they ask: “{f.q}”
              </button>
              {ask === i && <p className="ans"><Line text={f.a} lex={lex} onSay={setSay} /></p>}
            </div>
          ))}
          {!completed && (
            <button className="mark" onClick={completeStory}>
              {readBefore ? 'We read this again tonight' : 'We read this tonight'}
            </button>
          )}
        </section>

        {len === 'more' && next && (
          <button className="onemore" onClick={() => onRead(next.id)}>
            <span className="eyebrow">One more, because they asked</span>
            <h3>{next.title}</h3>
            <p>{next.tease}</p>
            {story.linked?.next === next.id && <p className="link">Linked to tonight's: {story.linked.reason}.</p>}
          </button>
        )}

        {completed && (
          <section className="afterread" aria-live="polite">
            <p className="saved"><b>{hasProfile ? 'Tonight is saved.' : 'Story complete.'}</b></p>

            {!hasProfile && (
              <div className="afterage">
                <p><b>Want tomorrow's story chosen for your child?</b> Their age is enough. A name can wait.</p>
                <div className="agerow">
                  <label>
                    <span>Age</span>
                    <input type="number" min={3} max={15} value={age}
                           onChange={e => setAge(+e.target.value)} />
                  </label>
                  <button onClick={() => onPersonalize(age)}>Choose tomorrow</button>
                </div>
              </div>
            )}

            {hasProfile && tomorrow && (
              <aside className="tomorrow">
                <span className="eyebrow">Tomorrow night</span>
                <h3>{tomorrow.story.title}</h3>
                <p>{tomorrow.story.tease}</p>
                <p className="why">Chosen because {tomorrow.reason}.</p>
              </aside>
            )}

            {canShare && (
              <button className="begin sharebtn" onClick={shareStory}>
                <svg className="shareicon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 16V4" />
                  <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
                  <path d="M5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7" />
                </svg>
                <span>{shareState === 'copied' ? 'Story link copied' : 'Share this story'}</span>
              </button>
            )}

            <button className="mark" onClick={onBack}>Done</button>
          </section>
        )}

        <Wrong id={story.id} version={story.version} />
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

/** «Term» becomes a tappable pronunciation; _text_ becomes emphasis. */
function Line({ text, lex, onSay }: { text: string; lex: Lexicon; onSay: (s: Said) => void }) {
  const parts = text.split(/(«[^»]+»|_[^_]+_)/g).filter(Boolean);
  return <>{parts.map((p, i) => {
    if (p.startsWith('«')) {
      const t = p.slice(1, -1);
      return <button key={i} className="name" title={lex[t]?.say}
                     onClick={e => onSay({ term: t, rect: e.currentTarget.getBoundingClientRect() })}>{t}</button>;
    }
    if (p.startsWith('_')) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  })}</>;
}


/**
 * "Something isn't right here."
 *
 * The best reviewer this collection will ever have is somebody who knows the
 * story better than we do, reading it to a child and stopping. This is how
 * they tell us. No account, no name, nothing joined to a reading history —
 * which is also why the box says not to put your own details in it.
 */
function Wrong({ id, version }: { id: string; version: number }) {
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  if (state === 'sent') return (
    <aside className="wrong done">
      <p>Thank you. That goes to the person who wrote it, and every report is read.</p>
    </aside>
  );

  return (
    <details className="wrong">
      <summary>Something isn't right here</summary>
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
        <p>If a name, a detail or a tradition is wrong here, tell us. Nobody needs an account and we do
          not ask who you are — so please leave your own details out of the box.</p>
        <textarea rows={4} maxLength={2000} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="What is wrong, and how do you know?" />
        <button type="submit" disabled={state === 'sending' || note.trim().length < 4}>
          {state === 'sending' ? 'Sending…' : state === 'failed' ? 'That did not send — try again' : 'Send'}
        </button>
      </form>
    </details>
  );
}
