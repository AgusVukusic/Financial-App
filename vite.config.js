import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Las llamadas al backend nunca se resuelven con el index.html del service worker
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Finanzas Personales',
        short_name: 'Finanzas',
        description: 'Controla tus gastos de forma fácil y rápida',
        theme_color: '#131311',
        background_color: '#131311',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/5501/5501360.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
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
