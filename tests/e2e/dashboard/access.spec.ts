import { test, expect } from '@playwright/test';

test.describe('Dashboard Access Control', () => {
  // This file runs in chromium-no-auth (no storageState = guest session)

  test('should redirect guest to login page', async ({ page }) => {
    console.log('[Access Test] Navigating to /dashboard as guest...');
    await page.goto('/dashboard');

    const currentURL = page.url();
    console.log(`[Access Test] Current URL after navigation: ${currentURL}`);

    // Guest should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    console.log('[Access Test] Guest correctly redirected to login page.');
  });

  test('should allow authenticated admin to access dashboard', async ({ page }) => {
    // Navigate to login page (guest context, so no redirect)
    console.log('[Access Test] Navigating to /auth/login...');
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Perform manual login
    console.log('[Access Test] Filling admin credentials...');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('form').first().locator('button[type="submit"]').click();

    // Wait for redirect to dashboard
    console.log('[Access Test] Waiting for redirect to /dashboard...');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Verify dashboard access
    const currentURL = page.url();
    console.log(`[Access Test] Current URL after login: ${currentURL}`);
    await expect(page).toHaveURL(/\/dashboard/);
    console.log('[Access Test] Authenticated admin successfully accessed dashboard.');
  });
});
