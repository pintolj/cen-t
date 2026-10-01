import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const path = id.split('\\').join('/');
          if (!path.includes('node_modules')) return undefined;
          if (path.includes('lucide-react')) return 'icons';
          if (
            path.includes('recharts') ||
            path.includes('victory-vendor') ||
            /node_modules\/d3-[^/]+\//.test(path)
          ) {
            return 'charts';
          }
          if (/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'react';
          return undefined;
        },
      },
    },
  },
});
