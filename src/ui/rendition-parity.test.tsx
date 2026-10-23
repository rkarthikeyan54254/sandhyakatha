import { act, create } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import Reader from './Reader';
import StoryLength from './StoryLength';
import Shelf from './Shelf';
import { cardsForAppLocale, localeUi, type AppLocale, type LocaleCatalog } from '../lib/app-locale';
import type { Card, CanonRow, Story } from '../lib/types';

const card = { id: 'canonical-id', title: 'Canonical', tease: 'Tease', minutes: { short: 3, full: 6 },
  corpus: 'nayanmar', work: 'Periya Purāṇam', locus: 'Life', linked: null,
  gated: false, minAge: 6, sensitivity: [], values: [], calendar: {}, characters: [] } as unknown as Card;
function story(locale: AppLocale): Story {
  return { ...card, characters: [], locale, source: { corpus: 'nayanmar', tradition: 'tamil-shaiva',
    work: 'Periya Purāṇam', locus: 'Life', stability: 'regional' }, audience: { minAge: 6 },
    lengths: { short: { minutes: 3, blocks: [{ t: 'slow', text: 'Distinct short telling' }] },
      full: { minutes: 6, blocks: [{ t: 'p', text: 'Distinct full scene' }, { t: 'slow', text: 'Full landing' }] } },
    close: { question: 'Question', seed: 'Seed' } } as Story;
}
describe.each(['en', 'hi-IN', 'ta-IN'] as AppLocale[])('rendition selection in %s', locale => {
  it('renders full text when selected, short text only when selected', () => {
    const props = { story: story(locale), locale, lex: {}, next: null, hasProfile: true,
      onBack: vi.fn(), onHeard: vi.fn(), onRead: vi.fn(), onPersonalize: vi.fn() };
    const full = renderToStaticMarkup(<Reader {...props} len="full" />);
    const short = renderToStaticMarkup(<Reader {...props} len="short" />);
    expect(full).toContain('Distinct full scene'); expect(full).not.toContain('Distinct short telling');
    expect(short).toContain('Distinct short telling'); expect(short).not.toContain('Distinct full scene');
  });
  it('offers all three choices and returns the actual choice', () => {
    const setLen = vi.fn();
    const tree = create(<StoryLength locale={locale} len="full" setLen={setLen} minutes={card.minutes} />);
    const buttons = tree.root.findAllByType('button');
    expect(buttons).toHaveLength(3); expect(buttons[1].props['aria-pressed']).toBe(true);
    act(() => buttons.forEach(button => button.props.onClick()));
    expect(setLen.mock.calls).toEqual([['short'], ['full'], ['more']]); tree.unmount();
  });
  it('offers the linked next story in One more mode', () => {
    const next = { ...card, id: 'next-id', title: 'Next title' };
    const read = vi.fn();
    const tree = create(<Reader story={story(locale)} locale={locale} lex={{}} len="more" next={next}
      hasProfile={true} onBack={vi.fn()} onHeard={vi.fn()} onRead={read} onPersonalize={vi.fn()} />);
    act(() => tree.root.findByProps({ className: 'onemore' }).props.onClick());
    expect(read).toHaveBeenCalledWith('next-id'); tree.unmount();
  });
  it('never substitutes short for a missing full telling', () => {
    const s = story(locale); delete s.lengths.full;
    const html = renderToStaticMarkup(<Reader story={s} locale={locale} lex={{}} len="full" next={null}
      hasProfile={false} onBack={vi.fn()} onHeard={vi.fn()} onRead={vi.fn()} onPersonalize={vi.fn()} />);
    expect(html).toContain(localeUi(locale).tellingUnavailable);
    expect(html).not.toContain('Distinct short telling');
  });
  it('applies the same parent-controlled difficult-story gate to every language shelf', () => {
    const gatedCard = { ...card, title: 'Gated story title', gated: true };
    const row = { ...gatedCard, n: 1, status: 'published', stability: 'regional', tradition: 'tamil-shaiva' } as unknown as CanonRow;
    const props = { canon: [row], cards: [gatedCard], availableIds: new Set([card.id]), locale, onRead: vi.fn() };
    expect(renderToStaticMarkup(<Shelf {...props} gate={false} />)).not.toContain('Gated story title');
    expect(renderToStaticMarkup(<Shelf {...props} gate={true} />)).toContain('Gated story title');
  });
  it('records both stories when the reader changes canonical story identity', () => {
    const heard = vi.fn(), back = vi.fn();
    const first = story(locale), second = { ...story(locale), id: 'next-id' };
    const element = (s: Story) => <Reader key={s.id} story={s} locale={locale} lex={{}} len="full" next={null}
      hasProfile={true} onBack={back} onHeard={heard} onRead={vi.fn()} onPersonalize={vi.fn()} />;
    const tree = create(element(first));
    act(() => tree.root.findByProps({ className: 'mark' }).props.onClick());
    act(() => tree.update(element(second)));
    act(() => tree.root.findByProps({ className: 'mark' }).props.onClick());
    expect(heard.mock.calls).toEqual([['canonical-id'], ['next-id']]);
    expect(back).not.toHaveBeenCalled(); tree.unmount();
  });
});
it('uses actual locale rendition durations without borrowing canonical full metadata', () => {
  const catalog = { schemaVersion: '1.0', locales: { 'ta-IN': { locale: 'ta-IN', language: 'ta', label: 'தமிழ்', path: '/ta/', stories: [{
    id: card.id, title: 'தமிழ்', tease: 'தமிழ்', minutes: 3, storyRevision: 'reviewed', publicPath: '/s/canonical-id/ta/', renditionMinutes: { short: 3, full: 6 }
  }] } } } as LocaleCatalog;
  expect(cardsForAppLocale([card], catalog, 'ta-IN')[0].minutes).toEqual({ short: 3, full: 6 });
  delete catalog.locales['ta-IN']!.stories[0].renditionMinutes;
  expect(cardsForAppLocale([card], catalog, 'ta-IN')[0].minutes).toEqual({ short: 3 });
});
