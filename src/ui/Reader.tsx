import { useState } from 'react';
import type { Lexicon, Story, Card } from '../lib/types';

type Said = { term: string; rect: DOMRect } | null;

/** Where the popover goes.
 *
 *  On a phone it is a sheet at the bottom, because a thumb is already there and
 *  a tooltip beside the word would sit under the hand. On a desktop the word
 *  can be anywhere in a tall window, and a sheet pinned to the bottom of the
 *  viewport is nowhere near what you clicked — so anchor it to the word, above
 *  it where there is room and below it near the top of the page.
 */
function place(rect: DOMRect): React.CSSProperties | undefined {
  if (window.innerWidth < 900) return undefined;          // the sheet is right here
  const W = 320, M = 16;
  const left = Math.min(Math.max(M, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - M);
  const above = rect.top > 190;
  return {
    left, width: W, transform: 'none',
    ...(above ? { bottom: window.innerHeight - rect.top + 10, top: 'auto' }
              : { top: rect.bottom + 10, bottom: 'auto' })
  };
}

export default function Reader({ story, lex, len, next, onBack, onHeard, onRead }: {
  story: Story; lex: Lexicon; len: 'short' | 'full' | 'more';
  next: Card | null; onBack: () => void; onHeard: (id: string) => void; onRead: (id: string) => void;
}) {
  const [say, setSay] = useState<Said>(null);
  const [ask, setAsk] = useState<number | null>(null);
  const key = len === 'short' ? 'short' : 'full';
  const r = story.lengths[key] ?? story.lengths.full;
  const heardLabel = `${key === 'short' ? 'Short' : 'Full'} · ${r.minutes} min`;

  return (
    <>
      <div className="readtop">
        <button className="back" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 10H5M9 6l-4 4 4 4" /></svg> Tonight
        </button>
        <span className="spacer" /><span className="len">{heardLabel}</span>
      </div>

      <article className="story">
        <h1>{story.title}</h1>
        <div className="attrib">
          <p className="s"><b>{story.source.work}</b> — {story.source.locus}</p>
          {story.source.traditionNote && <p className="trad"><b>Tradition note.</b> {story.source.traditionNote}</p>}
          {story.audience.careNote && <p className="care"><b>Before you begin.</b> {story.audience.careNote}</p>}
        </div>

        <div className="prose">
          {r.blocks.map((b, i) => b.t === 'beat'
            ? <div className="beat" key={i}><span>pause</span></div>
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
          <button className="mark" onClick={() => { onHeard(story.id); onBack(); }}>We read this tonight</button>
        </section>

        {len === 'more' && next && (
          <button className="onemore" onClick={() => onRead(next.id)}>
            <span className="eyebrow">One more, because they asked</span>
            <h3>{next.title}</h3>
            <p>{next.tease}</p>
            {story.linked?.next === next.id && <p className="link">Linked to tonight's: {story.linked.reason}.</p>}
          </button>
        )}
      </article>

      {say && (
        <button className={'pop' + (window.innerWidth >= 900 ? ' anchored' : '')}
                style={place(say.rect)} onClick={() => setSay(null)}>
          <b>{lex[say.term]?.say}</b>
          <span>{lex[say.term]?.gloss}</span>
          {lex[say.term]?.native?.taml
            ? <i>{lex[say.term].native.taml}</i>
            : lex[say.term]?.native?.deva && <i>{lex[say.term].native.deva}</i>}
        </button>
      )}
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
