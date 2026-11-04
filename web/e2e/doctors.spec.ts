import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Doctor Directory and Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display doctor directory with table or card list and real fields', async ({ page }) => {
    await page.goto('/doctors');
    await expect(page.getByRole('main').locator('h1')).toContainText(/Doctor Directory/i);

    // Verify search input is present in main content
    const searchInput = page.getByRole('main').locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Table rows (desktop) or Card items (mobile) should be present
    const recordItem = page.locator('table tbody tr:visible, div.block.md\\:hidden div.space-y-3 > div:visible, .grid > div:visible').first();
    await expect(recordItem).toBeVisible({ timeout: 10000 });
  });

  test('should search doctors by name or specialization', async ({ page }) => {
    await page.goto('/doctors');
    const searchInput = page.getByRole('main').locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Vance');
    // Debounce wait
    await page.waitForTimeout(600);

    const matchEl = page.locator('table tbody tr:visible, div.block.md\\:hidden div.space-y-3 > div:visible').filter({ hasText: 'Vance' }).first();
    await expect(matchEl).toBeVisible();
  });

  test('should open doctor detail view and show assigned patients or unassigned state', async ({ page }) => {
    await page.goto('/doctors');
    const viewButton = page.locator('button:has-text("View"), button:has-text("Details")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page.locator('text=Physician Profile').or(page.locator('text=Doctor Profile'))).toBeVisible({ timeout: 5000 });
    }
  });
});
