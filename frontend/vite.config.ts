import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Use esbuild (Vite default) — no separate terser dependency needed
    minify: "esbuild",
    // Disable source maps in production for smaller output
    sourcemap: false,
    // Raise warning threshold; large deps are expected given the feature set
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Radix UI component library
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-dropdown-menu",
          ],
          // Charting — chart.js is large (~180 KB), isolate it
          "chart-vendor": ["chart.js"],
          // React Query
          "query-vendor": ["@tanstack/react-query"],
          // State management
          "zustand-vendor": ["zustand"],
        },
      },
    },
    // Enable CSS code splitting so each async chunk only loads the CSS it needs
    cssCodeSplit: true,
  },
});
