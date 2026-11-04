# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global-search.spec.ts >> Global Search E2E System Tests >> should render global search input in the header on dashboard
- Location: e2e/global-search.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" getByRole('banner').locator('input[placeholder*="Search doctors, patients"]') with timeout 5000ms
  - waiting for getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')
    12 × locator resolved to <input value="" type="text" role="combobox" data-slot="input" id="base-ui-_r_0_" aria-expanded="false" aria-haspopup="listbox" aria-autocomplete="list" aria-controls="global-search-results" placeholder="Search doctors, patients... (⌘K)" class="w-full min-w-0 rounded-lg border px-2.5 py-1 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visib…/>
       - unexpected value "hidden"

```

```yaml
- complementary:
  - link "Doctor Tracker Admin":
    - /url: /dashboard
  - button "Close menu"
  - paragraph: Main Menu
  - navigation:
    - link "Overview":
      - /url: /dashboard
    - link "Doctors":
      - /url: /doctors
    - link "Patients":
      - /url: /patients
  - text: SY System Administrator admin@doctortracker.com
  - button "Log out"
- banner:
  - button "Toggle navigation menu"
  - heading "Admin Overview Dashboard" [level=1]
  - button "Open search"
  - text: SY
- main:
  - text: Live Healthcare Metrics
  - heading "Healthcare System Overview" [level=1]
  - paragraph: Real-time aggregate analytics across hospital physicians and patient allocations.
  - link "Patients":
    - /url: /patients
  - link "Add Doctor":
    - /url: /doctors/new
  - link "Add Patient":
    - /url: /patients/new
  - text: Total Doctors 1 All-time physicians Total Patients 1 All-time registrations Patients / Doctor 1 Average caseload New Patients (30d) 1 1 new doctors in period Data-Driven Healthcare Insights • Dr. Alexander Vance (Cardiology) manages the highest patient load with 1 patient(s). • The most prevalent condition recorded is "Under Treatment" with 1 patient(s). • 1 new patient(s) registered during the selected observation period.
  - heading "Patient Registration Trends" [level=2]
  - paragraph: New patient registrations logged over time
  - button "7d"
  - button "30d"
  - button "90d"
  - application: 2026-10-09 2026-10-17 2026-10-25 2026-11-04 0 1 2 3 4
  - heading "Patients per Doctor" [level=2]
  - text: Top Caseloads
  - paragraph: Workload distribution across active attending physicians
  - text: Dr. Alexander Vance • Cardiology 1 patients
  - heading "Condition Status" [level=2]
  - paragraph: Patient distribution by clinical condition
  - application
  - text: Under Treatment 1
  - heading "Recent Patient Registrations" [level=2]
  - paragraph: Latest admissions and assigned physicians
  - link "View All":
    - /url: /patients
  - paragraph: Mostak Shahariyar
  - paragraph: Dr. Alexander Vance · 11/4/2026
  - text: Under Treatment
