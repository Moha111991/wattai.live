import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5175,
    allowedHosts: [
      'https://nodes-magnet-launch-higher.trycloudflare.com',
      'https://estimated-inkjet-disabled-forget.trycloudflare.com',
      'localhost',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/offline.html',
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /\/assets\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: ({request}) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 3 }
          },
          {
            urlPattern: ({url}) => url.pathname.startsWith('/devices') || url.pathname.startsWith('/ai') || url.pathname.startsWith('/ev'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 3 }
          },
          {
            urlPattern: /\/assets\/\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'assets', networkTimeoutSeconds: 3 }
          }
        ]
      },
      manifest: {
  name: 'WattAI',
  short_name: 'WattAI',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4CAF50'
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.{ts,tsx}']
  }
})
