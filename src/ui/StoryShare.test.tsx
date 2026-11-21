import { act, create } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StoryShare from './StoryShare';

afterEach(() => vi.unstubAllGlobals());
describe.each(['rambha-sevenfold-curse', 'vedavati-hair-and-vow'])('share %s', id => {
  it.each(['en', 'hi-IN', 'ta-IN'] as const)('preserves the %s parent-gated route for WhatsApp, clipboard and native sharing', async locale => {
    const href = `/read/${id}/${locale === 'en' ? '' : locale.split('-')[0] + '/'}`;
    const url = 'https://sandhyakatha.com' + href;
    const writeText = vi.fn().mockResolvedValue(undefined), share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText }, share });
    const tree = create(<StoryShare title="Reviewed title" href={href} locale={locale} />);
    const wa = new URL(tree.root.findByType('a').props.href);
    expect(wa.origin).toBe('https://wa.me');
    expect(wa.searchParams.get('text')).toBe(`Reviewed title\n${url}`);
    const buttons = tree.root.findAllByType('button');
    await act(async () => { await buttons[0].props.onClick(); });
    expect(writeText).toHaveBeenCalledWith(url);
    await act(async () => { await buttons[1].props.onClick(); });
    expect(share).toHaveBeenCalledWith({ title: 'Reviewed title', url });
    tree.unmount();
  });
});
it('falls back to clipboard when native sharing is unavailable', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const tree = create(<StoryShare title="Title" href="/read/vedavati-hair-and-vow/" locale="en" />);
  await act(async () => { await tree.root.findAllByType('button')[1].props.onClick(); });
  expect(writeText).toHaveBeenCalledOnce();
  expect(tree.root.findByProps({ role: 'status' }).children).toEqual(['Story link copied']);
  tree.unmount();
});
it('reports copy failure without claiming success', async () => {
  vi.stubGlobal('navigator', {});
  const tree = create(<StoryShare title="Title" href="/read/vedavati-hair-and-vow/" locale="en" />);
  await act(async () => { await tree.root.findAllByType('button')[0].props.onClick(); });
  expect(tree.root.findByProps({ role: 'status' }).children.join('')).toContain('Could not copy');
  tree.unmount();
});
