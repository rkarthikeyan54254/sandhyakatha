import { describe, expect, it } from 'vitest';
import { recordStoryOpen } from './retention';

type MemoryStorage = Pick<Storage, 'getItem' | 'setItem'> & { raw: () => string | null };

function memoryStorage(initial: string | null = null): MemoryStorage {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    raw: () => value
  };
}

const atDay = (day: number) => new Date(2026, 8, day, 20, 0, 0);

describe('D14 returning-reader measurement', () => {
  it('enters the anonymous browser cohort on the first story open', () => {
    const storage = memoryStorage();
    expect(recordStoryOpen(atDay(1), storage)).toEqual({ cohort_entry: true });
    expect(JSON.parse(storage.raw()!)).toEqual({ v: 1, firstStoryOpenDate: '2026-09-01' });
  });

  it('does not call a same-day second story retention', () => {
    const storage = memoryStorage();
    recordStoryOpen(atDay(1), storage);
    expect(recordStoryOpen(atDay(1), storage)).toEqual({});
  });

  it('qualifies a next-day return exactly once', () => {
    const storage = memoryStorage();
    recordStoryOpen(atDay(1), storage);
    expect(recordStoryOpen(atDay(2), storage)).toEqual({ d14_return: true, days_since_first_open: 1 });
    expect(recordStoryOpen(atDay(3), storage)).toEqual({});
  });

  it('includes day 14', () => {
    const storage = memoryStorage();
    recordStoryOpen(atDay(1), storage);
    expect(recordStoryOpen(atDay(15), storage)).toEqual({ d14_return: true, days_since_first_open: 14 });
  });

  it('excludes day 15', () => {
    const storage = memoryStorage();
    recordStoryOpen(atDay(1), storage);
    expect(recordStoryOpen(atDay(16), storage)).toEqual({});
  });

  it('resets malformed and future state without throwing', () => {
    const malformed = memoryStorage('{not-json');
    expect(recordStoryOpen(atDay(2), malformed)).toEqual({ cohort_entry: true });

    const badDate = memoryStorage(JSON.stringify({ v: 1, firstStoryOpenDate: '2026-02-31' }));
    expect(recordStoryOpen(atDay(2), badDate)).toEqual({ cohort_entry: true });

    const future = memoryStorage(JSON.stringify({ v: 1, firstStoryOpenDate: '2099-01-01' }));
    expect(recordStoryOpen(atDay(2), future)).toEqual({ cohort_entry: true });
  });

  it('fails closed when localStorage is absent or inaccessible', () => {
    expect(recordStoryOpen(atDay(2), null)).toEqual({});
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); }
    };
    expect(() => recordStoryOpen(atDay(2), blocked)).not.toThrow();
    expect(recordStoryOpen(atDay(2), blocked)).toEqual({});
  });

  it('does not emit a cohort or return marker when persistence fails', () => {
    const blockedWrite = {
      getItem: () => null,
      setItem: () => { throw new Error('blocked'); }
    };
    expect(recordStoryOpen(atDay(1), blockedWrite)).toEqual({});
  });

  it('stores dates only, never story, child, account or free-text data', () => {
    const storage = memoryStorage();
    recordStoryOpen(atDay(1), storage);
    expect(Object.keys(JSON.parse(storage.raw()!)).sort()).toEqual(['firstStoryOpenDate', 'v']);
  });
});
