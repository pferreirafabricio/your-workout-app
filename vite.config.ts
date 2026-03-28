import { defineConfig } from "vitest/config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const isTest = !!process.env.VITEST;

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    !isTest && tailwindcss(),
    !isTest && tanstackStart(),
    !isTest &&
      nitro({
        preset: "node-server",
      }),
    viteReact(),
  ].filter(Boolean),
  test: {
    globals: true,
    environment: "jsdom",
    css: true,
  },
  build: {
    sourcemap: process.env.ENVIRONMENT === "development" || process.env.ENVIRONMENT === "test",
  },
  server: {
    allowedHosts: ["onboarding.abacus.local"],
    watch: { usePolling: true },
  },
});

export default config;
