/**
 * 09 — AI Tutor (TutorChatPage)
 *
 * Navigates to the AI Tutor and verifies the chat UI renders with a message
 * input. Does NOT send real messages to avoid API calls in CI.
 *
 * The AI Tutor is gated by ACTIVE_LAUNCH_FEATURES.tutorChat and requires the
 * adaptive diagnostic to be complete.
 */

import { test, expect } from '@playwright/test';

test.describe('AI Tutor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const hasShell = await page.locator('aside').isVisible({ timeout: 6_000 }).catch(() => false);
    if (!hasShell) test.skip(true, 'Requires assessed-user session — add TEST_ASSESSED_EMAIL to .env.test');

    const tutorBtn = page.locator('aside').getByRole('button', { name: 'AI Tutor' });
    if (!(await tutorBtn.isVisible())) {
      test.skip(true, 'AI Tutor nav item not visible (feature flag off or diagnostic not complete)');
    }
    await tutorBtn.click();
  });

  test('renders the tutor chat page', async ({ page }) => {
    await expect(
      page.getByText(/tutor|PraxisBot|ask|chat/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('shows a text input for composing a message', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
  });

  test('message input is focusable and accepts text', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    if (await input.isVisible()) {
      await input.click();
      await input.fill('What is the IDEA definition of a learning disability?');
      await expect(input).toHaveValue(/IDEA/i);
      // Clear it — don't actually send
      await input.fill('');
    }
  });

  test('send button exists', async ({ page }) => {
    const sendBtn = page.locator('button').filter({ hasText: /send/i })
      .or(page.locator('button[aria-label*="send" i]'));
    // A send button or form submit should be present
    const submitBtn = page.locator('button[type="submit"]');
    const hasSend = (await sendBtn.count() > 0) || (await submitBtn.count() > 0);
    expect(hasSend).toBe(true);
  });
});
