import { test, expect } from '@playwright/test';

test.describe('Authentication & Protected Route Flow', () => {
  test('should redirect unauthenticated users to /login when visiting /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input#email');
    await emailInput.clear();
    await emailInput.fill('wrong@example.com');
    const passInput = page.locator('input#password');
    await passInput.clear();
    await passInput.fill('WrongPassword123!');
    await page.click('button[type="submit"]');

    // Expect an alert or error banner
    const errorEl = page.locator('[role="alert"]').first();
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('should successfully log in with valid admin credentials and access dashboard', async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'mostakshahariyar18@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Mostak@123';

    await page.goto('/login');
    const emailInput = page.locator('input#email');
    await emailInput.clear();
    await emailInput.fill(adminEmail);
    const passInput = page.locator('input#password');
    await passInput.clear();
    await passInput.fill(adminPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    // Verify header or welcome banner
    await expect(page.locator('text=Doctor Tracker').first()).toBeVisible();
  });
});
