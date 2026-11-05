import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Patient Directory and Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display patient directory with real supported fields", async ({ page }) => {
    await page.goto("/patients");
    await expect(page.getByRole("main").locator("h1")).toContainText(/Patient Directory/i);

    // Verify search input is present in main content
    const searchInput = page.getByRole("main").locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Verify patient records are visible (either table row on desktop or card on mobile)
    const patientItem = page
      .locator(
        'table tbody tr:visible, div.block.md\\:hidden div.space-y-3 > div:visible, [data-slot="card"]:visible',
      )
      .first();
    await expect(patientItem).toBeVisible({ timeout: 10000 });

    // Verify unsupported elements do not exist
    await expect(page.locator("text=MRN").or(page.locator("text=#MRN"))).toHaveCount(0);
    await expect(page.locator("text=Main Ward")).toHaveCount(0);
  });

  test("should search patients by name or phone", async ({ page }) => {
    await page.goto("/patients");
    const searchInput = page.getByRole("main").locator('input[placeholder*="Search"]').first();
    await searchInput.fill("Mostak");
    await page.waitForTimeout(600);

    const matchEl = page
      .locator("table tbody tr:visible, div.block.md\\:hidden div.space-y-3 > div:visible")
      .filter({ hasText: "Mostak" })
      .first();
    await expect(matchEl).toBeVisible();
  });

  test("should verify summary cards show identical global statistics on all pagination pages", async ({
    page,
  }) => {
    await page.goto("/patients");
    await expect(page.getByRole("main").locator("h1")).toContainText(/Patient Directory/i);

    // Read summary cards on Page 1
    const totalPatientsCard = page
      .locator("text=Total Patients")
      .locator('xpath=ancestor::div[contains(@class, "rounded")]')
      .first();
    const criticalCard = page
      .locator("text=Critical Condition")
      .locator('xpath=ancestor::div[contains(@class, "rounded")]')
      .first();
    const underTreatmentCard = page
      .locator("text=Under Treatment")
      .locator('xpath=ancestor::div[contains(@class, "rounded")]')
      .first();
    const unassignedCard = page
      .locator("text=Unassigned")
      .locator('xpath=ancestor::div[contains(@class, "rounded")]')
      .first();

    const page1Total = await totalPatientsCard.locator("span.text-xl, span.text-2xl").textContent();
    const page1Critical = await criticalCard.locator("span.text-xl, span.text-2xl").textContent();
    const page1Treatment = await underTreatmentCard
      .locator("span.text-xl, span.text-2xl")
      .textContent();
    const page1Unassigned = await unassignedCard
      .locator("span.text-xl, span.text-2xl")
      .textContent();

    // Verify values are valid non-empty numbers
    expect(Number(page1Total?.trim())).toBeGreaterThanOrEqual(0);
    expect(Number(page1Critical?.trim())).toBeGreaterThanOrEqual(0);
    expect(Number(page1Treatment?.trim())).toBeGreaterThanOrEqual(0);
    expect(Number(page1Unassigned?.trim())).toBeGreaterThanOrEqual(0);

    // Navigate to Page 2 if Next button exists and is enabled
    const nextButton = page.getByRole("button", { name: /^Next$/i });
    if ((await nextButton.count()) > 0 && (await nextButton.isEnabled())) {
      await nextButton.click();
      await page.waitForTimeout(600);

      const page2Total = await totalPatientsCard
        .locator("span.text-xl, span.text-2xl")
        .textContent();
      const page2Critical = await criticalCard.locator("span.text-xl, span.text-2xl").textContent();
      const page2Treatment = await underTreatmentCard
        .locator("span.text-xl, span.text-2xl")
        .textContent();
      const page2Unassigned = await unassignedCard
        .locator("span.text-xl, span.text-2xl")
        .textContent();

      // Statistics must remain identical across pages
      expect(page2Total).toBe(page1Total);
      expect(page2Critical).toBe(page1Critical);
      expect(page2Treatment).toBe(page1Treatment);
      expect(page2Unassigned).toBe(page1Unassigned);
    }
  });
});
