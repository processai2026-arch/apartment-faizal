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
        // Function form (rolldown-compatible across both `npm run build` and the
        // `--outDir` deploy path; the object form fails validation under --outDir).
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|react-router)[\\/]/.test(id)) return "react-vendor";
          if (/[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id)) return "ui-vendor";
          if (/[\\/]node_modules[\\/]chart\.js[\\/]/.test(id)) return "chart-vendor";
          if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return "query-vendor";
          if (/[\\/]node_modules[\\/]zustand[\\/]/.test(id)) return "zustand-vendor";
          return undefined;
        },
      },
    },
    // Enable CSS code splitting so each async chunk only loads the CSS it needs
    cssCodeSplit: true,
  },
});
