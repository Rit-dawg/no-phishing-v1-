
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    // Inject environment variables directly into the global scope
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env.ADMIN_HARDCODED': JSON.stringify(process.env.ADMIN_HARDCODED || ""),
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      // Force ignore these modules if they are somehow pulled in
      external: ['fsevents', 'fs', 'path', 'source-map-js'],
    }
  },
  optimizeDeps: {
    // Do not try to optimize keystatic or rollup-related bits
    exclude: ['@keystatic/core', 'rollup', 'fsevents']
  }
});
