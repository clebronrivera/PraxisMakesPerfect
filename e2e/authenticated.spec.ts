import { test, expect, type Page } from '@playwright/test';

/**
 * Authenticated critical-path specs — the flows that unit/component tests can't
 * reach end to end: the Phase 5 hook decomposition and the Phase 6 lazy
 * question-bank load, exercised through a real browser + real backend.
 *
 * These need a THROWAWAY test account on a real Supabase project. Provide:
 *   E2E_EMAIL, E2E_PASSWORD               — the test account
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY — real values (override the stubs
 *                                           in playwright.config so auth works)
 * e.g.  E2E_EMAIL=... E2E_PASSWORD=... VITE_SUPABASE_URL=... \
 *       VITE_SUPABASE_ANON_KEY=... npm run test:e2e
 *
 * They skip cleanly when creds are absent. NOTE: written against the current
 * UI but not yet run against a live account — expect to tweak a selector or two
 * on the first real run (see e2e/README.md).
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const haveCreds = Boolean(EMAIL && PASSWORD);

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^Sign in$/ }).click();
  await page.getByPlaceholder('you@example.com').fill(EMAIL!);
  const password = page.locator('input[name="password"]');
  await password.fill(PASSWORD!);
  await password.press('Enter'); // submit the modal form
  // The authenticated shell shows the exam wordmark in the sidebar/header.
  await expect(page.getByText('School Psychology 5403').first()).toBeVisible({ timeout: 20_000 });
}

test.describe('Authenticated critical paths', () => {
  test.skip(!haveCreds, 'set E2E_EMAIL / E2E_PASSWORD (+ real VITE_SUPABASE_*) to run — see e2e/README.md');

  test('signs in and lands on the authenticated shell', async ({ page }) => {
    await signIn(page);
    await expect(page.getByText('School Psychology 5403').first()).toBeVisible();
  });

  test('dashboard does NOT eagerly download the question bank (Phase 6)', async ({ page }) => {
    const bank: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('questions.json')) bank.push(r.url());
    });
    await signIn(page);
    await page.waitForTimeout(1000); // let any stray eager fetch fire
    expect(bank, 'the dashboard must not fetch the 6.3MB bank on load').toEqual([]);
  });

  test('entering Practice lazily loads the bank on demand (Phase 5 + 6)', async ({ page }) => {
    await signIn(page);

    // The bank fetch must fire on practice ENTRY, not before.
    const bankLoaded = page.waitForRequest((r) => r.url().includes('questions.json'), {
      timeout: 20_000,
    });
    await page.getByRole('button', { name: /^Practice$/ }).first().click();
    // Kick off a general practice session (label may be "Random Questions").
    await page.getByRole('button', { name: /Random Questions|Start practicing/i }).first().click();
    await bankLoaded;

    // Once the bank resolves, the practice UI renders answer choices (letter chips).
    await expect(page.getByText(/Submit Answer|Finding relevant questions/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
