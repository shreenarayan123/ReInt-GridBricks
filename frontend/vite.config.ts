/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// In dev, /api is proxied to the FastAPI backend (uvicorn app.main:app). Override with API_URL
// (shell variable or .env / .env.local).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = process.env.API_URL ?? env.API_URL ?? "http://localhost:8000";
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: { "/api": { target: apiUrl, rewrite: (p: string) => p.replace(/^\/api/, "") } },
    },
    test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], globals: false },
  };
});
