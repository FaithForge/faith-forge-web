import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, writable: true, configurable: true });
}
if (!(global as any).crypto) {
  Object.defineProperty(global, 'crypto', { value: webcrypto, writable: true, configurable: true });
}

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'node:fs';

const currentBuildTime = Date.now();

const versionPlugin = () => ({
  name: 'generate-version-json',
  apply: 'build' as const,
  buildStart() {
    const buildInfo = {
      version: '3.0.0',
      buildTime: currentBuildTime,
      buildDate: new Date().toISOString(),
    };
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }
    fs.writeFileSync('public/version.json', JSON.stringify(buildInfo, null, 2));
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    versionPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo-iglekids.png', 'icons/*.png'],
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'Iglekids',
        short_name: 'Iglekids',
        description: 'Aplicativo para el registro y control de niños en Rios de Vida',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          'vendor-ui': [
            'lucide-react',
            'framer-motion',
            'vaul',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot',
            'sonner',
          ],
          'vendor-utils': ['axios', 'dayjs', 'luxon', 'lodash', 'qrcode'],
        },
      },
    },
  },
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    '__APP_BUILD_TIME__': currentBuildTime,
  },
});
