import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    "process.env.API_KEY": JSON.stringify(process.env.API_KEY || ""),
    "process.env.ADMIN_HARDCODED": JSON.stringify(
      process.env.ADMIN_HARDCODED || "",
    ),
    "process.env.KEYSTATIC_GITHUB_CLIENT_ID": JSON.stringify(
      process.env.KEYSTATIC_GITHUB_CLIENT_ID || "",
    ),
    "process.env.KEYSTATIC_GITHUB_CLIENT_SECRET": JSON.stringify(
      process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || "",
    ),
    "process.platform": JSON.stringify("browser"),
    "process.version": JSON.stringify(""),
  },
  server: {
    fs: {
      allow: [".."],
    },
    hmr: {
      overlay: false,
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
  },
});
