import { test, expect } from '@playwright/test';

/**
 * Unauthenticated landing / auth-modal flow. Fully runnable with stub Supabase
 * creds (the webServer injects them) — no real account needed. Auth submission
 * fails closed against the stub backend, which is fine: these specs cover the
 * public surface + the Phase 6 lazy-load guarantee, not a real sign-in.
 */
test.describe('Landing page (unauthenticated)', () => {
  test('renders the PASS hero and primary CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/holding you back/i);
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Take your (adaptive )?baseline/i }).first(),
    ).toBeVisible();
  });

  test('does NOT download the question bank on the landing page (Phase 6 guard)', async ({ page }) => {
    const bankRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('questions.json')) bankRequests.push(r.url());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/holding you back/i);
    // Give any stray eager fetch a beat to fire before asserting it didn't.
    await page.waitForTimeout(500);

    // Phase 6: the 6.3MB questions.json must load lazily on assessment/practice
    // entry, never on the login/landing surface. This is the regression guard
    // for that deferral.
    expect(bankRequests, 'questions.json must not be fetched on the landing page').toEqual([]);
  });

  test('"Sign in" opens the auth modal in login mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Sign in$/ }).click();

    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('the baseline CTA opens the auth modal with an email field', async ({ page }) => {
    await page.goto('/');
    // The baseline CTA appears in both the nav and the hero — either opens the modal.
    await page.getByRole('button', { name: /Take your adaptive baseline/i }).first().click();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  });
});
