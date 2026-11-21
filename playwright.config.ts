import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PW_PORT || 3210);
const baseURL = process.env.PW_BASE_URL || `http://localhost:${PORT}`;

// Dummy connection values: the pages under test render without the database
// (the root layout falls back when it cannot connect), so no real secret is needed.
const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://pwlocaltest.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "pw-local-test",
  DATABASE_URL: "postgresql://postgres.pwlocaltest:pw@127.0.0.1:1/postgres",
  DIRECT_URL: "postgresql://postgres.pwlocaltest:pw@127.0.0.1:1/postgres",
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    ...devices["Pixel 7"],
    locale: "th-TH",
  },
  projects: [{ name: "mobile-chromium" }],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: `npx next dev --port ${PORT}`,
        url: `${baseURL}/pin`,
        timeout: 180_000,
        reuseExistingServer: true,
        env: testEnv,
      },
});
