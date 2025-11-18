import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5001,
    allowedHosts: [
      "504cbe621956.ngrok-free.app",
      "b92a22a3f13d.ngrok-free.app",
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
