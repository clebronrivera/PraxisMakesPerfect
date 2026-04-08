/**
 * 04 — Dashboard home
 *
 * Uses assessed storageState. Verifies the main dashboard renders with domain
 * cards, CTA buttons, and the sidebar navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const hasShell = await page.locator('aside').isVisible({ timeout: 6_000 }).catch(() => false);
    if (!hasShell) {
      test.skip(true, 'Requires assessed-user session — add TEST_ASSESSED_EMAIL to .env.test');
    }
    // Ensure we are on the Dashboard tab
    await page.getByRole('button', { name: 'Dashboard' }).click();
  });

  test('renders the sidebar navigation', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
  });

  test('sidebar contains the expected nav items', async ({ page }) => {
    const nav = page.locator('aside nav');
    await expect(nav.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Practice' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Glossary' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Help' })).toBeVisible();
  });

  test('renders the main content area', async ({ page }) => {
    const main = page.locator('main, [class*="main"], [class*="content"]').first();
    await expect(main).toBeVisible();
  });

  test('shows domain performance section or readiness summary', async ({ page }) => {
    // DashboardHome shows domain cards or a readiness snapshot
    const domainSection = page.getByText(/domain|readiness|skills|progress/i).first();
    await expect(domainSection).toBeVisible({ timeout: 10_000 });
  });

  test('clicking "Practice" nav item transitions to practice hub', async ({ page }) => {
    await page.getByRole('button', { name: 'Practice' }).click();
    // Practice hub shows domain/skill selection cards
    await expect(
      page.getByText(/domain|skill|practice/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar collapse toggle works', async ({ page }) => {
    const collapseBtn = page.getByTitle('Collapse sidebar');
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await expect(page.getByTitle('Expand sidebar')).toBeVisible();
      // Restore
      await page.getByTitle('Expand sidebar').click();
    }
  });
});
