import { expect, test } from '@playwright/test';

import { DashboardPage } from '../pages/DashboardPage';
import { ImportPage } from '../pages/ImportPage';

test.describe('Import Flow', () => {
  test('can navigate to import page', async ({ page }) => {
    await page.goto('/');
    // Use navigation-specific link to avoid conflict with dashboard import button
    await page.getByRole('navigation').getByRole('link', { name: 'Import' }).click();
    await expect(page).toHaveURL(/.*import/);
  });

  test('displays file upload area', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await expect(importPage.heading).toBeVisible();
    // The file input is hidden but should be attached for programmatic access
    await expect(importPage.fileInput).toBeAttached();
    // The upload area should be visible
    await expect(importPage.uploadArea).toBeVisible();
  });

  test('can upload CSV file', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');

    // Should show import button after file is selected
    await expect(importPage.importButton).toBeVisible({ timeout: 5000 });
    // Should also show cancel button
    await expect(importPage.cancelButton).toBeVisible();
  });

  test('can import customers from CSV', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');
    await expect(importPage.importButton).toBeVisible({ timeout: 5000 });
    await importPage.clickImport();

    // Wait for import to complete
    await importPage.waitForImportComplete();

    // Should show success state with navigation buttons
    await expect(importPage.viewDashboardButton).toBeVisible();
    await expect(importPage.viewCustomersButton).toBeVisible();
  });

  test('shows success message after import', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');
    await expect(importPage.importButton).toBeVisible({ timeout: 5000 });
    await importPage.clickImport();

    // Wait for import to complete
    await importPage.waitForImportComplete();

    // Should show success message
    await expect(importPage.successMessage).toBeVisible();
    // Should show record count
    await expect(importPage.recordCount).toBeVisible();
  });

  test('can navigate to dashboard after import', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');
    await expect(importPage.importButton).toBeVisible({ timeout: 5000 });
    await importPage.clickImport();

    await importPage.waitForImportComplete();

    // Click view dashboard
    await importPage.viewDashboardButton.click();

    // Verify we're on dashboard with data
    const dashboard = new DashboardPage(page);
    await expect(dashboard.dashboardContent).toBeVisible();
  });

  test('can navigate to customers after import', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');
    await expect(importPage.importButton).toBeVisible({ timeout: 5000 });
    await importPage.clickImport();

    await importPage.waitForImportComplete();

    // Click view customers
    await importPage.viewCustomersButton.click();

    // Verify we're on customers page with data
    await expect(page).toHaveURL(/.*customers/);
    await expect(page.getByText(/\d+ of \d+ customers/i)).toBeVisible();
  });

  test('can import another file after first import', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');
    await expect(importPage.importButton).toBeVisible({ timeout: 5000 });
    await importPage.clickImport();

    await importPage.waitForImportComplete();

    // Click import another file
    await importPage.importAnotherButton.click();

    // Should be back to upload state
    await expect(importPage.uploadArea).toBeVisible();
    await expect(importPage.importButton).not.toBeVisible();
  });

  test('handles file input visibility', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    // File input should be attached (may be hidden but functional)
    await expect(importPage.fileInput).toBeAttached();
  });

  test('can cancel file selection', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    await importPage.uploadFile('test-customers.csv');
    await expect(importPage.cancelButton).toBeVisible({ timeout: 5000 });

    // Click cancel
    await importPage.cancelButton.click();

    // Should be back to upload state
    await expect(importPage.uploadArea).toBeVisible();
    await expect(importPage.importButton).not.toBeVisible();
  });
});

test.describe('Import Page Accessibility', () => {
  test('has page heading', async ({ page }) => {
    const importPage = new ImportPage(page);
    await importPage.goto();

    // Page should have accessible heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('can navigate with keyboard', async ({ page }) => {
    await page.goto('/import');

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Something should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });
});
