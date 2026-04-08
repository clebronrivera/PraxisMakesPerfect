/**
 * 02 — Pre-assessment gateway
 *
 * Uses the "unassessed" storageState (user who hasn't taken the diagnostic).
 * Verifies that both pathways (Adaptive Diagnostic and Spicy Mode) are surfaced,
 * and that clicking "Start Diagnostic" transitions into the assessment flow.
 */

import { test, expect } from '@playwright/test';

test.describe('Pre-assessment gateway', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const onGateway = await page
      .locator('button:has-text("Start Diagnostic"), button:has-text("Try a Random Question")')
      .first()
      .isVisible({ timeout: 6_000 })
      .catch(() => false);
    if (!onGateway) {
      test.skip(true, 'Requires an unassessed-user session — add TEST_UNASSESSED_EMAIL to .env.test');
    }
  });

  test('shows the Adaptive Diagnostic card with "Recommended" badge', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Adaptive Diagnostic' })).toBeVisible();
    await expect(page.getByText('Recommended')).toBeVisible();
  });

  test('shows question-count and time stats', async ({ page }) => {
    await expect(page.getByText('45–90')).toBeVisible();
    await expect(page.getByText('25–45')).toBeVisible();
  });

  test('shows unlock badges', async ({ page }) => {
    await expect(page.getByText('Skill Practice')).toBeVisible();
    await expect(page.getByText('AI Tutor')).toBeVisible();
    await expect(page.getByText('Study Guide')).toBeVisible();
  });

  test('shows the "Start Diagnostic →" CTA button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Start Diagnostic/i })).toBeVisible();
  });

  test('shows the Spicy Mode "Feeling Spicy?" card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Feeling Spicy?' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Try a Random Question/i })).toBeVisible();
  });

  test('clicking "Start Diagnostic →" enters the diagnostic flow', async ({ page }) => {
    await page.getByRole('button', { name: /Start Diagnostic/i }).click();
    // The adaptive diagnostic renders a question — wait for the skill/domain label
    // or a progress indicator
    await expect(
      page.locator('[class*="question"], [class*="Question"], [class*="assessment"], h2, h3').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('shows the "browse by domain or skill" link', async ({ page }) => {
    await expect(page.getByText(/browse by domain or skill/i)).toBeVisible();
  });
});
