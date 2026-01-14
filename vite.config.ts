import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Modern ES Module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    "process.env.API_KEY": JSON.stringify(process.env.API_KEY || ""),
    "process.env.ADMIN_HARDCODED": JSON.stringify(
      process.env.ADMIN_HARDCODED || "",
    ),
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
    "process.platform": JSON.stringify("browser"),
    "process.version": JSON.stringify(""),
    "process.browser": true,
  },
  server: {
    fs: {
      allow: ["."],
    },
  },
  resolve: {
    alias: {
      path: "path-browserify",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        cms: resolve(__dirname, "cms.html"),
      },
    },
  },
});
