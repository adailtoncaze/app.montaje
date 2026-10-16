import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'MontaJE — Montagem de Seções',
        short_name: 'MontaJE',
        description: 'Guia de montagem e evidências das seções eleitorais.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f5f5',
        theme_color: '#5b5fc7',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icone.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'referencias',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          fluent: ['@fluentui/react-components', '@fluentui/react-icons'],
          dados: [
            '@supabase/supabase-js',
            'dexie',
            'dexie-react-hooks',
            '@tanstack/react-query',
          ],
        },
      },
    },
  },
  // `host: true` escuta também na rede local (0.0.0.0), permitindo abrir o app
  // pelo celular/tablet usando o IP do computador (ex.: http://192.168.0.10:5173).
  server: { port: 5173, host: true },
});
