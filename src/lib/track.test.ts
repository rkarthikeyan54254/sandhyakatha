import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from './track';

const story = {
  story_id: 'story-1', corpus: 'ramayana', from: 'tonight', mode: 'full',
  repeat: false, one_more: false, locale: 'en'
};

afterEach(() => vi.unstubAllGlobals());

describe('analytics privacy contract', () => {
  it('keeps the product event vocabulary unchanged', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    track('story_opened', { ...story, cohort_entry: true });
    track('story_finished', story);
    track('signin_started', { method: 'google' });

    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'story_opened', expect.any(Object));
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'story_finished', expect.any(Object));
    expect(gtag).toHaveBeenNthCalledWith(3, 'event', 'signin_started', { method: 'google' });
  });

  it('keeps family identity fields outside the typed analytics boundary', () => {
    if (false) {
      // @ts-expect-error child data is intentionally outside the analytics contract
      track('story_opened', { ...story, child_name: 'A' });
      // @ts-expect-error account ids are intentionally outside the analytics contract
      track('signin_started', { method: 'google', account_id: '123' });
      // @ts-expect-error retention belongs only on story_opened
      track('story_finished', { ...story, d14_return: true });
    }
    expect(true).toBe(true);
  });
});
