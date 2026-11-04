import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Patient Directory and Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display patient directory with real supported fields', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByRole('main').locator('h1')).toContainText(/Patient Directory/i);

    // Verify search input is present in main content
    const searchInput = page.getByRole('main').locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Verify patient records are visible (either table row on desktop or card on mobile)
    const patientItem = page.locator('table tbody tr:visible, div.block.md\\:hidden div.space-y-3 > div:visible, [data-slot="card"]:visible').first();
    await expect(patientItem).toBeVisible({ timeout: 10000 });

    // Verify unsupported elements do not exist
    await expect(page.locator('text=MRN').or(page.locator('text=#MRN'))).toHaveCount(0);
    await expect(page.locator('text=Main Ward')).toHaveCount(0);
  });

  test('should search patients by name or phone', async ({ page }) => {
    await page.goto('/patients');
    const searchInput = page.getByRole('main').locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Mostak');
    await page.waitForTimeout(600);

    const matchEl = page.locator('table tbody tr:visible, div.block.md\\:hidden div.space-y-3 > div:visible').filter({ hasText: 'Mostak' }).first();
    await expect(matchEl).toBeVisible();
  });
});
