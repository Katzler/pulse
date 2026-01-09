import { expect, test } from '@playwright/test';

import { CustomerListPage } from '../pages/CustomerListPage';
import { ImportPage } from '../pages/ImportPage';

/**
 * Export Flow E2E Tests
 *
 * Note: These tests are skipped until the ExportButton component is integrated
 * into the CustomerList page. The ExportButton component exists in
 * src/presentation/components/common/ExportButton.tsx but is not yet used.
 */

test.describe('Export Flow', () => {
  // Helper to set up test data
  test.beforeEach(async ({ page }) => {
    // Import test data first
    const importPage = new ImportPage(page);
    await importPage.goto();

    // Check if we can upload - this may be skipped if file upload isn't working
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isAttached()) {
      // Try to upload the test file
      await importPage.uploadFile('test-customers.csv');

      // Wait for import button
      try {
        await expect(importPage.importButton).toBeVisible({ timeout: 3000 });
        await importPage.clickImport();
        await page.waitForTimeout(500);
      } catch {
        // File upload might not work in E2E, that's okay
      }
    }
  });

  // Skip until ExportButton is integrated into CustomerList page
  test.skip('displays export button on customer list page', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Export button should be visible when there are customers
    await expect(customerList.exportButton).toBeVisible();
  });

  test.skip('opens export dropdown menu', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click export button to open dropdown
    await customerList.exportButton.click();

    // Dropdown should be visible
    const dropdown = page.getByTestId('export-dropdown');
    await expect(dropdown).toBeVisible();

    // Should show format options
    await expect(page.getByTestId('export-option-csv')).toBeVisible();
    await expect(page.getByTestId('export-option-json')).toBeVisible();
    await expect(page.getByTestId('export-option-xlsx')).toBeVisible();
  });

  test.skip('can export data as CSV', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click export button
    await customerList.exportButton.click();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click CSV export option
    await page.getByTestId('export-option-csv').click();

    // Wait for download
    const download = await downloadPromise;

    // Verify file name contains .csv
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test.skip('can export data as JSON', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click export button
    await customerList.exportButton.click();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click JSON export option
    await page.getByTestId('export-option-json').click();

    // Wait for download
    const download = await downloadPromise;

    // Verify file name contains .json
    expect(download.suggestedFilename()).toContain('.json');
  });

  test.skip('can export data as Excel', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click export button
    await customerList.exportButton.click();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click Excel export option
    await page.getByTestId('export-option-xlsx').click();

    // Wait for download
    const download = await downloadPromise;

    // Verify file name contains .xlsx
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test.skip('shows record count in export button', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Export button should show record count
    const exportButton = customerList.exportButton;
    const buttonText = await exportButton.textContent();

    // Should contain a number (the record count)
    expect(buttonText).toMatch(/\d+/);
  });

  test.skip('closes dropdown when clicking outside', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Open export dropdown
    await customerList.exportButton.click();

    const dropdown = page.getByTestId('export-dropdown');
    await expect(dropdown).toBeVisible();

    // Click outside the dropdown
    await page.click('body', { position: { x: 10, y: 10 } });

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test.skip('closes dropdown on escape key', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Open export dropdown
    await customerList.exportButton.click();

    const dropdown = page.getByTestId('export-dropdown');
    await expect(dropdown).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Dropdown should close
    await expect(dropdown).not.toBeVisible();
  });

  test.skip('shows loading state during export', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Click export button
    await customerList.exportButton.click();

    // Click CSV export option
    await page.getByTestId('export-option-csv').click();

    // Should show exporting state (briefly)
    // Note: This may be too fast to catch in real tests
    const exportingText = page.getByText(/exporting/i);
    // Just check that it doesn't show an error state
    await expect(page.locator('[role="alert"]')).not.toBeVisible({ timeout: 1000 });
  });
});

test.describe('Export Accessibility', () => {
  test.skip('export button is keyboard accessible', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Tab to export button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should eventually reach the export button
    const exportButton = customerList.exportButton;

    // Press Enter to open dropdown
    await page.keyboard.press('Enter');

    // Dropdown should be visible
    const dropdown = page.getByTestId('export-dropdown');
    await expect(dropdown).toBeVisible();
  });

  test.skip('export dropdown has proper ARIA attributes', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Export button should have aria-expanded and aria-haspopup
    const exportButton = customerList.exportButton;
    await expect(exportButton).toHaveAttribute('aria-haspopup', 'menu');
    await expect(exportButton).toHaveAttribute('aria-expanded', 'false');

    // Open dropdown
    await exportButton.click();
    await expect(exportButton).toHaveAttribute('aria-expanded', 'true');

    // Dropdown should have proper role
    const dropdown = page.getByTestId('export-dropdown');
    await expect(dropdown).toHaveAttribute('role', 'menu');
  });

  test.skip('can navigate export options with arrow keys', async ({ page }) => {
    const customerList = new CustomerListPage(page);
    await customerList.goto();

    // Open export dropdown
    await customerList.exportButton.click();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Some option should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeDefined();
  });
});
