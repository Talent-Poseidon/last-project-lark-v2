import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test('should register successfully and show pending approval', async ({ page }) => {
    // Generate unique email to avoid conflict
    const timestamp = Date.now();
    const newUserEmail = `newuser${timestamp}@example.com`;

    await page.goto('/auth/sign-up');

    await page.fill('input[name="full_name"]', 'New User Testing');
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="password"]', 'password123');

    // Submit form
    await page.locator('form').first().locator('button[type="submit"]').click();

    // Expect success message
    await expect(page.locator('text=Account Created')).toBeVisible();
    await expect(page.locator('text=Please wait for an admin to approve')).toBeVisible();
  });

  test('should fail when registering with existing email', async ({ page }) => {
    await page.goto('/auth/sign-up');

    // Use existing admin email
    await page.fill('input[name="full_name"]', 'Duplicate User');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.locator('form').first().locator('button[type="submit"]').click();

    // Expect error message
    await expect(page.locator('text=User already exists')).toBeVisible();
  });
});
