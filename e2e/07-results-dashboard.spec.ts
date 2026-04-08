/**
 * 07 — Results dashboard (Progress tab)
 *
 * Navigates to the Progress/Results view and verifies skill/domain data renders.
 */

import { test, expect } from '@playwright/test';

test.describe('Results dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const hasShell = await page.locator('aside').isVisible({ timeout: 6_000 }).catch(() => false);
    if (!hasShell) test.skip(true, 'Requires assessed-user session — add TEST_ASSESSED_EMAIL to .env.test');

    const progressBtn = page.locator('aside').getByRole('button', { name: 'Progress' });
    if (await progressBtn.isVisible()) {
      await progressBtn.click();
    } else {
      // Progress tab is gated by readiness data — skip if not available
      test.skip(true, 'Progress nav item not visible for this test account');
    }
  });

  test('renders the results / progress view', async ({ page }) => {
    await expect(
      page.getByText(/progress|results|skill|domain|mastery/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows domain sections', async ({ page }) => {
    const domainText = page.getByText(/domain [1-4]/i);
    await expect(domainText.first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows proficiency badges (Emerging / Approaching / Demonstrating)', async ({ page }) => {
    const badge = page.getByText(/Emerging|Approaching|Demonstrating/i);
    await expect(badge.first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows skill rows or accuracy data', async ({ page }) => {
    // Skill breakdown table contains percentages or accuracy data
    const skillData = page.getByText(/\d+%|\d+ attempts|accuracy/i);
    await expect(skillData.first()).toBeVisible({ timeout: 10_000 });
  });
});
