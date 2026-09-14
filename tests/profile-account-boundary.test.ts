import { beforeEach, expect, it, vi } from 'vitest';
import handler from '../netlify/functions/profile.mts';
const storage = vi.hoisted(() => ({ getWithMetadata: vi.fn(), setJSON: vi.fn() }));
vi.mock('@netlify/blobs', () => ({ getStore: () => storage }));
vi.mock('../netlify/lib/session.mts', () => ({
  readSession: async () => ({ sub: 'account-B', kind: 'code' }),
  keyFor: () => 'B', accountId: async () => 'B'
}));
beforeEach(() => {
  vi.clearAllMocks();
  storage.getWithMetadata.mockResolvedValue(null);
  storage.setJSON.mockResolvedValue({ modified: true, etag: 'ack' });
});
const send = (owner?: string) => handler(new Request('https://test.invalid/api/profile', {
  method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    v: 1, owner, children: [], heard: {}, again: {}, activeId: null, gate: false, updatedAt: '2026-09-14T00:00:00.000Z'
  })
}), {} as never);
it('rejects an account-cookie switch between GET and PUT before touching history', async () => {
  expect((await send('A')).status).toBe(409);
  expect(storage.getWithMetadata).not.toHaveBeenCalled();
  expect(storage.setJSON).not.toHaveBeenCalled();
});
it.each(['B', undefined])('keeps same-owner and legacy unowned requests compatible (%s)', async owner => {
  expect((await send(owner)).status).toBe(200);
  expect(storage.setJSON).toHaveBeenCalledOnce();
});
