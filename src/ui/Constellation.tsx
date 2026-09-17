import { useMemo, useState } from 'react';
import type { Lexicon, Relations, Card } from '../lib/types';
import {
  constellationLayout,
  deriveConstellation,
  storiesForTerm,
  type ConstellationDiscovery,
  type ConstellationPoint
} from '../lib/constellation';

type ShareState = 'idle' | 'working' | 'saved';

const shareIcon = (
  <svg className="shareicon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 16V4" />
    <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
    <path d="M5 11.5v7A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-7" />
  </svg>
);

function displayName(lex: Lexicon, term: string) {
  return lex[term]?.display || term;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  family: string,
  minSize = 28
) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawShareMap(
  ctx: CanvasRenderingContext2D,
  rel: Relations,
  pos: Map<string, ConstellationPoint>,
  met: Set<string>,
  discoveries: ConstellationDiscovery[],
  x: number, y: number, w: number, h: number
) {
  const sx = w / 700, sy = h / 530;
  const discoveryKeys = new Set(
    discoveries.map(d => [d.a, d.b].sort().join('\u0000'))
  );

  ctx.save();
  ctx.translate(x, y);

  for (const [a, b] of rel.edges) {
    const A = pos.get(a), B = pos.get(b);
    if (!A || !B) continue;
    const both = met.has(a) && met.has(b);
    const isDiscovery = discoveryKeys.has([a, b].sort().join('\u0000'));
    ctx.beginPath();
    ctx.moveTo(A.x * sx, A.y * sy);
    ctx.lineTo(B.x * sx, B.y * sy);
    ctx.strokeStyle = isDiscovery
      ? 'rgba(240,180,88,.78)'
      : both ? 'rgba(240,180,88,.34)' : 'rgba(123,105,151,.18)';
    ctx.lineWidth = isDiscovery ? 3 : both ? 2 : 1;
    ctx.stroke();
  }

  for (const [term, p] of pos) {
    const lit = met.has(term);
    ctx.beginPath();
    ctx.arc(p.x * sx, p.y * sy, lit ? 7 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = lit ? '#f0b458' : 'rgba(123,105,151,.34)';
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(219,204,230,.68)';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const [cluster, terms] of Object.entries(rel.clusters)) {
    const points = terms.map(t => pos.get(t)).filter(Boolean) as ConstellationPoint[];
    if (!points.length) continue;
    const mx = points.reduce((s, p) => s + p.x, 0) / points.length * sx;
    const my = Math.min(...points.map(p => p.y)) * sy - 18;
    ctx.fillText(cluster.toUpperCase(), mx, my);
  }

  ctx.restore();
}

async function makeShareCard(
  rel: Relations,
  pos: Map<string, ConstellationPoint>,
  met: Set<string>,
  discoveries: ConstellationDiscovery[],
  storiesHeard: number,
  childName: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  try { await document.fonts?.ready; } catch { /* optional */ }

  const bg = ctx.createRadialGradient(540, 500, 80, 540, 650, 900);
  bg.addColorStop(0, '#261d36');
  bg.addColorStop(1, '#130f1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f0b458';
  ctx.font = '700 23px system-ui, sans-serif';
  ctx.fillText('SANDHYA KATHA', 82, 92);

  const named = childName.trim();
  const title = named ? `${named}'s constellation` : 'Our Sandhya Katha constellation';
  const titleSize = fitText(ctx, title, 916, 62, 'Georgia, serif', 40);
  ctx.font = `${titleSize}px Georgia, serif`;
  ctx.fillStyle = '#f7f0e4';
  ctx.fillText(title, 82, 170);

  ctx.font = '28px Georgia, serif';
  ctx.fillStyle = 'rgba(247,240,228,.74)';
  ctx.fillText('The old stories, slowly becoming one map.', 82, 218);

  roundedRect(ctx, 70, 264, 940, 616, 34);
  ctx.fillStyle = 'rgba(10,8,16,.30)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,180,88,.16)';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawShareMap(ctx, rel, pos, met, discoveries, 95, 300, 890, 535);

  const statsY = 940;
  const stats = [
    [String(storiesHeard), 'STORIES HEARD'],
    [String(met.size), 'NAMES LIT'],
    [String(discoveries.length), 'CROSSINGS FOUND']
  ];
  stats.forEach(([value, label], i) => {
    const x = 90 + i * 320;
    ctx.font = '48px Georgia, serif';
    ctx.fillStyle = '#f0b458';
    ctx.fillText(value, x, statsY);
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(247,240,228,.60)';
    ctx.fillText(label, x, statsY + 32);
  });

  const first = discoveries[0];
  if (first) {
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillStyle = '#f0b458';
    ctx.fillText('A CONNECTION THAT LIT UP', 82, 1060);
    const headline = `${first.a} ↔ ${first.b}`;
    const hSize = fitText(ctx, headline, 916, 34, 'Georgia, serif', 27);
    ctx.font = `${hSize}px Georgia, serif`;
    ctx.fillStyle = '#f7f0e4';
    ctx.fillText(headline, 82, 1106);
    const rSize = fitText(ctx, first.label, 916, 26, 'Georgia, serif', 21);
    ctx.font = `${rSize}px Georgia, serif`;
    ctx.fillStyle = 'rgba(247,240,228,.76)';
    ctx.fillText(first.label, 82, 1146);
  } else {
    ctx.font = '26px Georgia, serif';
    ctx.fillStyle = 'rgba(247,240,228,.72)';
    ctx.fillText('More connections appear as the stories meet each other.', 82, 1092);
  }

  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(247,240,228,.50)';
  ctx.fillText('Built only from stories this family marked as heard.', 82, 1244);
  ctx.fillText('Made on this device · reading history is not uploaded for this image.', 82, 1276);

  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = '#f0b458';
  ctx.textAlign = 'right';
  ctx.fillText('sandhyakatha.com', 998, 1276);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not render image')), 'image/png')
  );
}

function saveBlob(blob: Blob) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = 'sandhya-katha-constellation.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function Constellation({ lex, rel, heard, cards, childName, onTonight }: {
  lex: Lexicon;
  rel: Relations | null;
  heard: Record<string, string>;
  cards: Card[];
  childName?: string;
  onTonight: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const pos = useMemo(() => rel ? constellationLayout(rel) : new Map<string, ConstellationPoint>(), [rel]);
  const state = useMemo(
    () => rel ? deriveConstellation(rel, cards, heard) : null,
    [rel, cards, heard]
  );

  if (!rel || !state) return <p className="sub">Loading the sky…</p>;

  const { storiesHeard, met, discoveries } = state;
  const name = childName?.trim() || '';
  const recentDiscoveries = discoveries.slice(0, 3);

  async function shareConstellation() {
    if (!storiesHeard || shareState === 'working') return;
    setShareState('working');

    try {
      const blob = await makeShareCard(rel!, pos, met, discoveries, storiesHeard, name);
      const file = typeof File === 'function'
        ? new File([blob], 'sandhya-katha-constellation.png', { type: 'image/png' })
        : null;
      const url = new URL('/', window.location.origin);
      url.searchParams.set('utm_source', 'constellation_share');
      url.searchParams.set('utm_medium', 'referral');
      url.searchParams.set('utm_campaign', 'constellation');
      const shareData = {
        title: `${name ? `${name}'s` : 'Our'} Sandhya Katha constellation`,
        text: 'The old stories, slowly becoming one map. Build yours on Sandhya Katha.',
        url: url.toString()
      };

      if (
        file &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        // Do not send both `url` and `files` as separate Web Share fields.
        // WhatsApp can surface that combination as two media/share items.
        // Put the acquisition link in the image caption instead: one PNG,
        // one explicit parent action, no uploaded reading history.
        await navigator.share({
          title: shareData.title,
          text: `${shareData.text}\n${shareData.url}`,
          files: [file]
        });
        setShareState('idle');
        return;
      }

      saveBlob(blob);

      if (typeof navigator.share === 'function') {
        try { await navigator.share(shareData); }
        catch (err) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) throw err;
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString());
      }

      setShareState('saved');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setShareState('idle');
        return;
      }
      setShareState('idle');
    }
  }

  return (
    <>
      <h1 className="page">{name ? `${name}'s constellation` : 'The constellation'}</h1>
      <p className="sub">Characters, places, texts and traditions from the collection, and how they connect.
        They light up only from stories you have actually marked as heard.</p>

      {storiesHeard === 0 && (
        <section className="constellation-empty">
          <p className="eyebrow">The sky starts dark on purpose</p>
          <h2>Your first story will light the first names.</h2>
          <p>No points, streaks or badges. When two names you have met share a relationship that our
            editors have deliberately mapped, that line lights too.</p>
          <button className="begin" onClick={onTonight}>Read tonight's story</button>
        </section>
      )}

      <div className="sky">
        <svg viewBox="0 0 700 530" role="img"
             aria-label={`${storiesHeard} stories heard, ${met.size} names lit, ${discoveries.length} crossings found`}>
          {rel.edges.map(([a, b, label], i) => {
            const A = pos.get(a), B = pos.get(b);
            if (!A || !B) return null;
            const lit = met.has(a) && met.has(b);
            const cross = A.cluster !== B.cluster;
            return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={lit ? '#f0b458' : cross ? '#4a3d63' : '#2e2743'}
              strokeWidth={lit ? 1.4 : 0.9} strokeDasharray={label && cross ? '4 3' : undefined} />;
          })}
          {Object.entries(rel.clusters).map(([cluster, terms]) => {
            const points = terms.map(t => pos.get(t)!).filter(Boolean);
            if (!points.length) return null;
            const mx = points.reduce((s, q) => s + q.x, 0) / points.length;
            const my = Math.min(...points.map(q => q.y));
            return <text key={cluster} x={mx} y={my - 16} className="cl" textAnchor="middle">{cluster}</text>;
          })}
          {[...pos.entries()].map(([term, p]) => {
            const on = met.has(term), isSel = sel === term;
            const select = () => setSel(term);
            return (
              <g key={term} className="node" onClick={select}
                 onKeyDown={e => {
                   if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
                 }}
                 role="button" tabIndex={0}
                 aria-label={`${displayName(lex, term)} — ${on ? 'lit' : 'not met yet'}`}>
                {isSel && <circle cx={p.x} cy={p.y} r={11} fill="rgba(240,180,88,.18)" />}
                <circle cx={p.x} cy={p.y} r={on ? 5 : 3} fill={on ? '#f0b458' : '#3d3352'} />
                {(on || isSel) && <text x={p.x} y={p.y - 10} textAnchor="middle"
                  className={on ? 'lit' : ''}>{displayName(lex, term)}</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="readout">
        {sel ? <>
          <h3>{displayName(lex, sel)} <em>{lex[sel]?.say}</em></h3>
          <p>{lex[sel]?.gloss}</p>
          {met.has(sel)
            ? <p className="dim">Lit by {storiesForTerm(sel, cards, heard).map(c => c.title).join(', ')}.</p>
            : <p className="dim">Not lit yet. It will appear when you hear a story that contains it.</p>}
        </> : storiesHeard ? <>
          <h3>Tap a light</h3>
          <p>Gold names have appeared in stories you have heard. Dashed lines cross between different
            parts of the collection. Every relationship is curated; simple co-occurrence never creates one.</p>
        </> : <>
          <h3>Explore the dark map</h3>
          <p>Tap any point to see what belongs here. The map fills from real reading history, not activity
            scores — so nothing lights until a story has actually been heard.</p>
        </>}
      </div>

      <div className="statrow" aria-label="Constellation progress">
        <div><b>{storiesHeard}</b><span>Stories heard</span></div>
        <div><b>{met.size}</b><span>Names lit</span></div>
        <div><b>{discoveries.length}</b><span>Crossings found</span></div>
      </div>

      <section className="discoveries">
        <p className="eyebrow">{discoveries.length ? 'Connections that lit up' : 'What appears next'}</p>
        {discoveries.length ? <>
          <h2>The stories are beginning to meet each other.</h2>
          <p className="discovery-intro">These are not generated associations. Each one is an explicitly
            curated relationship in the Sandhya Katha map.</p>
          <div className="discovery-list">
            {recentDiscoveries.map(d => (
              <article className="discovery" key={`${d.a}\u0000${d.b}`}>
                <span>{d.clusterA} ↔ {d.clusterB}</span>
                <h3>{displayName(lex, d.a)} ↔ {displayName(lex, d.b)}</h3>
                <p>{d.label}</p>
              </article>
            ))}
          </div>
          {discoveries.length > recentDiscoveries.length &&
            <p className="discovery-more">+ {discoveries.length - recentDiscoveries.length} more crossing{discoveries.length - recentDiscoveries.length === 1 ? '' : 's'} glowing in the map.</p>}
        </> : <>
          <h2>The first crossing has not lit yet.</h2>
          <p className="discovery-intro">As you hear stories from different parts of the collection,
            a relationship can cross the map. We only show one when the relationship itself has been
            deliberately recorded — never because two names happened to occur together.</p>
        </>}
      </section>

      {storiesHeard > 0 && (
        <section className="constellation-sharebox">
          <p className="eyebrow">A keepsake, not a score</p>
          <h2>Share this constellation</h2>
          <p>The image is drawn on this device from the stories you marked as heard. Sandhya Katha does
            not upload the child's reading history to make it.</p>
          <button className="begin sharebtn constellation-share" onClick={shareConstellation}
                  disabled={shareState === 'working'}>
            {shareIcon}
            <span>{shareState === 'working' ? 'Drawing constellation…'
              : shareState === 'saved' ? 'Constellation saved · link copied'
              : 'Share this constellation'}</span>
          </button>
          <p className="share-fine">{name
            ? `The shared image includes the first name “${name}” because you chose to share it.`
            : 'No child name is included because none was provided.'}</p>
        </section>
      )}
    </>
  );
}
