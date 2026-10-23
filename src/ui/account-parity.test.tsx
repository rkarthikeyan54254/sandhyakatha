import { act, create } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Account from './Account';
import { accountCopy } from './account-copy';
import type { AppLocale } from '../lib/app-locale';
import { authConfig, createRecoveryCode, useRecoveryCode } from '../lib/sync';
vi.mock('../lib/sync', () => ({ authConfig: vi.fn(async () => ({ google: true, code: true })),
  createRecoveryCode: vi.fn(async () => 'test-recovery'), useRecoveryCode: vi.fn(async () => {}), signInWithGoogle: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe.each(['en', 'hi-IN', 'ta-IN'] as AppLocale[])('account safety in %s', locale => {
  const setup = () => { vi.stubGlobal('window', { location: { href: 'https://example.test/' } }); };
  it('distinguishes pending backup and refuses unsaved sign-out', async () => {
    setup(); const copy = accountCopy(locale), onSignOut = vi.fn(async () => 'unsaved' as const);
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<Account locale={locale} account={{ id: 'acct', email: 'parent@example.test' } as never}
      syncing={false} pending={true} nudge={false} onChanged={vi.fn()} onSignOut={onSignOut} />); });
    expect(JSON.stringify(tree.toJSON())).toContain(copy.pending);
    expect(JSON.stringify(tree.toJSON())).not.toContain(copy.backedUp);
    await act(async () => { await tree.root.findByType('button').props.onClick(); });
    expect(onSignOut).toHaveBeenCalledOnce(); expect(JSON.stringify(tree.toJSON())).toContain(copy.unsaved);
    tree.unmount();
  });
  it('offers recovery creation/use and shows the returned code without alteration', async () => {
    setup(); vi.mocked(authConfig).mockResolvedValue({ google: true, code: true } as never);
    const copy = accountCopy(locale), onChanged = vi.fn(); let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<Account locale={locale} account={null} syncing={false} pending={false}
      nudge={false} onChanged={onChanged} onSignOut={async () => 'ok'} />); });
    const button = (label: string) => tree.root.findAllByType('button').find(b => b.children.includes(label))!;
    act(() => button(copy.alternate).props.onClick());
    act(() => tree.root.findByType('input').props.onChange({ target: { value: 'exact-code' } }));
    await act(async () => { await tree.root.findByType('form').props.onSubmit({ preventDefault() {} }); });
    expect(useRecoveryCode).toHaveBeenCalledWith('exact-code');
    await act(async () => { await button(copy.create).props.onClick(); });
    expect(createRecoveryCode).toHaveBeenCalledOnce(); expect(tree.root.findByType('code').children).toEqual(['test-recovery']);
    expect(onChanged).toHaveBeenCalledTimes(2); tree.unmount();
  });
  it('keeps disabled backup usable locally', async () => {
    setup(); vi.mocked(authConfig).mockResolvedValueOnce({ google: false, code: false } as never);
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<Account locale={locale} account={null} syncing={false} pending={false}
      nudge={false} onChanged={vi.fn()} onSignOut={async () => 'ok'} />); });
    expect(JSON.stringify(tree.toJSON())).toContain(accountCopy(locale).unavailableDetail);
    expect(tree.root.findAllByType('button')).toHaveLength(0); tree.unmount();
  });
});
