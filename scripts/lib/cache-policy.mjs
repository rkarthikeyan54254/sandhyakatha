/**
 * Runtime cache policy.
 *
 * Editorial JSON is network-first: online readers receive current reviewed
 * truth; the service-worker cache is only an offline/slow-network fallback.
 *
 * Artwork is content-addressed in the URL, so CacheFirst is safe.
 */
export const CACHE_NAMES = Object.freeze({
  stories: 'stories-v2',
  corpus: 'corpus-v2',
  art: 'story-art-v2',
  fonts: 'fonts'
});

export const RUNTIME_CACHING = [
  {
    urlPattern: /\/data\/s\/.*\.json$/,
    handler: 'NetworkFirst',
    options: {
      cacheName: CACHE_NAMES.stories,
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 300 }
    }
  },
  {
    urlPattern: /\/data\/(index|lexicon)\.json$/,
    handler: 'NetworkFirst',
    options: {
      cacheName: CACHE_NAMES.corpus,
      networkTimeoutSeconds: 3
    }
  },
  {
    urlPattern: /\/media\/stories\/[^/]+\/hero\.webp(?:\?v=[a-f0-9]{12})?$/,
    handler: 'CacheFirst',
    options: {
      cacheName: CACHE_NAMES.art,
      expiration: { maxEntries: 80 }
    }
  },
  {
    urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
    handler: 'CacheFirst',
    options: {
      cacheName: CACHE_NAMES.fonts,
      expiration: { maxEntries: 20 }
    }
  }
];
