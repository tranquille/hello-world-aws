/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  base: "./",
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target:
          "https://yii4v9xu1h.execute-api.eu-central-1.amazonaws.com/stage",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environmentMatchGlobs: [
      // all tests in tests/dom will run in jsdom
      ["www/**test.tsx", "jsdom"],
      // all tests in tests/ with .edge.test.ts will run in edge-runtime
      ["lambdas/**spec.ts", "node"],
      // ...
    ],
    globals: true,
    transformMode: { web: [/\.[jt]sx?$/] },
    setupFiles: ["node_modules/@testing-library/jest-dom/extend-expect.js"],
    deps: { registerNodeLoader: true },
    threads: false,
    isolate: false,
  },
  build: {
    target: "esnext",
  },
  resolve: {
    conditions: ["development", "browser"],
  },
});
