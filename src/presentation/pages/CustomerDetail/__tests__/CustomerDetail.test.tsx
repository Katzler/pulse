import { BrowserRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ComparativeMetricsDTO,
  CustomerDTO,
  CustomerTimelineDTO,
  HealthScoreBreakdownDTO,
} from '@application/dtos';

import { CustomerDetail } from '../CustomerDetail';

// Mock react-router-dom's useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ customerId: '123' })),
  };
});

// Full CustomerDTO for use case result
const mockCustomer: CustomerDTO = {
  id: '123',
  accountOwner: 'Hotel Grand Plaza',
  accountName: 'Grand Plaza Hotels Inc',
  latestLogin: new Date().toISOString(),
  createdDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
  lastCsContactDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  billingCountry: 'Germany',
  accountType: 'Pro',
  languages: ['English', 'German'],
  status: 'Active Customer',
  accountStatus: 'Loyal',
  propertyType: 'Hotel',
  mrr: 2500,
  currency: 'EUR',
  channels: ['Booking.com', 'Expedia', 'Direct'],
  healthScore: 75,
  healthClassification: 'healthy',
};

const mockHealthBreakdown: HealthScoreBreakdownDTO = {
  activityScore: 30,
  loginRecencyScore: 20,
  channelAdoptionScore: 15,
  accountTypeScore: 10,
  mrrScore: 0,
  sentimentAdjustment: 0,
  totalScore: 75,
};

const mockComparativeMetrics: ComparativeMetricsDTO = {
  healthScoreVsAverage: 5.2,
  mrrVsAverage: 500,
  channelCountVsAverage: 1.5,
  percentileRank: 70,
};

const mockTimeline: CustomerTimelineDTO = {
  createdDate: mockCustomer.createdDate,
  daysSinceCreation: 90,
  lastLoginDate: mockCustomer.latestLogin,
  daysSinceLastLogin: 2,
  accountAgeCategory: 'established',
};

// Mock execute function
const mockExecute = vi.fn();

