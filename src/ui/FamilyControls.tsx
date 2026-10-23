import { useState } from 'react';
import * as P from '../lib/profile';
import type { AppLocale } from '../lib/app-locale';
import { familyCopy } from './family-copy';

export interface FamilyProps {
  profile: P.Profile; child: P.Child | null; locale: AppLocale;
  setActive: (id: string) => void;
  addChild: (name: string, age: number) => void;
  patchChild: (id: string, patch: Partial<P.Child>) => void;
  removeChild: (id: string) => void;
  repairChildConflict: (id: string, historyOwnerIndex: number) => void;
  setGate: (gate: boolean) => void;
}
export default function FamilyControls(p: FamilyProps) {
  const { profile, child } = p;
  const [armed, setArmed] = useState<string | null>(null);
  const identityConflicts = P.duplicateIdConflicts(profile);
  const copy = familyCopy(p.locale);
  return <section lang={p.locale === 'en' ? 'en' : p.locale === 'hi-IN' ? 'hi' : 'ta'} data-family-controls>
      {identityConflicts.length > 0 ? <>
        <div className="hair"><span className="eyebrow">{copy.repairTitle}</span></div>
        {identityConflicts.map(conflict => {
          const stories = Object.keys(profile.heard[conflict.id] ?? {}).length;
          return (
            <div className="account nudge" key={`repair-${conflict.id}`}>
              <p className="lede">{copy.repairLead}</p>
              <p>{copy.repairPreserve}</p>
              <p className="fine">{copy.repairChoose(stories)}</p>
              {conflict.children.map((c, i) => (
                <button key={`${i}-${c.name}-${c.age}`} className="ghost"
                        onClick={() => p.repairChildConflict(conflict.id, i)}>
                  {copy.owner(c.name.trim() || copy.childAge(c.age))}
                </button>
              ))}
              <p className="fine">{copy.repairWait}</p>
            </div>
          );
        })}
      </> : profile.children.length > 0 && <>
        <div className="hair"><span className="eyebrow">{copy.children}</span></div>
        {profile.children.map(c => {
          const nights = Object.keys(profile.heard[c.id] ?? {}).length;
          return (
            <div key={c.id} className={'kid' + (c.id === child?.id ? ' on' : '')}>
              <button className="pickkid" onClick={() => p.setActive(c.id)} aria-pressed={c.id === child?.id}
                      aria-label={copy.readTo(c.name.trim() || copy.thisChild)}>
                <span className="dot" />
              </button>
              <input className="kidname" value={c.name} placeholder={copy.addName} aria-label={copy.addName}
                     onChange={e => p.patchChild(c.id, { name: e.target.value })} />
              <input className="kidage" type="number" min={3} max={15} value={c.age}
                     aria-label={copy.age}
                     onChange={e => p.patchChild(c.id, { age: +e.target.value })} />
              <button className={'dropkid' + (armed === c.id ? ' armed' : '')}
                      aria-label={armed === c.id
                        ? copy.confirmRemove(c.name.trim() || copy.thisChild)
                        : copy.remove(c.name.trim() || copy.thisChild)}
                      onClick={() => {
                        if (!nights || armed === c.id) { setArmed(null); p.removeChild(c.id); }
                        else setArmed(c.id);
                      }}>
                {armed === c.id ? copy.removeHistory(nights) : '×'}
              </button>
            </div>
          );
        })}
        <button className="linkbtn add" onClick={() => p.addChild('', 8)}>{copy.addChild}</button>

        <label className="set check">
          <input type="checkbox" checked={profile.gate} onChange={e => p.setGate(e.target.checked)} />
          <span>{copy.gateTitle}
            <small>{copy.gateDetail}</small></span>
        </label>
      </>}

  </section>;
}
