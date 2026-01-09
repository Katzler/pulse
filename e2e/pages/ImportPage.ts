import { type Locator, type Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Page Object Model for the Import page.
 */
export class ImportPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly uploadArea: Locator;
  readonly fileInput: Locator;
  readonly importButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly previewTable: Locator;
  readonly recordCount: Locator;
  readonly viewDashboardButton: Locator;
  readonly viewCustomersButton: Locator;
  readonly cancelButton: Locator;
  readonly importAnotherButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /import data/i, level: 1 });
    // The upload area is a div with role="button" and aria-label
    this.uploadArea = page.getByRole('button', { name: /upload customer csv file/i });
    // The file input is hidden but can still receive files programmatically
    this.fileInput = page.locator('input[type="file"]');
    // Import Data button appears after file selection
    this.importButton = page.getByRole('button', { name: /^import data$/i });
    this.successMessage = page.getByText(/import successful|import completed/i);
    this.errorMessage = page.locator('[role="alert"]');
    this.previewTable = page.locator('table');
    this.recordCount = page.getByText(/\d+ of \d+ customers imported/i);
    this.viewDashboardButton = page.getByRole('button', { name: /view dashboard/i });
    this.viewCustomersButton = page.getByRole('button', { name: /view customers/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.importAnotherButton = page.getByRole('button', { name: /import another file/i });
  }

  async goto() {
    await this.page.goto('/import');
  }

  async uploadFile(filename: string) {
    const filePath = path.join(__dirname, '..', 'fixtures', filename);
    // Use setInputFiles on the hidden input - Playwright handles this even for hidden inputs
    await this.fileInput.setInputFiles(filePath);
  }

  async clickImport() {
    await this.importButton.click();
  }

  async getImportedCount(): Promise<string | null> {
    const text = await this.recordCount.textContent();
    return text;
  }

  async waitForImportComplete() {
    // Wait for either success or error state
    await this.page.waitForSelector('text=/import successful|import completed|import failed/i', {
      timeout: 10000,
    });
  }

  async isImportSuccessful(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }
}
