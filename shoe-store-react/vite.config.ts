import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5001,
    allowedHosts: [
      "https://jeffery-thermotactic-unformidably.ngrok-free.dev",
      "jeffery-thermotactic-unformidably.ngrok-free.dev",
      ".ngrok-free.app", // Allow all ngrok subdomains
      "localhost",
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
});
