import { defineConfig, devices } from "@playwright/test";

/**
 * Tracker Suite E2E.
 *
 * Runs against a production Next server with NEXT_PUBLIC_SUPABASE_* blanked,
 * which flips the app into local mode: auth is open (RequireAuth passes when
 * `!configured`), cloud sync is off, and every tracker works off localStorage.
 *
 * Each test seeds its own localStorage via addInitScript — no cross-test
 * pollution, no sign-in flow to mock.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: "http://127.0.0.1:4111",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command:
      "NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= ./node_modules/.bin/next start -p 4111",
    url: "http://127.0.0.1:4111/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
