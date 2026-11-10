import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// Three build targets share one codebase:
//   npm run build            -> dist/            (website + installable offline PWA)
//   npm run build:extension  -> extension/app/   (Chrome/Edge/Firefox extension, MV3)
export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension';
  return {
    base: './', // relative asset URLs: works on any host path, file://, and chrome-extension://
    resolve: { alias: isExtension ? { 'virtual:pwa-register': fileURLToPath(new URL('./src/lib/pwa-stub.js', import.meta.url)) } : {} },
    plugins: [
      react(),
      !isExtension &&
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false, // we register manually in main.jsx
          includeAssets: ['icon.svg', 'icons/*.png'],
          manifest: {
            name: 'OffKit — tools that work offline',
            short_name: 'OffKit',
            description: 'Image, video, PDF, audio, text and developer tools that run entirely on your device. No uploads, no internet needed.',
            theme_color: '#0a0b10',
            background_color: '#0a0b10',
            display: 'standalone',
            start_url: './',
            scope: './',
            icons: [
              { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm,mjs,ico,webmanifest}'],
            maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
            navigateFallback: 'index.html',
            cleanupOutdatedCaches: true,
          },
        }),
    ].filter(Boolean),
    build: {
      outDir: isExtension ? 'extension/app' : 'dist',
      emptyOutDir: true,
      target: 'es2022',
      chunkSizeWarningLimit: 2500,
      assetsInlineLimit: 0, // keep wasm/worker assets as real files (extension CSP friendly)
    },
    server: { port: 5173, host: true },
    preview: { port: 4173, host: true },
    define: { __EXTENSION__: JSON.stringify(isExtension) },
  };
});
