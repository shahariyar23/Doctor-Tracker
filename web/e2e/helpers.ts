import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  const emailInput = page.locator('input#email');
  await emailInput.clear();
  await emailInput.fill('admin@doctortracker.com');
  const passInput = page.locator('input#password');
  await passInput.clear();
  await passInput.fill('AdminPassword#2026');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

