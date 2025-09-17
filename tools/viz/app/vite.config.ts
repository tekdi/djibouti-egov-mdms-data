import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Set base URL based on environment
  const base = mode === "production" ? "./" : "/";

  return {
    // Set base URL for production deployment
    base,

    // Build configuration for production
    build: {
      outDir: "dist",
      assetsDir: "assets",
      rollupOptions: {
        output: {
          // Ensure consistent asset naming
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          // Optimize chunk splitting for Mermaid
          manualChunks: {
            mermaid: ["mermaid"],
            svgPanZoom: ["svg-pan-zoom"],
          },
        },
      },
      // Optimize for production
      minify: "terser",
      sourcemap: false,
      target: "es2015",
    },

    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:9001",
          changeOrigin: true,
        },
        "/data": {
          target: "http://localhost:9001",
          changeOrigin: true,
        },
      },
    },
  };
});
