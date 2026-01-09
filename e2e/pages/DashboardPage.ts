import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object Model for the Dashboard page.
 * Encapsulates selectors and actions for E2E tests.
 */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emptyState: Locator;
  readonly dashboardContent: Locator;
  readonly metricCards: Locator;
  readonly totalCustomersMetric: Locator;
  readonly activeCustomersMetric: Locator;
  readonly atRiskMetric: Locator;
  readonly totalMrrMetric: Locator;
  readonly avgHealthMetric: Locator;
  readonly importButton: Locator;
  readonly lastUpdated: Locator;
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i, level: 1 });
    this.emptyState = page.getByTestId('dashboard-empty');
    this.dashboardContent = page.getByTestId('dashboard-content');
    this.metricCards = page.locator('[data-testid^="metric-"]');
    this.totalCustomersMetric = page.getByTestId('metric-total-customers');
    this.activeCustomersMetric = page.getByTestId('metric-active-customers');
    this.atRiskMetric = page.getByTestId('metric-at-risk');
    this.totalMrrMetric = page.getByTestId('metric-total-mrr');
    this.avgHealthMetric = page.getByTestId('metric-avg-health');
    this.importButton = page.getByRole('link', { name: /import customer data/i });
    this.lastUpdated = page.getByTestId('last-updated');
    this.emptyStateMessage = page.getByText(/no customer data available/i);
  }

  async goto() {
    await this.page.goto('/');
  }

  async getTitle() {
    return this.page.title();
  }

  async hasData(): Promise<boolean> {
    return (await this.dashboardContent.count()) > 0;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.emptyState.count()) > 0;
  }
}
