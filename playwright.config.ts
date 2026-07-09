import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for PASS.
 *
 * Boots the Vite dev server (port 5173) with STUB Supabase creds injected via
 * `webServer.env` — self-contained, no `.env.local` needed. The stub creds let
 * the unauthenticated landing/login flow render and be tested end-to-end; the
 * authenticated critical-path specs (assessment / practice) are gated behind
 * real `E2E_EMAIL` / `E2E_PASSWORD` env for a throwaway test account and skip
 * cleanly when those are absent (see e2e/README.md).
 *
 * Run: `npm run test:e2e` (headless) · `npm run test:e2e:ui` (watch).
 * Not part of `npm test` / `npm run check` — E2E needs a browser + running
 * server, so it stays an explicit opt-in and doesn't slow the unit CI.
 */
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Fail the build on a stray `test.only` in CI.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Vite reads VITE_*-prefixed vars from the process environment, so these
    // stubs boot the app without a real .env.local. They never make network
    // calls succeed — auth simply fails closed, which is fine for the public
    // flow. Authenticated specs supply real creds via E2E_EMAIL/E2E_PASSWORD.
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'https://stub.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_stub_for_e2e',
    },
  },
});
