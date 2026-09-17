/**
 * One locale URL contract, two publication lanes.
 *
 * Preview editions are deliberately noindex and may still be in review:
 *   /preview/<story>/<lang>/
 *
 * A reviewed edition may later be promoted to:
 *   /s/<story>/<lang>/
 *
 * Defining the public shape here does not emit a public locale page. The
 * preview gates explicitly fail if that path appears before promotion.
 */
export function localeLanguage(locale) {
  return String(locale ?? '').split('-')[0];
}

export function previewLocaleHref(storyId, locale) {
  return `/preview/${storyId}/${localeLanguage(locale)}/`;
}

export function publicLocaleHref(storyId, locale) {
  return `/s/${storyId}/${localeLanguage(locale)}/`;
}
