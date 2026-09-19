/**
 * Anonymous, browser-local D14 retention measurement.
 *
 * This state is deliberately separate from family profiles and account sync.
 * It stores only local calendar dates, never child/account identity or story
 * content. If storage is unavailable or corrupt, reading must still work.
 */
export type RetentionParams = {
  cohort_entry?: true;
  d14_return?: true;
  days_since_first_open?: number;
};

type RetentionState = {
  v: 1;
  firstStoryOpenDate: string;
  d14QualifiedDate?: string;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'sandhyakatha.retention.v1';
const DAY_MS = 86_400_000;

function localDateKey(date: Date): string | null {
  if (!Number.isFinite(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayNumber(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d)
    return null;
  return Math.floor(utc.getTime() / DAY_MS);
}

function parseState(raw: string, todayDay: number): RetentionState | null {
  try {
    const x = JSON.parse(raw) as Partial<RetentionState> | null;
    if (!x || x.v !== 1 || typeof x.firstStoryOpenDate !== 'string') return null;
    const firstDay = dayNumber(x.firstStoryOpenDate);
    if (firstDay === null || firstDay > todayDay) return null;

    if (x.d14QualifiedDate !== undefined) {
      if (typeof x.d14QualifiedDate !== 'string') return null;
      const qualifiedDay = dayNumber(x.d14QualifiedDate);
      if (qualifiedDay === null || qualifiedDay > todayDay) return null;
      const qualifiedAfter = qualifiedDay - firstDay;
      if (qualifiedAfter < 1 || qualifiedAfter > 14) return null;
    }

    return x as RetentionState;
  } catch {
    return null;
  }
}

function browserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function save(storage: StorageLike, state: RetentionState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Record one successful story open and return metadata for story_opened. */
export function recordStoryOpen(now: Date = new Date(), storageOverride?: StorageLike | null): RetentionParams {
  const today = localDateKey(now);
  if (!today) return {};
  const todayDay = dayNumber(today);
  if (todayDay === null) return {};

  const storage = storageOverride === undefined ? browserStorage() : storageOverride;
  if (!storage) return {};

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {};
  }

  const fresh: RetentionState = { v: 1, firstStoryOpenDate: today };
  if (raw === null) return save(storage, fresh) ? { cohort_entry: true } : {};

  const state = parseState(raw, todayDay);
  if (!state) return save(storage, fresh) ? { cohort_entry: true } : {};

  const firstDay = dayNumber(state.firstStoryOpenDate);
  if (firstDay === null) return {};
  const daysSinceFirstOpen = todayDay - firstDay;

  if (daysSinceFirstOpen < 1 || daysSinceFirstOpen > 14 || state.d14QualifiedDate)
    return {};

  const qualified: RetentionState = { ...state, d14QualifiedDate: today };
  if (!save(storage, qualified)) return {};

  return { d14_return: true, days_since_first_open: daysSinceFirstOpen };
}
