const POLICIES = Object.freeze({
  en: Object.freeze({
    locale: 'en',
    language: 'en',
    complexScript: false,
    sentenceSeparator: /(?<=[.!?])\s+/u,
    fontFamily: 'Gentium Book Plus',
    lineHeight: 1.38,
    sample: 'Rama',
    ui: Object.freeze({
      sourceKicker: 'SOURCE CHECKED',
      ctaKicker: 'READ TONIGHT',
      cta: 'Read the complete story tonight.'
    })
  }),
  'hi-IN': Object.freeze({
    locale: 'hi-IN',
    language: 'hi',
    complexScript: true,
    sentenceSeparator: /(?<=[।!?])\s+/u,
    fontFamily: 'Tiro Devanagari Sanskrit',
    fontFile: 'TiroDevanagariSanskrit-Regular.ttf',
    lineHeight: 1.48,
    sample: 'हिन्दी',
    ui: Object.freeze({
      sourceKicker: 'स्रोत',
      ctaKicker: 'आज रात पढ़ें',
      cta: 'पूरी कहानी आज रात पढ़ें।'
    })
  })
});

export function socialLocalePolicy(locale) {
  const key = locale === 'en-US' ? 'en' : locale;
  const policy = POLICIES[key];
  if (!policy)
    throw new Error(
      `No social typography/presentation policy for ${locale}. ` +
      'Add a reviewed policy before publishing this locale.'
    );
  return policy;
}

export function supportedSocialLocales() {
  return Object.keys(POLICIES);
}
