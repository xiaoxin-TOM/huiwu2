import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    server: {
      deps: {
        // next-auth imports next/server without the .js extension which fails
        // in strict ESM; inlining through Vite's bundler resolves CJS/ESM interop.
        inline: ["next-auth", "@auth/core"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Ensure next/server resolves without extension in test environment
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
    },
  },
});
