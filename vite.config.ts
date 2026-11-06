import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? "/golf-battle-tracker/" : "/",
  server: { allowedHosts: ["terminal.local"] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          database: ["dexie", "dexie-react-hooks"],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Golf Battle Tracker",
        short_name: "GB Tracker",
        description: "Your game. Your progress.",
        theme_color: "#0d1416",
        background_color: "#0d1416",
        display: "standalone",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
}));
