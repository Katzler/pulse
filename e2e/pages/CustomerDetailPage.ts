import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object Model for the Customer Detail page.
 */
export class CustomerDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly customerName: Locator;
  readonly healthScore: Locator;
  readonly healthBadge: Locator;
  readonly statusBadge: Locator;
  readonly accountType: Locator;
  readonly country: Locator;
  readonly mrr: Locator;
  readonly channels: Locator;
  readonly lastLogin: Locator;
  readonly createdDate: Locator;
  readonly notFoundMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    // Use more specific selector for the back button
    this.backButton = page.getByRole('link', { name: /back to customers/i });
    this.customerName = page.getByTestId('customer-name');
    this.healthScore = page.getByTestId('health-score');
    this.healthBadge = page.getByTestId('health-badge');
    this.statusBadge = page.getByTestId('status-badge');
    this.accountType = page.getByTestId('account-type');
    this.country = page.getByTestId('billing-country');
    this.mrr = page.getByTestId('mrr');
    this.channels = page.getByTestId('channels');
    this.lastLogin = page.getByTestId('last-login');
    this.createdDate = page.getByTestId('created-date');
    this.notFoundMessage = page.getByText(/customer not found/i);
  }

  async goto(customerId: string) {
    await this.page.goto(`/customers/${customerId}`);
  }

  async goBack() {
    await this.backButton.click();
  }
}
