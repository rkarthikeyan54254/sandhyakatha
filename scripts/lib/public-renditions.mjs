const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderPublicRenditions(lengths, labels, renderBlocks) {
  const order = ['full', 'short', ...Object.keys(lengths).filter(k => !['full', 'short'].includes(k))];
  return order.filter(length => lengths[length]).map(length => {
    const rendition = lengths[length];
    return `<!-- rendition:${length}:start --><details class="story-rendition" data-rendition="${esc(length)}" data-minutes="${rendition.minutes}"${length === 'full' ? ' open' : ''}><summary>${esc(labels[length] ?? length)} · ${rendition.minutes} ${esc(labels.minutes)}</summary><div class="prose">${renderBlocks(length, rendition)}</div></details><!-- rendition:${length}:end -->`;
  }).join('\n');
}

export function publicRenditionSection(html, length) {
  const start = `<!-- rendition:${length}:start -->`, end = `<!-- rendition:${length}:end -->`;
  const index = html.indexOf(start);
  if (index < 0 || html.indexOf(start, index + start.length) >= 0) return '';
  const endIndex = html.indexOf(end, index + start.length);
  return endIndex < 0 ? '' : html.slice(index + start.length, endIndex);
}

function normalized(text) { return String(text).replace(/\s+/g, ' ').trim(); }
function plainText(html) {
  return normalized(html.replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}

/** Verify actual ordered text, not only a metadata claim that a rendition exists. */
export function publicRenditionErrors(html, lengths, resolveText) {
  const errors = [];
  const actual = [...html.matchAll(/data-rendition="([^"]+)"/g)].map(m => m[1]).sort();
  if (JSON.stringify(actual) !== JSON.stringify(Object.keys(lengths).sort()))
    errors.push('public rendition choices must match canonical rendition keys');
  for (const [length, rendition] of Object.entries(lengths)) {
    const section = publicRenditionSection(html, length);
    if (!section) { errors.push(`${length}: public rendition section missing or duplicated`); continue; }
    if (!section.includes(`data-minutes="${rendition.minutes}"`)) errors.push(`${length}: public duration mismatch`);
    if (length === 'full' && !/<details\b[^>]*\sopen(?:\s|>)/.test(section))
      errors.push('full: public telling must be open by default');
    let remaining = plainText(section);
    for (const [i, block] of rendition.blocks.entries()) {
      if (block.t === 'beat') continue;
      const expected = normalized(resolveText(block.text));
      // Inline markup adds harmless whitespace around native names and speech.
      const compact = remaining.replace(/\s/g, '');
      const needle = expected.replace(/\s/g, '');
      const index = compact.indexOf(needle);
      if (index < 0) errors.push(`${length}: reviewed block ${i} missing or out of order`);
      else remaining = compact.slice(index + needle.length);
    }
    for (const [type, pattern] of [['beat', /class="beat"/g], ['aside', /<aside class="note"/g], ['slow', /class="slow"/g]]) {
      if ((section.match(pattern) ?? []).length !== rendition.blocks.filter(b => b.t === type).length)
        errors.push(`${length}: ${type} block count differs from reviewed rendition`);
    }
  }
  return errors;
}
