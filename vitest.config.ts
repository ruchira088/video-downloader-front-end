import { defineConfig } from "vitest/config"
import { bundledDependencies } from "./bundled-dependencies"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // See bundled-dependencies.ts. Shared with vite.config.ts so the two configs can't drift.
  ssr: { noExternal: bundledDependencies },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    reporters: process.env.CI ? ["default", "junit", "github-actions"] : ["default"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },
    exclude: [
      "**/node_modules/**",
      "**/build/**",
      "cdk-deploy/**"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "cobertura"],
      reportsDirectory: "./coverage",
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.d.ts",
        "app/**/*.test.{ts,tsx}",
        "app/+types/**",
        "app/entry.{client,server}.tsx",
        "app/routes.ts"
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 55,
        lines: 60
      }
    }
  },
})