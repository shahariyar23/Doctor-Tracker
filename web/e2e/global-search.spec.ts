import { test, expect } from '@playwright/test';
import { loginAsAdmin, openGlobalSearch } from './helpers';

test.describe('Global Search E2E System Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should render global search in the header on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const isMobile = page.viewportSize() ? page.viewportSize()!.width < 768 : false;
    if (isMobile) {
      await expect(page.getByRole('banner').locator('button[aria-label="Open search"]')).toBeVisible();
    } else {
      await expect(page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')).toBeVisible();
    }
  });

  test('should render global search on doctor directory and patient directory', async ({ page }) => {
    const isMobile = page.viewportSize() ? page.viewportSize()!.width < 768 : false;
    await page.goto('/doctors');
    if (isMobile) {
      await expect(page.getByRole('banner').locator('button[aria-label="Open search"]')).toBeVisible();
    } else {
      await expect(page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')).toBeVisible();
    }

    await page.goto('/patients');
    if (isMobile) {
      await expect(page.getByRole('banner').locator('button[aria-label="Open search"]')).toBeVisible();
    } else {
      await expect(page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')).toBeVisible();
    }
  });

  test('should show instructional prompt when search term is 1 character', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = await openGlobalSearch(page);
    await searchInput.fill('a');
    await page.waitForTimeout(400);

    const promptEl = page.locator('#global-search-results').getByText('Please enter at least 2 characters');
    await expect(promptEl).toBeVisible({ timeout: 5000 });
  });

  test('should perform live debounced backend search and display Doctor and Patient groups', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = await openGlobalSearch(page);

    // Type query matching Dr. Alexander Vance
    await searchInput.fill('Vance');
    await page.waitForTimeout(600); // debounce wait

    const dropdown = page.locator('#global-search-results');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Check Doctor group
    const doctorGroup = dropdown.locator('text=Doctors');
    await expect(doctorGroup).toBeVisible();
    await expect(dropdown.locator('text=Dr. Alexander Vance')).toBeVisible();
    await expect(dropdown.locator('text=Cardiology')).toBeVisible();
  });

  test('should search and display patient results with assigned physician', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = await openGlobalSearch(page);

    await searchInput.fill('Mostak');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#global-search-results');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Check Patient group
    const patientGroup = dropdown.locator('text=Patients');
    await expect(patientGroup).toBeVisible();
    await expect(dropdown.locator('text=Mostak Shahariyar')).toBeVisible();
    await expect(dropdown.locator('text=Under Treatment')).toBeVisible();
  });

  test('should show empty state for non-matching queries', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = await openGlobalSearch(page);

    await searchInput.fill('NonExistentDoctorPatient123XYZ');
    await page.waitForTimeout(600);

    const emptyText = page.locator('#global-search-results').getByText('No matching doctors or patients found.');
    await expect(emptyText).toBeVisible({ timeout: 5000 });
  });

  test('should close dropdown when pressing Escape', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = await openGlobalSearch(page);
    await searchInput.fill('Vance');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#global-search-results');
    await expect(dropdown).toBeVisible();

    await searchInput.press('Escape');
    await expect(dropdown).toBeHidden();
  });

  test('should navigate to doctor detail page when clicking a doctor result', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = await openGlobalSearch(page);
    await searchInput.fill('Vance');
    await page.waitForTimeout(600);

    const doctorResult = page.locator('#global-search-results [role="option"]:has-text("Dr. Alexander Vance")');
    await expect(doctorResult).toBeVisible();
    await doctorResult.click();

    // Verify navigation to /doctors/[id] and doctor name is displayed in main view
    await expect(page).toHaveURL(/\/doctors\/[a-f0-9]{24}/, { timeout: 10000 });
    await expect(page.getByRole('main').getByRole('heading', { name: 'Dr. Alexander Vance' })).toBeVisible();
  });
});
