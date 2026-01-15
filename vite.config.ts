import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Using relative base to ensure assets load correctly on GitHub Pages subfolders
  base: "./",
  plugins: [react()],
  define: {
    // Stringify variables so they are replaced as literals in the bundled code
    "process.env.API_KEY": JSON.stringify(process.env.API_KEY || ""),
    "process.env.ADMIN_HARDCODED": JSON.stringify(
      process.env.ADMIN_HARDCODED || "",
    ),
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production",
    ),
  },
  server: {
    fs: {
      allow: ["."],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        cms: resolve(__dirname, "cms.html"),
      },
    },
  },
});
