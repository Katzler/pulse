import { expect, test } from '@playwright/test';

import { CustomerDetailPage } from '../pages/CustomerDetailPage';
import { CustomerListPage } from '../pages/CustomerListPage';
import { ImportPage } from '../pages/ImportPage';

test.describe('Customer Detail Page', () => {
  test('shows not found for invalid customer ID', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goto('invalid-customer-id');

    await expect(detailPage.notFoundMessage).toBeVisible();
  });

  test('has back link on not found page', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goto('any-id');

    // Even on not found page, there should be a way to go back
    await expect(detailPage.backButton).toBeVisible();
  });
});

// Note: These tests require working CSV import via E2E
// Skip for now until import flow is debugged with actual UI selectors
test.describe.skip('Customer Detail with Data', () => {
  // Setup: Import test data before each test
  test.beforeEach(async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();
    await importPage.uploadFile('test-customers.csv');
    await importPage.clickImport();
    await page.waitForTimeout(500);
  });

  test('displays customer details', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goto('E2E-001');

    // Should show customer name in heading or somewhere on page
    await expect(page.getByText(/Hotel Grand Plaza/i)).toBeVisible();
  });

  test('displays health score indicator', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goto('E2E-001');

    // Should display some health score indicator or health status
    // The page should have health-related content
    await expect(page.getByText(/health|score|healthy|at risk|critical/i).first()).toBeVisible();
  });

  test('can navigate back to customer list', async ({ page }) => {
    // First go to customer list
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click a customer
    await customerList.clickCustomer('Hotel Grand Plaza');

    // Wait for detail page
    await expect(page).toHaveURL(/.*customers\/E2E-001/);

    // Click back
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goBack();

    // Should be back at customer list
    await expect(page).toHaveURL(/.*customers$/);
  });

  test('shows different customers', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);

    // First customer
    await detailPage.goto('E2E-001');
    await expect(page.getByText(/Hotel Grand Plaza/i)).toBeVisible();

    // Second customer
    await detailPage.goto('E2E-003');
    await expect(page.getByText(/Mountain Lodge/i)).toBeVisible();
  });
});

test.describe('Customer Detail Accessibility', () => {
  test('page loads and shows back link', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goto('some-nonexistent-id');

    // Back link should always be visible
    await expect(detailPage.backButton).toBeVisible();
  });

  test('page loads and shows not found message', async ({ page }) => {
    const detailPage = new CustomerDetailPage(page);
    await detailPage.goto('some-nonexistent-id');

    // Should show "Customer not found" heading
    await expect(page.getByRole('heading', { name: /customer not found/i })).toBeVisible();
  });
});
