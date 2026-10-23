import { act, create } from 'react-test-renderer';
import { describe, it, expect, vi } from 'vitest';
import Tonight from './Tonight';
import FamilyControls from './FamilyControls';
import { familyCopy } from './family-copy';
import type { Profile } from '../lib/profile';
import type { AppLocale } from '../lib/app-locale';
vi.mock('./Account', () => ({ default: () => null }));
const profile: Profile = { v: 1, children: [{ id: 'a', name: 'Asha', age: 8 }, { id: 'b', name: 'Bala', age: 10 }],
  activeId: 'a', gate: false, heard: { a: { story: '2026-10-01' } }, firstNight: '2026-10-01', updatedAt: '2026-10-01T00:00:00Z' };
const callbacks = () => ({ setActive: vi.fn(), addChild: vi.fn(), patchChild: vi.fn(), removeChild: vi.fn(), repairChildConflict: vi.fn(), setGate: vi.fn() });
describe.each(['en', 'hi-IN', 'ta-IN'] as AppLocale[])('family controls in %s', locale => {
  it('Tonight exposes the same family component in every language', () => {
    const cb = callbacks();
    const tree = create(<Tonight {...cb} locale={locale} profile={profile} child={profile.children[0]} heard={profile.heard.a}
      pick={null} cards={[]} canon={[]} published={0} pan={{ date: '', masa: '', paksha: 'shukla', tithi: '', nakshatra: '', festivals: [], season: '', approximate: true }}
      len="full" setLen={vi.fn()} onRead={vi.fn()} account={null} syncing={false} syncPending={false}
      onAccountChanged={vi.fn()} onSignOut={async () => 'ok'} onShelf={vi.fn()} onMap={vi.fn()} onWhy={vi.fn()} observances={[]} />);
    expect(tree.root.findAllByType(FamilyControls)).toHaveLength(1);
    expect(tree.root.findAllByProps({ className: 'kidname' })).toHaveLength(2);
    expect(cb.removeChild).not.toHaveBeenCalled(); tree.unmount();
  });
  it('forwards exact identities and mutations, preserving two-click history deletion', () => {
    const cb = callbacks(), before = JSON.stringify(profile), copy = familyCopy(locale);
    const tree = create(<FamilyControls {...cb} locale={locale} profile={profile} child={profile.children[0]} />);
    act(() => tree.root.findAllByProps({ className: 'pickkid' })[1].props.onClick());
    expect(cb.setActive).toHaveBeenCalledWith('b');
    act(() => tree.root.findAllByProps({ className: 'kidname' })[0].props.onChange({ target: { value: 'Anu' } }));
    act(() => tree.root.findAllByProps({ className: 'kidage' })[0].props.onChange({ target: { value: '9' } }));
    expect(cb.patchChild.mock.calls).toEqual([['a', { name: 'Anu' }], ['a', { age: 9 }]]);
    act(() => tree.root.findByProps({ className: 'linkbtn add' }).props.onClick());
    expect(cb.addChild).toHaveBeenCalledWith('', 8);
    act(() => tree.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }));
    expect(cb.setGate).toHaveBeenCalledWith(true);
    act(() => tree.root.findByProps({ 'aria-label': copy.remove('Asha') }).props.onClick());
    expect(cb.removeChild).not.toHaveBeenCalled();
    act(() => tree.root.findByProps({ 'aria-label': copy.confirmRemove('Asha') }).props.onClick());
    expect(cb.removeChild).toHaveBeenCalledWith('a');
    expect(JSON.stringify(profile)).toBe(before); tree.unmount();
  });
  it('preserves ambiguous history until the parent explicitly selects an owner', () => {
    const conflict = { ...profile, children: profile.children.map(c => ({ ...c, id: 'a' })) };
    const cb = callbacks(), before = JSON.stringify(conflict);
    const tree = create(<FamilyControls {...cb} locale={locale} profile={conflict} child={conflict.children[0]} />);
    expect(tree.root.findAllByProps({ className: 'kidname' })).toHaveLength(0);
    expect(cb.repairChildConflict).not.toHaveBeenCalled();
    act(() => tree.root.findAllByProps({ className: 'ghost' })[1].props.onClick());
    expect(cb.repairChildConflict).toHaveBeenCalledWith('a', 1);
    expect(JSON.stringify(conflict)).toBe(before); tree.unmount();
  });
});
