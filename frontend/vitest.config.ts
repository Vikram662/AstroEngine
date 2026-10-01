import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      SESSION_SECRET: "test-session-secret-0123456789abcdef",
      ASTRO_INTERNAL_SECRET: "test-internal-secret",
      ASTRO_INTERNAL_API_KEY: "ak_live_test_internal",
    },
  },
});
