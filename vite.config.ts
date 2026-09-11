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
        // Otherwise "Continue with Google" is swallowed: the SW treats
        // /api/auth/start as a SPA navigation and serves index.html.
      // The React app has no client-side URL routes: it lives at /.
      // Every other navigation may be a real static story, festival or SEO page.
       navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/$/],
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
