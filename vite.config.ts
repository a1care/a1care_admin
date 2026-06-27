import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    proxy: {
      // Dev-only: forward API calls to production server-side so the browser
      // makes a same-origin request (localhost:5173) and never hits CORS.
      "/api": {
        target: "https://api.a1carehospital.in",
        changeOrigin: true,
        secure: true
      }
    }
  }
});
