
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
    rollupOptions: {
      external: ['fsevents'],
    }
  },
  optimizeDeps: {
    exclude: ['fsevents']
  }
});
