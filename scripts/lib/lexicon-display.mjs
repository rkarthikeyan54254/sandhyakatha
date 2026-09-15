/**
 * Canonical story text stores lexicon entity keys inside guillemets.
 * Consumer surfaces may show a friendlier spelling via lexicon.display.
 */
export function displayTerm(lexicon, term) {
  const display = lexicon?.[term]?.display;
  return typeof display === 'string' && display.trim() ? display : term;
}

export function audienceText(text, lexicon) {
  return String(text)
    .replace(/«([^»]+)»/g, (_, term) => displayTerm(lexicon, term))
    .replace(/_([^_]+)_/g, '$1');
}

export function lexiconTerms(text) {
  return [...String(text).matchAll(/«([^»]+)»/g)].map(m => m[1]);
}