// Mock the context hooks (useUseCases and useSentimentRepository)
vi.mock('@presentation/context', () => ({
  useUseCases: vi.fn(() => ({
    getCustomerDetails: {
      execute: mockExecute,
    },
  })),
  useSentimentRepository: vi.fn(() => ({
    getSummaryByCustomerId: vi.fn(() => ({
      success: false,
      error: { type: 'SENTIMENT_NOT_FOUND', message: 'Not found', details: { customerId: '' } },
    })),
  })),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CustomerDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful response
    mockExecute.mockReturnValue({
      success: true,
      value: {
        customer: mockCustomer,
        healthScore: mockHealthBreakdown,
        comparativeMetrics: mockComparativeMetrics,
        timeline: mockTimeline,
      },
    });
  });

  describe('not found state', () => {
    it('shows not found when use case returns error', async () => {
      mockExecute.mockReturnValue({
        success: false,
        error: 'Customer not found: 123',
      });

      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-not-found')).toBeInTheDocument();
      });
      expect(screen.getByText('Customer not found')).toBeInTheDocument();
    });

    it('shows back to customers link in not found state', async () => {
      mockExecute.mockReturnValue({
        success: false,
        error: 'Customer not found',
      });

      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Back to Customers')).toBeInTheDocument();
      });
    });
  });

  describe('with customer data', () => {
    it('renders customer detail content', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
      });
    });

    it('displays account name as headline', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toHaveTextContent('Grand Plaza Hotels Inc');
      });
    });

    it('displays account owner', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        // Account owner appears in header and info section
        expect(screen.getAllByText('Hotel Grand Plaza').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays status badge', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Active Customer')).toBeInTheDocument();
      });
    });

    it('displays account type badge', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Pro')).toBeInTheDocument();
      });
    });

    it('displays health score gauge', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('health-score-gauge')).toBeInTheDocument();
      });
    });

    it('shows back navigation link', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        const backLink = screen.getByText('Back to Customers');
        expect(backLink).toBeInTheDocument();
        expect(backLink.closest('a')).toHaveAttribute('href', '/customers');
      });
    });
  });

  describe('customer info section', () => {
    it('renders customer info section', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-info-section')).toBeInTheDocument();
      });
    });

    it('displays billing country', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-country')).toHaveTextContent('Germany');
      });
    });

    it('displays languages', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-languages')).toHaveTextContent('English, German');
      });
    });
  });

  describe('financial section', () => {
    it('renders financial section', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('financial-section')).toBeInTheDocument();
      });
    });

    it('displays MRR with currency formatting', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        // EUR formatting
        expect(screen.getByTestId('customer-mrr')).toHaveTextContent(/2.*500/);
      });
    });
  });

  describe('channels section', () => {
    it('renders channels section', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('channels-section')).toBeInTheDocument();
      });
    });

    it('shows connected channels', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Booking.com')).toBeInTheDocument();
        expect(screen.getByText('Expedia')).toBeInTheDocument();
        expect(screen.getByText('Direct')).toBeInTheDocument();
      });
    });

    it('shows channel count', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        // The count is in a separate span, so check for the number
        expect(screen.getByText('3')).toBeInTheDocument();
        // And the text "channels connected"
        expect(screen.getByText(/channels connected/)).toBeInTheDocument();
      });
    });
  });

  describe('timeline section', () => {
    it('renders timeline section with data', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
        expect(screen.getByText('Established')).toBeInTheDocument();
      });
    });

    it('shows days since creation', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('90 days ago')).toBeInTheDocument();
      });
    });
  });

  describe('health breakdown section', () => {
    it('renders health breakdown section with data', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('health-breakdown-section')).toBeInTheDocument();
      });
    });

    it('displays health score factors', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Activity Status')).toBeInTheDocument();
        expect(screen.getByText('Login Recency')).toBeInTheDocument();
        expect(screen.getByText('Channel Adoption')).toBeInTheDocument();
        expect(screen.getByText('Account Type')).toBeInTheDocument();
        expect(screen.getByText('MRR Value')).toBeInTheDocument();
      });
    });

    it('displays total health score', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('total-health-score')).toHaveTextContent('75 / 100');
      });
    });
  });

  describe('comparative section', () => {
    it('renders comparative section with data', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('comparative-section')).toBeInTheDocument();
      });
    });

    it('displays percentile rank', async () => {
      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('percentile-rank')).toHaveTextContent('Top 30%');
      });
    });
  });

  describe('inactive customer', () => {
    it('shows inactive status with default badge', async () => {
      mockExecute.mockReturnValue({
        success: true,
        value: {
          customer: { ...mockCustomer, status: 'Inactive Customer' },
          healthScore: mockHealthBreakdown,
          comparativeMetrics: mockComparativeMetrics,
          timeline: mockTimeline,
        },
      });

      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Inactive Customer')).toBeInTheDocument();
      });
    });
  });

  describe('starter account', () => {
    it('shows starter account type with default badge', async () => {
      mockExecute.mockReturnValue({
        success: true,
        value: {
          customer: { ...mockCustomer, accountType: 'Starter' },
          healthScore: mockHealthBreakdown,
          comparativeMetrics: mockComparativeMetrics,
          timeline: mockTimeline,
        },
      });

      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });
    });
  });

  describe('customer never logged in', () => {
    it('shows "Never logged in" when latestLogin is null', async () => {
      mockExecute.mockReturnValue({
        success: true,
        value: {
          customer: { ...mockCustomer, latestLogin: null },
          healthScore: mockHealthBreakdown,
          comparativeMetrics: mockComparativeMetrics,
          timeline: { ...mockTimeline, lastLoginDate: null, daysSinceLastLogin: null },
        },
      });

      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('last-login')).toHaveTextContent('Never logged in');
      });
    });

    it('does not show relative time for login when customer never logged in', async () => {
      mockExecute.mockReturnValue({
        success: true,
        value: {
          customer: { ...mockCustomer, latestLogin: null },
          healthScore: mockHealthBreakdown,
          comparativeMetrics: mockComparativeMetrics,
          timeline: { ...mockTimeline, lastLoginDate: null, daysSinceLastLogin: null },
        },
      });

      renderWithRouter(<CustomerDetail />);

      await waitFor(() => {
        expect(screen.getByTestId('last-login')).toBeInTheDocument();
      });
      // The last-login element should contain "Never logged in" and not have a relative time below it
      const lastLoginElement = screen.getByTestId('last-login');
      expect(lastLoginElement).toHaveTextContent('Never logged in');
      // Parent should not have a "days ago" text for login (account creation may still show days ago)
      const parent = lastLoginElement.parentElement;
      expect(parent?.textContent).not.toMatch(/\d+ days ago/);
    });
  });
});
