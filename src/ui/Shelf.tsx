import { useState } from 'react';
import type { CanonRow } from '../lib/types';
import { CORPUS_LABEL, CORPUS_ORDER, TRADITION_LABEL } from '../lib/types';

export default function Shelf({ canon, publishedIds, gate, onRead }: {
  canon: CanonRow[]; publishedIds: Set<string>; gate: boolean; onRead: (id: string) => void;
}) {
  const [trad, setTrad] = useState('all');
  const [only, setOnly] = useState('all');

  const visible = canon.filter(c => {
    if (c.gated && !gate) return false;
    if (trad !== 'all' && c.tradition !== trad) return false;
    if (only === 'written' && !publishedIds.has(c.id)) return false;
    if (only === 'regional' && c.stability === 'stable') return false;
    if (only === 'flagged' && !c.sensitivity.length) return false;
    return true;
  });
  const traditions = [...new Set(canon.map(c => c.tradition))];

  return (
    <>
      <h1 className="page">The shelf</h1>
      <p className="sub">Every story is written before you open it, checked against a named edition, and dated.
        Nothing is generated while you wait — which is also why it works on a flight with no signal.</p>

      <div className="facet">
        <span className="lab">Tradition</span>
        <div className="opts">
          <Chip on={trad === 'all'} onClick={() => setTrad('all')}>All</Chip>
          {traditions.map(t => <Chip key={t} on={trad === t} onClick={() => setTrad(t)}>{TRADITION_LABEL[t]}</Chip>)}
        </div>
      </div>
      <div className="facet">
        <span className="lab">Show only</span>
        <div className="opts">
          {[['all', 'Everything'], ['written', 'Written'], ['regional', 'Regional or variant'], ['flagged', 'Flagged for care']]
            .map(([k, l]) => <Chip key={k} on={only === k} onClick={() => setOnly(k)}>{l}</Chip>)}
        </div>
      </div>
      <p className="count"><b>{visible.length}</b> of {canon.length} stories{gate ? '' : ' · the difficult ones are hidden'}</p>

      {CORPUS_ORDER.map(corpus => {
        const rows = visible.filter(c => c.corpus === corpus);
        if (!rows.length) return null;
        return (
          <section key={corpus}>
            <div className="hair"><span className="eyebrow">{CORPUS_LABEL[corpus]}</span><span className="n">{rows.length}</span></div>
            {rows.map(c => {
              const written = publishedIds.has(c.id);
              const Row = written ? 'button' : 'div';
              return (
                <Row key={c.id} className={'mini' + (written ? '' : ' locked')}
                     {...(written ? { onClick: () => onRead(c.id) } : {})}>
                  <span className="num">{String(c.n).padStart(2, '0')}</span>
                  <span className="t">
                    <h3>{c.title}{written && <em className="pub">Written</em>}</h3>
                    <p>{c.work} · {c.locus} · ages {c.minAge}+</p>
                    <p>{c.hook}</p>
                    <span className="tags">
                      <i className="tag trad">{TRADITION_LABEL[c.tradition]}</i>
                      <i className="tag val">{c.value}</i>
                      {c.stability !== 'stable' && <i className="tag stab">{c.stability === 'regional' ? 'not in the Sanskrit' : c.stability === 'folk' ? 'oral, no text' : 'recensions differ'}</i>}
                      {c.sensitivity.map(s => <i key={s} className="tag sens">{s.replace(/-/g, ' ')}</i>)}
                    </span>
                  </span>
                </Row>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className="chipbtn" aria-pressed={on} onClick={onClick}>{children}</button>;
}
