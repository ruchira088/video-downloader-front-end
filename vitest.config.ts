import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
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
      reporter: ["text", "html", "lcov", "json-summary", "json"],
      reportsDirectory: "./coverage",
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.d.ts",
        "app/**/*.test.{ts,tsx}",
        "app/+types/**",
        "app/entry.{client,server}.tsx",
        "app/routes.ts",
        "app/models/FrontendServiceInformation.ts",
        // Files using complex Option.map patterns that are difficult to unit test
        "app/pages/authenticated/videos/video-page/VideoPage.tsx",
        "app/pages/authenticated/service-information/**/*.tsx"
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