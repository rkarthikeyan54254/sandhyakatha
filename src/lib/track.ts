import type { RetentionParams } from './retention';

/**
 * Three events, because three questions are worth answering.
 *
 * GA already measures acquisition and page views. We add only the product
 * actions it cannot infer: whether a parent opened a story, whether they
 * finished it, and sign-in intent. D14 retention rides on story_opened as
 * three low-cardinality fields; it never adds an identity event or identifier.
 * Analytics stays measurement-only: no child name/age, account id or free text
 * is accepted by these event parameter types.
 */
type StoryEventParams = {
  story_id: string;
  corpus: string;
  from: string;
  mode: string;
  repeat: boolean;
  one_more: boolean;
  locale: string;
};

export type StoryOpenedParams = StoryEventParams & RetentionParams;
export type StoryFinishedParams = StoryEventParams;
export type SigninStartedParams = { method: string };
export type AnalyticsEvent = 'story_opened' | 'story_finished' | 'signin_started';

type Params = Record<string, string | number | boolean>;

export function track(event: 'story_opened', params?: StoryOpenedParams): void;
export function track(event: 'story_finished', params?: StoryFinishedParams): void;
export function track(event: 'signin_started', params?: SigninStartedParams): void;
export function track(event: AnalyticsEvent, params: Params = {}) {
  try {
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    g?.('event', event, params);
  } catch { /* analytics must never break bedtime */ }
}
