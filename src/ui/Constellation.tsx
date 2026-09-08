import { useMemo, useState } from 'react';
import type { Lexicon, Relations, Card } from '../lib/types';

/** Deterministic cluster layout — no physics, no jitter between visits.
 *  A child should find Hanumān where he was last night. */
function layout(rel: Relations) {
  const names = Object.keys(rel.clusters);
  const pos = new Map<string, { x: number; y: number; cluster: string }>();
  const cx = 350, cy = 265, R = 185;
  names.forEach((cluster, ci) => {
    const a = (ci / names.length) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R * 0.82;
    const terms = rel.clusters[cluster];
    const r = 26 + terms.length * 4.6;
    terms.forEach((t, i) => {
      const b = (i / terms.length) * Math.PI * 2 + ci;
      pos.set(t, { x: bx + Math.cos(b) * r, y: by + Math.sin(b) * r * 0.78, cluster });
    });
  });
  return pos;
}

export default function Constellation({ lex, rel, heard, cards }: {
  lex: Lexicon; rel: Relations | null; heard: Record<string, string>; cards: Card[];
}) {
  const [sel, setSel] = useState<string | null>(null);
  const pos = useMemo(() => rel ? layout(rel) : new Map(), [rel]);

  const met = useMemo(() => {
    const m = new Set<string>();
    for (const c of cards) if (heard[c.id]) c.characters.forEach(x => m.add(x));
    return m;
  }, [cards, heard]);

  if (!rel) return <p className="sub">Loading the sky…</p>;

  const metStories = Object.keys(heard).length;
  const crossings = rel.edges.filter(([a, b, l]) => l && met.has(a) && met.has(b)).length;

  return (
    <>
      <h1 className="page">The constellation</h1>
      <p className="sub">Everyone in the collection, and how they connect. They light up as you read —
        your child is building a map of the epics without being taught one.</p>

      <div className="sky">
        <svg viewBox="0 0 700 530" role="img" aria-label="Map of the people in the collection">
          {rel.edges.map(([a, b, label], i) => {
            const A = pos.get(a), B = pos.get(b);
            if (!A || !B) return null;
            const lit = met.has(a) && met.has(b);
            const cross = A.cluster !== B.cluster;
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={lit ? '#f0b458' : cross ? '#4a3d63' : '#2e2743'}
              strokeWidth={lit ? 1.4 : 0.9} strokeDasharray={label && cross ? '4 3' : undefined} />;
          })}
          {Object.entries(rel.clusters).map(([name, terms]) => {
            const p = terms.map(t => pos.get(t)!).filter(Boolean);
            if (!p.length) return null;
            const mx = p.reduce((s, q) => s + q.x, 0) / p.length;
            const my = Math.min(...p.map(q => q.y));
            return <text key={name} x={mx} y={my - 16} className="cl" textAnchor="middle">{name}</text>;
          })}
          {[...pos.entries()].map(([term, p]) => {
            const on = met.has(term), isSel = sel === term;
            return (
              <g key={term} className="node" onClick={() => setSel(term)} role="button" tabIndex={0}>
                {isSel && <circle cx={p.x} cy={p.y} r={11} fill="rgba(240,180,88,.18)" />}
                <circle cx={p.x} cy={p.y} r={on ? 5 : 3} fill={on ? '#f0b458' : '#3d3352'} />
                {(on || isSel) && <text x={p.x} y={p.y - 10} textAnchor="middle" className={on ? 'lit' : ''}>{term}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="readout">
        {sel ? <>
          <h3>{sel} <em>{lex[sel]?.say}</em></h3>
          <p>{lex[sel]?.gloss}</p>
          {!met.has(sel) && <p className="dim">Not met yet.</p>}
        </> : <>
          <h3>Tap anyone</h3>
          <p>Lit names are the people your child has met. The dashed lines are the connections that cross
            between epics — Hanumān and Bhīma are brothers, six hundred years and one language apart.</p>
        </>}
      </div>

      <div className="statrow">
        <div><b>{metStories}</b><span>Stories heard</span></div>
        <div><b>{met.size}</b><span>People met</span></div>
        <div><b>{crossings}</b><span>Connections found</span></div>
      </div>
    </>
  );
}
