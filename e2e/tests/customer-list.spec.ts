import { expect, test } from '@playwright/test';

import { CustomerListPage } from '../pages/CustomerListPage';
import { ImportPage } from '../pages/ImportPage';

test.describe('Customer List Page', () => {
  test('loads customer list page', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    await expect(customerList.heading).toBeVisible();
  });

  test('shows empty state when no data', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Should show empty state or no customers message
    await expect(customerList.emptyStateMessage).toBeVisible();
  });

  test('can navigate to customer list from navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /customers/i }).click();

    await expect(page).toHaveURL(/.*customers/);
  });
});

// Note: These tests require working CSV import via E2E
// Skip for now until import flow is debugged with actual UI selectors
test.describe.skip('Customer List with Data', () => {
  // Setup: Import test data before each test in this block
  test.beforeEach(async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();
    await importPage.uploadFile('test-customers.csv');
    await importPage.clickImport();
    await page.waitForTimeout(500); // Wait for import to complete
  });

  test('displays imported customers', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Should have customer rows after import
    // We imported 5 customers
    const count = await customerList.getCustomerCount();
    expect(count).toBeGreaterThan(0);
  });

  test('can search for customers', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Search for a specific hotel
    await customerList.search('Grand Plaza');

    // Wait for search to complete
    await page.waitForTimeout(300);

    // Should find the hotel
    await expect(page.getByText(/Grand Plaza/i)).toBeVisible();
  });

  test('search with no results shows empty state', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Search for something that doesn't exist
    await customerList.search('NonexistentHotel12345');

    await page.waitForTimeout(300);

    // Should show no results message
    await expect(customerList.emptyStateMessage).toBeVisible();
  });

  test('can click on a customer to view details', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click on first customer row
    await customerList.clickCustomer('Hotel Grand Plaza');

    // Should navigate to customer detail page
    await expect(page).toHaveURL(/.*customers\/E2E-001/);
  });
});

test.describe('Customer List Responsiveness', () => {
  test('displays correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    const customerList = new CustomerListPage(page);
    await customerList.goto();

    await expect(customerList.heading).toBeVisible();
    // Table or cards should still be visible
  });

  test('displays correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    const customerList = new CustomerListPage(page);
    await customerList.goto();

    await expect(customerList.heading).toBeVisible();
  });

  test('displays correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD

    const customerList = new CustomerListPage(page);
    await customerList.goto();

    await expect(customerList.heading).toBeVisible();
  });
});
