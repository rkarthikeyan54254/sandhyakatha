import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,               // public/manifest.webmanifest is hand-written
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          // A story downloaded once must still be there on a flight.
          { urlPattern: /\/data\/s\/.*\.json$/, handler: 'CacheFirst',
            options: { cacheName: 'stories', expiration: { maxEntries: 300 } } },
          { urlPattern: /\/data\/(index|lexicon)\.json$/, handler: 'StaleWhileRevalidate',
            options: { cacheName: 'corpus' } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20 } } }
        ]
      }
    })
  ],
  test: { environment: 'node' }
});
