/**
 * global-setup.ts
 *
 * Runs once before the full Playwright suite. Creates two authenticated
 * browser sessions and saves their localStorage + cookies to disk:
 *
 *   e2e/.auth/assessed.json   — user who has completed the adaptive diagnostic
 *   e2e/.auth/unassessed.json — user who has NOT yet completed the diagnostic
 *
 * Both accounts are read from .env.test (gitignored). If a credential pair is
 * missing, that auth file is skipped and the tests that depend on it will be
 * skipped automatically.
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ASSESSED_EMAIL    = process.env.TEST_ASSESSED_EMAIL    ?? process.env.TEST_USER_EMAIL ?? '';
const ASSESSED_PASSWORD = process.env.TEST_ASSESSED_PASSWORD ?? process.env.TEST_USER_PASSWORD ?? '';
const UNASSESSED_EMAIL    = process.env.TEST_UNASSESSED_EMAIL    ?? '';
const UNASSESSED_PASSWORD = process.env.TEST_UNASSESSED_PASSWORD ?? '';

const AUTH_DIR = path.join(__dirname, '.auth');

/** Sign in and save storage state to `outputPath`. */
async function authenticate(
  email: string,
  password: string,
  outputPath: string,
  label: string,
): Promise<void> {
  if (!email || !password) {
    console.warn(`[global-setup] No credentials for ${label} — skipping auth. Tests using this state will be skipped.`);
    // Write an empty storage state so Playwright doesn't fail on missing file
    fs.writeFileSync(outputPath, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page    = await context.newPage();

  console.log(`[global-setup] Authenticating ${label} (${email})…`);

  await page.goto('http://localhost:5173');

  // Open the login modal via the top-nav "Sign in" button
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 10_000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Submit and wait for the app shell (sidebar) or pre-assessment gateway
  await page.getByRole('button', { name: 'Sign in' }).last().click();

  await page.waitForSelector(
    'aside, [data-testid="pre-assessment-gateway"], h2:has-text("Welcome"), h2:has-text("Baseline"), button:has-text("Start Diagnostic")',
    { timeout: 20_000 },
  );

  await context.storageState({ path: outputPath });
  console.log(`[global-setup] ${label} auth saved → ${outputPath}`);

  await browser.close();
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  // Load .env.test if it exists (for local dev — CI sets env vars directly)
  const envTestPath = path.join(__dirname, '..', '.env.test');
  if (fs.existsSync(envTestPath)) {
    const lines = fs.readFileSync(envTestPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = val;
    }
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await authenticate(
    process.env.TEST_ASSESSED_EMAIL    ?? process.env.TEST_USER_EMAIL    ?? '',
    process.env.TEST_ASSESSED_PASSWORD ?? process.env.TEST_USER_PASSWORD ?? '',
    path.join(AUTH_DIR, 'assessed.json'),
    'assessed-user',
  );

  await authenticate(
    process.env.TEST_UNASSESSED_EMAIL    ?? '',
    process.env.TEST_UNASSESSED_PASSWORD ?? '',
    path.join(AUTH_DIR, 'unassessed.json'),
    'unassessed-user',
  );
}
