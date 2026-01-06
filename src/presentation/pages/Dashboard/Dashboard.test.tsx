import { BrowserRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardMetricsDTO } from '@application/dtos';

import { Dashboard } from './Dashboard';

// Create a state holder that we can manipulate
let mockState = {
  dashboardMetrics: null as DashboardMetricsDTO | null,
  customers: [] as unknown[],
  lastUpdated: null as Date | null,
};

// Mock the customer store
vi.mock('@presentation/stores', () => ({
  useCustomerStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

// Helper to render with router
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// Sample dashboard metrics
const mockMetrics: DashboardMetricsDTO = {
  totalCustomers: 1234,
  activeCustomers: 987,
  inactiveCustomers: 247,
  averageHealthScore: 72.5,
  totalMrr: 50000,
  healthDistribution: {
    healthy: 700,
    atRisk: 400,
    critical: 134,
  },
  countryDistribution: [
    { name: 'USA', count: 500, mrr: 25000 },
    { name: 'UK', count: 300, mrr: 15000 },
  ],
  channelDistribution: [
    { name: 'Booking.com', count: 600 },
    { name: 'Expedia', count: 400 },
  ],
  propertyTypeDistribution: [
    { name: 'Hotels', count: 800 },
    { name: 'B&B', count: 434 },
  ],
};

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      dashboardMetrics: null,
      customers: [],
      lastUpdated: null,
    };
  });

  describe('empty state', () => {
    it('shows empty state when no metrics are loaded', () => {
      renderWithRouter(<Dashboard />);

      expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument();
      expect(screen.getByText('No customer data available')).toBeInTheDocument();
      expect(
        screen.getByText('Import a CSV file to see your customer success metrics and insights.')
      ).toBeInTheDocument();
    });

    it('shows import button in empty state', () => {
      renderWithRouter(<Dashboard />);

      const importButton = screen.getByRole('button', { name: /import customer data/i });
      expect(importButton).toBeInTheDocument();
    });

    it('links to import page from empty state', () => {
      renderWithRouter(<Dashboard />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/import');
    });
  });

  describe('content state', () => {
    beforeEach(() => {
      mockState = {
        dashboardMetrics: mockMetrics,
        customers: [],
        lastUpdated: new Date('2025-01-06T10:30:00'),
      };
    });

    it('renders dashboard content when metrics are loaded', () => {
      renderWithRouter(<Dashboard />);

      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('displays page header', () => {
      renderWithRouter(<Dashboard />);

      expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
      expect(screen.getByText('Customer success metrics overview')).toBeInTheDocument();
    });

    it('displays last updated timestamp', () => {
      renderWithRouter(<Dashboard />);

      expect(screen.getByTestId('last-updated')).toBeInTheDocument();
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('hides timestamp when lastUpdated is null', () => {
      mockState.lastUpdated = null;

      renderWithRouter(<Dashboard />);

      expect(screen.queryByTestId('last-updated')).not.toBeInTheDocument();
    });
  });

  describe('metrics display', () => {
    beforeEach(() => {
      mockState = {
        dashboardMetrics: mockMetrics,
        customers: [],
        lastUpdated: new Date('2025-01-06T10:30:00'),
      };
    });

    it('displays total customers', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('displays active customers', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByText('Active Customers')).toBeInTheDocument();
      expect(screen.getByText('987')).toBeInTheDocument();
    });

    it('displays at-risk customers metric', () => {
      renderWithRouter(<Dashboard />);
      // Get the metrics section to avoid collision with chart section heading
      const metricsSection = document.querySelector(
        '[aria-labelledby="metrics-heading"]'
      ) as HTMLElement;
      expect(metricsSection).toBeInTheDocument();
      expect(within(metricsSection).getByText('At-Risk Customers')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
    });

    it('displays total MRR', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByText('Total MRR')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    it('displays average health score', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByText('Avg Health Score')).toBeInTheDocument();
      // Health score '73' appears in both MetricCard and PortfolioHealthTrend
      expect(screen.getAllByText('73').length).toBeGreaterThan(0); // Rounded from 72.5
    });
  });

  describe('chart sections', () => {
    beforeEach(() => {
      mockState = {
        dashboardMetrics: mockMetrics,
        customers: [],
        lastUpdated: new Date('2025-01-06T10:30:00'),
      };
    });

    it('renders health distribution section', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByTestId('health-distribution-section')).toBeInTheDocument();
      expect(screen.getByText('Health Score Distribution')).toBeInTheDocument();
    });

    it('renders MRR by country section', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByTestId('mrr-by-country-section')).toBeInTheDocument();
      expect(screen.getByText('MRR by Country')).toBeInTheDocument();
    });

    it('renders channel adoption section', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByTestId('channel-adoption-section')).toBeInTheDocument();
      expect(screen.getByText('Channel Adoption')).toBeInTheDocument();
    });

    it('renders at-risk customers section', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByTestId('at-risk-customers-section')).toBeInTheDocument();
      // Use heading role to find the chart section heading
      const chartsSection = document.querySelector(
        '[aria-labelledby="charts-heading"]'
      ) as HTMLElement;
      expect(chartsSection).toBeInTheDocument();
      expect(
        within(chartsSection).getByRole('heading', { name: 'At-Risk Customers' })
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockState = {
        dashboardMetrics: mockMetrics,
        customers: [],
        lastUpdated: new Date('2025-01-06T10:30:00'),
      };
    });

    it('has accessible section headings', () => {
      renderWithRouter(<Dashboard />);

      // Screen reader only headings
      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
      expect(screen.getByText('Analytics Charts')).toBeInTheDocument();
    });

    it('uses semantic sections with aria labels', () => {
      renderWithRouter(<Dashboard />);

      const metricsSection = document.querySelector('[aria-labelledby="metrics-heading"]');
      expect(metricsSection).toBeInTheDocument();

      const chartsSection = document.querySelector('[aria-labelledby="charts-heading"]');
      expect(chartsSection).toBeInTheDocument();
    });
  });
});
