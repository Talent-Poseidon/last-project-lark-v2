import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Define the path relative to project root
const authDir = path.join(__dirname, '../../playwright/.auth');
const authFile = path.join(authDir, 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  console.log('--- GLOBAL AUTH SETUP STARTED ---');
  
  // Ensure the auth directory exists
  if (!fs.existsSync(authDir)){
      console.log(`Directory ${authDir} does not exist. Creating it...`);
      fs.mkdirSync(authDir, { recursive: true });
  }

  // 1. Navigate to login page
  console.log('Navigating to /auth/login...');
  await page.goto('/auth/login');
  
  // 2. Fill credentials
  console.log('Filling admin credentials...');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // 3. Submit form
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');
  
  // 4. Wait for redirection to dashboard
  console.log('Waiting for redirection to /dashboard...');
  await page.waitForURL('/dashboard');
  
  // 5. Verify successful login by checking a key element on dashboard
  console.log('Verifying dashboard access...');
  await expect(page).toHaveURL(/\/dashboard/);
  
  // Add a small delay to ensure cookies are set
  await page.waitForTimeout(2000);
  
  // DEBUG: Check cookies
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('session-token'));
  
  if (sessionCookie) {
    console.log(`COOKIE FOUND: ${sessionCookie.name} | Domain: ${sessionCookie.domain} | Path: ${sessionCookie.path} | Secure: ${sessionCookie.secure} | HttpOnly: ${sessionCookie.httpOnly} | SameSite: ${sessionCookie.sameSite}`);
  } else {
    console.error('CRITICAL ERROR: No session token found in cookies after login!');
    console.log('All cookies:', JSON.stringify(cookies.map(c => ({ name: c.name, domain: c.domain, path: c.path, secure: c.secure })), null, 2));
  }

  // 6. Save storage state
  console.log(`Saving storage state to ${authFile}...`);
  await page.context().storageState({ path: authFile });

  // Verify file was created and inspect its contents
  if (fs.existsSync(authFile)) {
    const savedState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    const savedCookies = savedState.cookies || [];
    const savedSession = savedCookies.find((c: any) => c.name.includes('session-token'));
    console.log(`SUCCESS: Auth file created. Total cookies saved: ${savedCookies.length}`);
    if (savedSession) {
      console.log(`SAVED SESSION COOKIE: name=${savedSession.name} | domain=${savedSession.domain} | secure=${savedSession.secure} | httpOnly=${savedSession.httpOnly} | sameSite=${savedSession.sameSite} | expires=${savedSession.expires}`);
      console.log(`SAVED SESSION TOKEN (first 50 chars): ${savedSession.value.substring(0, 50)}...`);
    } else {
      console.error('ERROR: Session cookie NOT found in saved auth file!');
    }
  } else {
    console.error('ERROR: Auth file was NOT created even after storageState call.');
    throw new Error('Failed to create auth file');
  }

  console.log('--- GLOBAL AUTH SETUP COMPLETED ---');
});