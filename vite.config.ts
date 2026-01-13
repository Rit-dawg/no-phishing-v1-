
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export default defineConfig(({ mode }) => {
  const _filename = fileURLToPath(import.meta.url);
  const _dirname = dirname(_filename);
  const env = loadEnv(mode, _dirname, '');
  
  return {
    base: './',
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ""),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});
