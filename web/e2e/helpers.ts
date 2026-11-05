import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
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
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

export async function openGlobalSearch(page: Page) {
  const isMobile = page.viewportSize() ? page.viewportSize()!.width < 768 : false;
  if (isMobile) {
    const openBtn = page.getByRole('banner').locator('button[aria-label="Open search"]');
    await expect(openBtn).toBeVisible({ timeout: 5000 });
    // Click with tap/force and wait for input to appear
    await openBtn.click();
  }
  const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]:visible');
  if (isMobile && !(await searchInput.isVisible())) {
    // Retry clicking open button if the first click happened during hydration/re-render
    const openBtn = page.getByRole('banner').locator('button[aria-label="Open search"]');
    if (await openBtn.isVisible()) {
      await openBtn.click();
    }
  }
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.click();
  return searchInput;
}

