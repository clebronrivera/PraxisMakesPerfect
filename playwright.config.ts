import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright E2E configuration for Praxis Makes Perfect.
 *
 * Auth strategy:
 *   - global-setup.ts authenticates once with each test account and saves
 *     storageState (localStorage + cookies) to e2e/.auth/
 *   - Individual spec files pick up the right state via `use.storageState`
 *
 * Running:
 *   npm run test:e2e          — headless, all tests
 *   npm run test:e2e:ui       — Playwright UI mode (visual runner)
 *   npm run test:e2e:headed   — headed browser (watch tests run)
 */

export const STORAGE_STATE_ASSESSED   = path.join(__dirname, 'e2e/.auth/assessed.json');
export const STORAGE_STATE_UNASSESSED = path.join(__dirname, 'e2e/.auth/unassessed.json');

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry once on CI to reduce flake impact */
  retries: process.env.CI ? 1 : 0,

  /* Reporter — pretty in dev, HTML on CI */
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],

  /* Global test settings */
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  /* Auto-start the Vite dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  /* Run auth setup before all tests */
  globalSetup: './e2e/global-setup.ts',

  /* Projects — one for each auth state, plus an unauthenticated project */
  projects: [
    {
      name: 'unauthenticated',
      testMatch: '**/01-login.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'assessed-user',
      testMatch: [
        '**/04-dashboard-home.spec.ts',
        '**/05-practice-hub.spec.ts',
        '**/06-practice-session.spec.ts',
        '**/07-results-dashboard.spec.ts',
        '**/08-study-guide.spec.ts',
        '**/09-ai-tutor.spec.ts',
        '**/10-glossary.spec.ts',
        '**/11-learning-path.spec.ts',
        '**/12-redemption-rounds.spec.ts',
        '**/13-admin-dashboard.spec.ts',
        '**/14-logout.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_ASSESSED,
      },
    },
    {
      name: 'unassessed-user',
      testMatch: '**/02-pre-assessment-gateway.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_UNASSESSED,
      },
    },
    {
      name: 'unassessed-user-diagnostic',
      testMatch: '**/03-adaptive-diagnostic.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_UNASSESSED,
      },
    },
  ],
});
