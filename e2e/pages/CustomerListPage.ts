import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object Model for the Customer List page.
 */
export class CustomerListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly clearSearchButton: Locator;
  readonly customerTable: Locator;
  readonly customerRows: Locator;
  readonly healthFilter: Locator;
  readonly countryFilter: Locator;
  readonly sortBySelect: Locator;
  readonly emptyStateMessage: Locator;
  readonly pagination: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /customers/i, level: 1 });
    this.searchInput = page.getByRole('textbox', { name: /search/i });
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.clearSearchButton = page.getByRole('button', { name: /clear/i });
    this.customerTable = page.locator('table');
    this.customerRows = page.locator('table tbody tr');
    this.healthFilter = page.getByRole('combobox', { name: /health status/i });
    this.countryFilter = page.getByRole('combobox', { name: /country/i });
    this.sortBySelect = page.getByRole('combobox', { name: /sort/i });
    this.emptyStateMessage = page.getByText(/no customer data|no customers found|no results/i);
    this.pagination = page.locator('[data-testid="pagination"]');
    this.exportButton = page.getByRole('button', { name: /export/i });
  }

  async goto() {
    await this.page.goto('/customers');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }

  async getCustomerCount(): Promise<number> {
    return await this.customerRows.count();
  }

  async clickCustomer(name: string) {
    await this.page.getByRole('link', { name: new RegExp(name, 'i') }).click();
  }

  async filterByHealth(status: 'all' | 'healthy' | 'at-risk' | 'critical') {
    await this.healthFilter.selectOption(status);
  }

  async filterByCountry(country: string) {
    await this.countryFilter.selectOption(country);
  }
}
