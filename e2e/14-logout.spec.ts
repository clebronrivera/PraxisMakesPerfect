/**
 * 14 — Logout
 *
 * Verifies that clicking the logout button clears the session and returns the
 * user to the marketing / login screen.
 */

import { test, expect } from '@playwright/test';

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const hasShell = await page.locator('aside').isVisible({ timeout: 6_000 }).catch(() => false);
    if (!hasShell) test.skip(true, 'Requires assessed-user session — add TEST_ASSESSED_EMAIL to .env.test');
  });

  test('logout button is visible in the top bar or sidebar', async ({ page }) => {
    const logoutBtn = page.getByTitle('Log out').or(
      page.locator('button').filter({ hasText: /log out|sign out/i })
    );
    await expect(logoutBtn.first()).toBeVisible({ timeout: 5_000 });
  });

  test('clicking logout returns to the login / marketing screen', async ({ page }) => {
    const logoutBtn = page.getByTitle('Log out').or(
      page.locator('button').filter({ hasText: /log out|sign out/i })
    );

    if (await logoutBtn.first().isVisible()) {
      await logoutBtn.first().click();
      // After logout the app reloads and shows the marketing page
      await expect(
        page.getByRole('button', { name: 'Sign in' }).or(
          page.getByRole('heading', { name: /stop guessing|praxis/i })
        ).first()
      ).toBeVisible({ timeout: 15_000 });
    } else {
      test.skip(true, 'Logout button not found');
    }
  });

  test('reloading after logout keeps the user on the login screen', async ({ page }) => {
    const logoutBtn = page.getByTitle('Log out').or(
      page.locator('button').filter({ hasText: /log out|sign out/i })
    );

    if (await logoutBtn.first().isVisible()) {
      await logoutBtn.first().click();
      await page.waitForSelector('button:has-text("Sign in")', { timeout: 15_000 });
      await page.reload();
      // After reload — should still be on marketing/login, not back in the app
      await expect(
        page.getByRole('button', { name: 'Sign in' }).first()
      ).toBeVisible({ timeout: 10_000 });
    } else {
      test.skip(true, 'Logout button not found');
    }
  });
});
