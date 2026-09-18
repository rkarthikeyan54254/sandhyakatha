/**
 * Parse the public campaign CLI once, with regression coverage in the workflow gate.
 * Keep locale option parsing out of the publishing runner itself.
 */
export function parseCampaignArgs(argv) {
  const args = [...argv];
  const checkOnly = args.includes('--check');
  const openReview = args.includes('--open');
  const all = args.includes('--all');
  const localeAt = args.indexOf('--locale');
  const requestedLocale = localeAt >= 0 ? args[localeAt + 1] : null;

  if (localeAt >= 0 && (!requestedLocale || requestedLocale.startsWith('--')))
    throw new Error('--locale requires a locale such as hi-IN or en');

  const positional = args.filter((arg, i) =>
    !arg.startsWith('--') && (localeAt < 0 || i !== localeAt + 1)
  );

  return {
    checkOnly,
    openReview,
    all,
    requestedLocale,
    id: positional[0] ?? null
  };
}
