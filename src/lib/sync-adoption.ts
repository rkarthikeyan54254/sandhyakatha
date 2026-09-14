import type { Profile } from './profile';

/** Compare the request snapshot, not unrelated device/server wall clocks. */
export function sameSnapshot(a: Profile, b: Profile): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/** Shared by App and regression tests; never merge across a late UI boundary. */
export function adoptSnapshot(current: Profile, snapshot: Profile, next: Profile,
  requestGeneration: number, currentGeneration: number): Profile {
  return requestGeneration === currentGeneration && sameSnapshot(current, snapshot) ? next : current;
}
