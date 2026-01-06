import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Dashboard page.
 * Encapsulates selectors and actions for E2E tests.
 */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly dataStatusMessage: Locator;
  readonly healthIndicators: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', {
      name: /customer success metrics dashboard/i,
    });
    this.dataStatusMessage = page.getByText(/no data loaded yet|data loaded at/i);
    this.healthIndicators = page.locator('.bg-healthy, .bg-at-risk, .bg-critical');
  }

  async goto() {
    await this.page.goto('/');
  }

  async getTitle() {
    return this.page.title();
  }
}
