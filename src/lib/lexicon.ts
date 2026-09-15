import type { Lexicon } from './types';

export function displayTerm(lex: Lexicon, term: string): string {
  const display = lex[term]?.display;
  return display?.trim() ? display : term;
}
