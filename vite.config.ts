import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'mapa-neo.png'],
        manifest: {
          name: 'PinPro',
          short_name: 'PinPro',
          description: 'Marketplace de servicios con alta performance',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📍</text></svg>',
              sizes: '192x192',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firestore-data-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/rastertiles\/voyager\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pinpro-offline-tiles-v1',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pinpro-offline-tiles-v1',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|woff2)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async', 'lucide-react'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            leaflet: ['leaflet', 'react-leaflet', 'react-leaflet-cluster', 'leaflet.markercluster'],
            ui: ['motion', 'date-fns', 'clsx', 'tailwind-merge', 'dompurify'],
            i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend']
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        protocol: 'ws',
        host: 'localhost',
        clientPort: 3000,
        overlay: false
      },
      watch: {
        usePolling: true
      },
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
