/**
 * Three events, because three questions are worth answering.
 *
 * GA already measures acquisition, page views and returning users. We add only
 * the product actions it cannot infer: whether a parent opened a story, whether
 * they finished it, and sign-in intent. Story events carry low-cardinality
 * context (`from`, `mode`, `repeat`, `one_more`, corpus and story id) so the
 * acquisition → read → finish funnel can be analysed without collecting child
 * names, ages, account ids or free text. Analytics must stay measurement-only.
 */
type Params = Record<string, string | number | boolean>;

export function track(event: 'story_opened' | 'story_finished' | 'signin_started', params: Params = {}) {
  try {
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    g?.('event', event, params);
  } catch { /* analytics must never break bedtime */ }
}
