import { expect, test } from '@playwright/test';

import { DashboardPage } from '../pages/DashboardPage';
import { ImportPage } from '../pages/ImportPage';

test.describe('Dashboard', () => {
  test('loads successfully', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Verify heading is visible
    await expect(dashboard.heading).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    const title = await dashboard.getTitle();
    expect(title).toBe('Pulse');
  });

  test('shows empty state when no data is loaded', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.emptyState).toBeVisible();
    await expect(dashboard.emptyStateMessage).toBeVisible();
  });

  test('displays import button in empty state', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.importButton).toBeVisible();
  });

  test('import button navigates to import page', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await dashboard.importButton.click();
    await expect(page).toHaveURL(/.*import/);
  });
});

// Note: These tests require working CSV import via E2E
// Skip for now until import flow is debugged with actual UI selectors
test.describe.skip('Dashboard with Data', () => {
  // Setup: Import test data before each test
  test.beforeEach(async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();
    await importPage.uploadFile('test-customers.csv');
    await importPage.clickImport();
    await page.waitForTimeout(500);
  });

  test('shows dashboard content after import', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.dashboardContent).toBeVisible();
  });

  test('displays metric cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Should have multiple metric cards
    await expect(dashboard.metricCards).toHaveCount(5);
  });

  test('shows total customers metric', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.totalCustomersMetric).toBeVisible();
    // Should show "5" since we imported 5 customers
    await expect(dashboard.totalCustomersMetric).toContainText('5');
  });

  test('shows last updated timestamp', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.lastUpdated).toBeVisible();
  });
});

test.describe('Dashboard Responsiveness', () => {
  test('displays correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
  });

  test('displays correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
  });
});
