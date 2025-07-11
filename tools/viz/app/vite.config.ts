import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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

    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          // runtimeCaching: [
          //   {
          //     urlPattern: ({ url }) =>
          //       url.pathname.startsWith("/api/localization/messages/v1/_search"),
          //     handler: "StaleWhileRevalidate",
          //     method: "POST",
          //     options: {
          //       cacheName: "localization-api-cache",
          //       expiration: {
          //         maxEntries: 50,
          //         maxAgeSeconds: 300, // 5 minutes
          //       },
          //       cacheableResponse: {
          //         statuses: [0, 200],
          //       },
          //       plugins: [
          //         (() => {
          //           const plugin: CustomCachePlugin = {
          //             requestWillFetch: async function ({
          //               request,
          //             }: {
          //               request: Request;
          //             }) {
          //               this._cacheableRequest = request.clone();
          //               return request;
          //             },
          //             cacheKeyWillBeUsed: async function () {
          //               if (this._cacheableRequest) {
          //                 const body = await this._cacheableRequest.json();
          //                 const key = `${
          //                   this._cacheableRequest.url
          //                 }?body=${JSON.stringify(body)}`;
          //                 // Clear the stored request after use
          //                 this._cacheableRequest = undefined;
          //                 return key;
          //               }
          //               // Fallback in case the request wasn't stored
          //               return "default-cache-key";
          //             },
          //           };
          //           return plugin;
          //         })(),
          //       ],
          //     },
          //   },
          // ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8001",
          changeOrigin: true,
        },
        "/data": {
          target: "http://localhost:8001",
          changeOrigin: true,
        },
      },
    },
  };
});
