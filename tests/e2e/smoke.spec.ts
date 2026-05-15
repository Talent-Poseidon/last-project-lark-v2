import { test, expect } from '@playwright/test';

// This file runs in chromium-no-auth (no storageState = guest session)

test('smoke test: login page loads correctly', async ({ page }) => {
  console.log('[Smoke Test] Navigating to /auth/login as guest...');
  await page.goto('/auth/login');

  const currentURL = page.url();
  console.log(`[Smoke Test] Current URL: ${currentURL}`);

  // Verify URL is /auth/login (guest should stay on login page)
  await expect(page).toHaveURL(/.*\/auth\/login/);

  // Verify login form is rendered
  const loginForm = page.locator('form').filter({ hasText: 'Sign in' }).first();
  await expect(loginForm).toBeVisible();
  console.log('[Smoke Test] Login form is visible.');

  // Verify heading is rendered
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  console.log('[Smoke Test] Login page loaded correctly.');
});
