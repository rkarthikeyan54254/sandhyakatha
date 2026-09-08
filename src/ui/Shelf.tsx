import { useState } from 'react';
import type { CanonRow } from '../lib/types';
import { CORPUS_LABEL, CORPUS_ORDER, TRADITION_LABEL, FAMILY, FAMILY_ORDER, FAMILY_NOTE } from '../lib/types';

export default function Shelf({ canon, publishedIds, gate, onRead }: {
  canon: CanonRow[]; publishedIds: Set<string>; gate: boolean; onRead: (id: string) => void;
}) {
  const [corpus, setCorpus] = useState('all');
  const [trad, setTrad] = useState('all');
  const [only, setOnly] = useState('all');

  const visible = canon.filter(c => {
    if (c.gated && !gate) return false;
    if (corpus !== 'all' && c.corpus !== corpus) return false;
    if (trad !== 'all' && c.tradition !== trad) return false;
    if (only === 'written' && !publishedIds.has(c.id)) return false;
    if (only === 'regional' && c.stability === 'stable') return false;
    if (only === 'flagged' && !c.sensitivity.length) return false;
    return true;
  });

  const present = new Set(canon.map(c => c.corpus));
  const traditions = [...new Set(canon.map(c => c.tradition))];

  return (
    <>
      <h1 className="page">The shelf</h1>
      <p className="sub">Every story is written before you open it, checked against a named edition, and dated.
        Nothing is generated while you wait — which is also why it works on a flight with no signal, and why a
        story a child asks for twice comes back word for word.</p>
      <p className="sub">The whole collection is listed here, including the ones still being written. You can see
        what is coming.</p>

      <div className="facet">
        <span className="lab">Where it comes from</span>
        <div className="opts">
          <Chip on={corpus === 'all'} onClick={() => setCorpus('all')}>All</Chip>
          {CORPUS_ORDER.filter(k => present.has(k)).map(k =>
            <Chip key={k} on={corpus === k} onClick={() => setCorpus(k)}>{CORPUS_LABEL[k]}</Chip>)}
        </div>
      </div>
      <div className="facet">
        <span className="lab">Which telling</span>
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
      <p className="count"><b>{visible.filter(c => publishedIds.has(c.id)).length}</b> written
        · <b>{visible.filter(c => !publishedIds.has(c.id)).length}</b> still being written
        · {visible.length} of {canon.length} shown{gate ? '' : ' · the difficult ones are hidden'}</p>

      {FAMILY_ORDER.map(family => {
        const inFamily = CORPUS_ORDER.filter(k => FAMILY[k] === family && visible.some(c => c.corpus === k));
        if (!inFamily.length) return null;
        return (
          <section key={family}>
            <div className="family">
              <h2>{family}</h2>
              <p>{FAMILY_NOTE[family]}</p>
            </div>
            {inFamily.map(k => {
              const rows = visible.filter(c => c.corpus === k);
              return (
                <div key={k}>
                  <div className="hair"><span className="eyebrow">{CORPUS_LABEL[k]}</span><span className="n">{rows.length}</span></div>
                  {rows.map(c => {
                    const written = publishedIds.has(c.id);
                    const Row = written ? 'button' : 'div';
                    return (
                      <Row key={c.id} className={'mini' + (written ? '' : ' locked')}
                           {...(written ? { onClick: () => onRead(c.id) } : {})}>
                        <span className="num">{String(c.n).padStart(2, '0')}</span>
                        <span className="t">
                          <h3>{c.title}{written ? <em className="pub">Written</em> : <em className="soon">Being written</em>}</h3>
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
                </div>
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
