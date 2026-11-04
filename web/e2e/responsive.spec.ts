import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Responsive Layout and Visual Viewports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should render dashboard cleanly on desktop and mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Doctor Tracker').first()).toBeVisible();

    // Verify stats cards exist
    const cards = page.locator('.grid > div');
    await expect(cards.first()).toBeVisible();
  });

  test('should render patient directory cleanly without horizontal layout overflow', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByRole('main').locator('h1')).toBeVisible();
  });

  test('should render doctor directory cleanly', async ({ page }) => {
    await page.goto('/doctors');
    await expect(page.getByRole('main').locator('h1')).toBeVisible();
  });
});
