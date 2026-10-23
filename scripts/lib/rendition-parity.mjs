/** Mechanical feature parity; semantic/native quality still requires human review. */
export function humanReviewApproved(gate) {
  if (gate?.status !== 'approved' || !gate.reviewer?.trim() || !gate.reviewedOn) return false;
  const words = new Set(gate.reviewer.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/));
  return !['chatgpt', 'openai', 'codex', 'astra', 'claude', 'gemini', 'copilot', 'gpt', 'llm', 'bot'].some(word => words.has(word));
}

export function renditionParityErrors(source, doc) {
  const errors = [];
  const expected = Object.keys(source.lengths ?? {}).sort();
  const actual = Object.keys(doc.lengths ?? {}).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    errors.push(`rendition keys ${actual.join(',') || '(none)'} must match canonical ${expected.join(',')}`);
  const reviews = Object.keys(doc.review?.nativeReadAloud ?? {}).sort();
  if (JSON.stringify(expected) !== JSON.stringify(reviews))
    errors.push(`nativeReadAloud keys ${reviews.join(',') || '(none)'} must match canonical ${expected.join(',')}`);
  for (const length of expected) {
    const rendition = doc.lengths?.[length];
    if (!rendition) continue;
    if (!rendition.blocks?.some(b => ['p', 'slow'].includes(b.t) && b.text?.trim()))
      errors.push(`${length}: no spoken story text`);
    const seconds = rendition.measuredSeconds;
    if (!Number.isInteger(seconds) || seconds < 1)
      errors.push(`${length}: measured native read-aloud timing required`);
    else if (Math.round(seconds / 60) !== source.lengths[length].minutes)
      errors.push(`${length}: measured ${seconds}s rounds to ${Math.round(seconds / 60)} min; canonical promises ${source.lengths[length].minutes} min`);
    const gate = doc.review?.nativeReadAloud?.[length];
    if (!humanReviewApproved(gate))
      errors.push(`${length}: native read-aloud lacks human approval`);
  }
  const spoken = length => (doc.lengths?.[length]?.blocks ?? []).filter(b => ['p', 'slow'].includes(b.t))
    .map(b => b.text).join(' ').replace(/\s+/g, ' ').trim();
  if (doc.lengths?.short && doc.lengths?.full && spoken('short') === spoken('full'))
    errors.push('short/full: tellings must be independently authored, not identical spoken text');
  if ((doc.close?.ifTheyAsk?.length ?? 0) !== (source.close?.ifTheyAsk?.length ?? 0))
    errors.push('If they ask: follow-up count must match canonical edition');
  return errors;
}
