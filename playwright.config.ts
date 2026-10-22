import { defineConfig, devices } from "@playwright/test"
import { API_URL, STORAGE_STATE_PATH } from "./e2e/environment.ts"

const PORT = 4173
const isCI = !!process.env.CI

// Set E2E_BASE_URL to run against an already-deployed front-end; otherwise the app is built
// against API_URL and served locally.
const externalBaseUrl = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: "./e2e",
  // Not the default "test-results": Vitest writes its JUnit report there, and Playwright empties it.
  outputDir: "./playwright-results",
  // The suite shares one account on a real API, so keep it gentle and predictable.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI ? [["list"], ["html", { open: "never" }], ["github"]] : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${PORT}`,
    // Traces, videos and screenshots stay local. CI uploads the report from a public repository: a
    // trace records the session cookie and every evaluated argument, including the sign-in
    // credentials, and a failure screenshot can show the email typed on the sign-in page.
    trace: isCI ? "off" : "retain-on-failure",
    video: isCI ? "off" : "retain-on-failure",
    screenshot: isCI ? "off" : "only-on-failure"
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE_PATH },
      dependencies: ["setup"]
    }
  ],

  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npm run build && node e2e/static-server.mjs build/client`,
        url: `http://localhost:${PORT}`,
        env: { VITE_API_URL: API_URL, PORT: String(PORT) },
        reuseExistingServer: !isCI,
        timeout: 300_000,
        stdout: "ignore",
        stderr: "pipe"
      }
})
