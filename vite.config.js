import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Las llamadas al backend nunca se resuelven con el index.html del service worker
        navigateFallbackDenylist: [/^\/api\//],
        // Las fuentes (Doto, Geist Mono, Hanken Grotesk) vienen de Google: sin esto, sin conexión la app cae a tipografías del sistema.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Finanzas Personales',
        short_name: 'Finanzas',
        description: 'Controla tus gastos de forma fácil y rápida',
        lang: 'es',
        start_url: '/',
        scope: '/',
        theme_color: '#131311',
        background_color: '#131311',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      }
    })
  ],
  server: {
    // Desarrollo con VITE_API_TRANSPORT=http: /api va al servidor local de `npm run dev:api`
    proxy: { '/api': 'http://127.0.0.1:5002' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  }
});
