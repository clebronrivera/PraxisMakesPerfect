/**
 * 08 — Study Guide (StudyPlanCard)
 *
 * Navigates to the Study Plan tab and verifies content or the rate-limit banner.
 * The Study Guide feature is gated by ACTIVE_LAUNCH_FEATURES.studyGuide.
 */

import { test, expect } from '@playwright/test';

test.describe('Study guide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const hasShell = await page.locator('aside').isVisible({ timeout: 6_000 }).catch(() => false);
    if (!hasShell) test.skip(true, 'Requires assessed-user session — add TEST_ASSESSED_EMAIL to .env.test');

    const studyPlanBtn = page.locator('aside').getByRole('button', { name: 'Study Plan' });
    if (!(await studyPlanBtn.isVisible())) {
      test.skip(true, 'Study Plan nav item not visible (feature flag off or feature gated)');
    }
    await studyPlanBtn.click();
  });

  test('renders the study plan page', async ({ page }) => {
    await expect(
      page.getByText(/study|plan|guide|week|generate/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows a generate button or an existing plan', async ({ page }) => {
    const generateBtn = page.locator('button').filter({ hasText: /generate|create.*plan/i });
    const planContent = page.getByText(/week [1-9]|priority|cluster|readiness/i);
    const rateLimitMsg = page.getByText(/rate limit|already generated|7 days|come back/i);

    const hasGenerate   = await generateBtn.count() > 0;
    const hasPlan       = await planContent.count() > 0;
    const hasRateLimit  = await rateLimitMsg.count() > 0;

    expect(hasGenerate || hasPlan || hasRateLimit).toBe(true);
  });
});
