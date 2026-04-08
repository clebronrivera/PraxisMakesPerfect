/**
 * Shared auth helpers and custom fixtures for Playwright tests.
 *
 * Usage in a spec file:
 *   import { test, expect } from '../fixtures/auth';
 */

import { test as base } from '@playwright/test';

/** Extend `test` with convenience helpers if needed in the future. */
export const test = base;
export { expect } from '@playwright/test';

/** Wait for the main app shell sidebar to be visible. */
export async function waitForAppShell(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForSelector('aside', { timeout: 15_000 });
}

/** Wait for the pre-assessment gateway screen. */
export async function waitForGateway(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForSelector('button:has-text("Start Diagnostic"), button:has-text("Try a Random Question")', {
    timeout: 15_000,
  });
}

/**
 * Returns true if the app shell (sidebar) is visible — i.e. user is authenticated.
 * Use this in beforeEach to conditionally skip:
 *
 *   test.beforeEach(async ({ page }) => {
 *     await page.goto('/');
 *     if (!(await isAppShellVisible(page))) test.skip(true, 'Needs assessed-user auth');
 *   });
 */
export async function isAppShellVisible(page: import('@playwright/test').Page): Promise<boolean> {
  return page.locator('aside').isVisible({ timeout: 5_000 }).catch(() => false);
}

/** Returns true if the pre-assessment gateway is visible (unassessed user). */
export async function isGatewayVisible(page: import('@playwright/test').Page): Promise<boolean> {
  return page
    .locator('button:has-text("Start Diagnostic")')
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
}

/** Navigate to a named sidebar section by clicking its button. */
export async function goToSection(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  await page.getByRole('button', { name: label }).click();
}