- navigation "Mobile Bottom Navigation":
  - link "Overview":
    - /url: /dashboard
  - link "Doctors":
    - /url: /doctors
  - link "Patients":
    - /url: /patients
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsAdmin } from './helpers';
  3   | 
  4   | test.describe('Global Search E2E System Tests', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsAdmin(page);
  7   |   });
  8   | 
  9   |   test('should render global search input in the header on dashboard', async ({ page }) => {
  10  |     await page.goto('/dashboard');
  11  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
> 12  |     await expect(searchInput).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  13  |   });
  14  | 
  15  |   test('should render global search input on doctor directory and patient directory', async ({ page }) => {
  16  |     await page.goto('/doctors');
  17  |     await expect(page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')).toBeVisible();
  18  | 
  19  |     await page.goto('/patients');
  20  |     await expect(page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]')).toBeVisible();
  21  |   });
  22  | 
  23  |   test('should show instructional prompt when search term is 1 character', async ({ page }) => {
  24  |     await page.goto('/dashboard');
  25  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
  26  |     await searchInput.fill('a');
  27  | 
  28  |     const promptEl = page.locator('#global-search-results').getByText('Please enter at least 2 characters');
  29  |     await expect(promptEl).toBeVisible({ timeout: 5000 });
  30  |   });
  31  | 
  32  |   test('should perform live debounced backend search and display Doctor and Patient groups', async ({ page }) => {
  33  |     await page.goto('/dashboard');
  34  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
  35  |     
  36  |     // Type query matching Dr. Alexander Vance
  37  |     await searchInput.fill('Vance');
  38  |     await page.waitForTimeout(400); // debounce wait
  39  | 
  40  |     const dropdown = page.locator('#global-search-results');
  41  |     await expect(dropdown).toBeVisible({ timeout: 5000 });
  42  | 
  43  |     // Check Doctor group
  44  |     const doctorGroup = dropdown.locator('text=Doctors');
  45  |     await expect(doctorGroup).toBeVisible();
  46  |     await expect(dropdown.locator('text=Dr. Alexander Vance')).toBeVisible();
  47  |     await expect(dropdown.locator('text=Cardiology')).toBeVisible();
  48  |   });
  49  | 
  50  |   test('should search and display patient results with assigned physician', async ({ page }) => {
  51  |     await page.goto('/dashboard');
  52  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
  53  |     
  54  |     await searchInput.fill('Mostak');
  55  |     await page.waitForTimeout(400);
  56  | 
  57  |     const dropdown = page.locator('#global-search-results');
  58  |     await expect(dropdown).toBeVisible({ timeout: 5000 });
  59  | 
  60  |     // Check Patient group
  61  |     const patientGroup = dropdown.locator('text=Patients');
  62  |     await expect(patientGroup).toBeVisible();
  63  |     await expect(dropdown.locator('text=Mostak Shahariyar')).toBeVisible();
  64  |     await expect(dropdown.locator('text=Under Treatment')).toBeVisible();
  65  |   });
  66  | 
  67  |   test('should show empty state for non-matching queries', async ({ page }) => {
  68  |     await page.goto('/dashboard');
  69  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
  70  |     
  71  |     await searchInput.fill('NonExistentDoctorPatient123XYZ');
  72  |     await page.waitForTimeout(400);
  73  | 
  74  |     const emptyText = page.locator('text=No matching doctors or patients found.');
  75  |     await expect(emptyText).toBeVisible({ timeout: 5000 });
  76  |   });
  77  | 
  78  |   test('should close dropdown when pressing Escape', async ({ page }) => {
  79  |     await page.goto('/dashboard');
  80  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
  81  |     await searchInput.fill('Vance');
  82  |     await page.waitForTimeout(400);
  83  | 
  84  |     const dropdown = page.locator('#global-search-results');
  85  |     await expect(dropdown).toBeVisible();
  86  | 
  87  |     await searchInput.press('Escape');
  88  |     await expect(dropdown).toBeHidden();
  89  |   });
  90  | 
  91  |   test('should navigate to doctor detail page when clicking a doctor result', async ({ page }) => {
  92  |     await page.goto('/dashboard');
  93  |     const searchInput = page.getByRole('banner').locator('input[placeholder*="Search doctors, patients"]');
  94  |     await searchInput.fill('Vance');
  95  |     await page.waitForTimeout(400);
  96  | 
  97  |     const doctorResult = page.locator('#global-search-results [role="option"]:has-text("Dr. Alexander Vance")');
  98  |     await expect(doctorResult).toBeVisible();
  99  |     await doctorResult.click();
  100 | 
  101 |     // Verify navigation to /doctors/[id] and doctor name is displayed in main view
  102 |     await expect(page).toHaveURL(/\/doctors\/[a-f0-9]{24}/, { timeout: 10000 });
  103 |     await expect(page.getByRole('main').getByRole('heading', { name: 'Dr. Alexander Vance' })).toBeVisible();
  104 |   });
  105 | });
  106 | 
```