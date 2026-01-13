
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env.ADMIN_HARDCODED': JSON.stringify(process.env.ADMIN_HARDCODED || ""),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      // Ensure we don't try to bundle Node.js internals
      external: [],
    }
  },
  // Prevent Vite from trying to optimize or resolve Node-only packages during dev/build
  optimizeDeps: {
    include: ['react', 'react-dom', '@google/genai']
  }
});
