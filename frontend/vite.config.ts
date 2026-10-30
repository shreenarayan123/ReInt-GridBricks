/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In dev, /api is proxied to the FastAPI backend (uvicorn app.main:app). Override with API_URL.
const apiUrl = process.env.API_URL ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": { target: apiUrl, rewrite: (p) => p.replace(/^\/api/, "") } },
  },
  test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], globals: false },
});
