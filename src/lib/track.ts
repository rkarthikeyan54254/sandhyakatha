/**
 * Three events, because three questions are worth answering.
 *
 * Not pageviews. The only numbers that decide whether this is a business are:
 * does a parent open a story, do they finish it, and do they come back. GA
 * counts returning users on its own, so we send the first two and the sign-in
 * intent, and nothing else. No child name, no age, no free text — ever.
 */
type Params = Record<string, string | number | boolean>;

export function track(event: 'story_opened' | 'story_finished' | 'signin_started', params: Params = {}) {
  try {
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    g?.('event', event, params);
  } catch { /* analytics must never break bedtime */ }
}
