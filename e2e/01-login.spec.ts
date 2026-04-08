/**
 * 01 — Login screen
 *
 * Tests the unauthenticated entry point. No storageState is used here so the
 * browser starts with no session cookies.
 */

import { test, expect } from '@playwright/test';

test.describe('Login screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the marketing page with sign-in and create-account buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Stop guessing/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' }).first()).toBeVisible();
  });

  test('opens the login modal when "Sign in" is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    // Labels are not htmlFor-linked so use type selectors
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('closes the login modal with the ✕ button', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).not.toBeVisible();
  });

  test('submit button is enabled when email and password are filled', async ({ page }) => {
    // Verifies the form validation gate works: button goes from disabled → enabled
    // when both fields are filled. Does not require a live Supabase call.
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    const submitBtn = page.locator('form button[type="submit"]');
    await expect(submitBtn).toBeDisabled(); // empty fields
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await expect(submitBtn).toBeEnabled({ timeout: 3_000 });
  });

  test('disables the submit button when fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    const submitBtn = page.getByRole('button', { name: 'Sign in' }).last();
    await expect(submitBtn).toBeDisabled();
  });

  test('opens the create account modal from the hero CTA', async ({ page }) => {
    // Hero section CTA
    await page.getByRole('button', { name: 'Create account →' }).first().click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    // Full name input has placeholder "Your name" (label not htmlFor-linked)
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
  });

  test('can switch between sign-in and sign-up within the modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await page.getByText('Sign up').click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await page.getByText('Sign in').last().click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows the password reset form when "Forgot password" is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await page.getByText('Forgot password').click();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to sign in' })).toBeVisible();
  });

  test('signs in successfully with valid credentials', async ({ page }) => {
    const email    = process.env.TEST_ASSESSED_EMAIL    ?? process.env.TEST_USER_EMAIL    ?? '';
    const password = process.env.TEST_ASSESSED_PASSWORD ?? process.env.TEST_USER_PASSWORD ?? '';

    if (!email || !password) {
      test.skip(true, 'TEST_ASSESSED_EMAIL / TEST_ASSESSED_PASSWORD not set in .env.test');
    }

    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).last().click();

    // After successful auth the login screen is replaced by the app shell or gateway
    await expect(page.locator('aside, button:has-text("Start Diagnostic")')).toBeVisible({
      timeout: 20_000,
    });
  });
});
