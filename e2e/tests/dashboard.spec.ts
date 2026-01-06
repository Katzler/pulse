import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

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
    expect(title).toBe('Customer Success Metrics Dashboard');
  });

  test('shows no data message when data is not loaded', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.dataStatusMessage).toBeVisible();
    await expect(dashboard.dataStatusMessage).toContainText('No data loaded yet');
  });

  test('displays health score indicators', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Check all three health indicators are present
    await expect(dashboard.healthIndicators).toHaveCount(3);
  });
});
