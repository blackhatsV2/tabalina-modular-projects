import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Capacitor (Android APK) loads the built files from disk, so the service worker is only
// needed for the web version. CAPACITOR=1 skips it for the native build.
const native = process.env.CAPACITOR === "1";

export default defineConfig({
  plugins: [
    react(),
    ...(native
      ? []
      : [
          VitePWA({
            registerType: "prompt",
            includeAssets: ["icon.svg"],
            manifest: {
              name: "Budget Buddy",
              short_name: "Budget",
              description: "Personal budget planner that works offline.",
              theme_color: "#1f3864",
              background_color: "#f6f7fb",
              display: "standalone",
              start_url: "/",
              icons: [
                { src: "icon-192.png", sizes: "192x192", type: "image/png" },
                { src: "icon-512.png", sizes: "512x512", type: "image/png" },
                { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
              ],
            },
            workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2}"], navigateFallback: "/index.html" },
          }),
        ]),
  ],
  build: { target: "es2020", sourcemap: false },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
