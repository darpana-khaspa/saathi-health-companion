import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function pwaServiceWorkerPlugin() {
  return {
    name: 'pwa-service-worker-plugin',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const assetsDir = path.resolve(distDir, 'assets');
      const swSrcPath = path.resolve(__dirname, 'public', 'sw.js');
      const swDistPath = path.resolve(distDir, 'sw.js');

      let assetFiles: string[] = [];
      if (fs.existsSync(assetsDir)) {
        assetFiles = fs.readdirSync(assetsDir).map((file) => `/assets/${file}`);
      }

      if (fs.existsSync(swSrcPath)) {
        let swContent = fs.readFileSync(swSrcPath, 'utf-8');
        const cacheList = [
          '/',
          '/index.html',
          '/manifest.json',
          '/icon.svg',
          ...assetFiles,
        ];
        swContent = swContent.replace(
          /const ASSETS_TO_CACHE = \[[\s\S]*?\];/,
          `const ASSETS_TO_CACHE = ${JSON.stringify(cacheList, null, 2)};`
        );
        fs.writeFileSync(swDistPath, swContent, 'utf-8');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pwaServiceWorkerPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
