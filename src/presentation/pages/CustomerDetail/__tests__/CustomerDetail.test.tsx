import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import type { CustomerSummaryDTO } from '@application/dtos';
import { useCustomerStore } from '@presentation/stores';

import { CustomerDetail } from '../CustomerDetail';

// Mock react-router-dom's useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ customerId: '123' })),
  };
});

// CustomerSummaryDTO for the customers array (what the component now uses)
const mockCustomerSummary: CustomerSummaryDTO = {
  id: '123',
  accountOwner: 'Hotel Grand Plaza',
  latestLogin: new Date().toISOString(),
  billingCountry: 'Germany',
  accountType: 'Pro',
  status: 'Active Customer',
  mrr: 2500,
  channelCount: 3,
  healthScore: 75,
  healthClassification: 'healthy',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CustomerDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCustomerStore.getState().clearAll();
  });

  describe('not found state', () => {
    it('shows not found when no customers in store', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-not-found')).toBeInTheDocument();
      expect(screen.getByText('Customer not found')).toBeInTheDocument();
    });

    it('shows not found when customer ID does not match', () => {
      useCustomerStore.getState().setCustomers([{
        ...mockCustomerSummary,
        id: '456', // Different from the mocked useParams
      }]);

      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-not-found')).toBeInTheDocument();
    });

    it('shows back to customers link in not found state', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Back to Customers')).toBeInTheDocument();
    });
  });

  describe('with customer data', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders customer detail content', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
    });

    it('displays customer name', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-name')).toHaveTextContent('Hotel Grand Plaza');
    });

    it('displays customer ID', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-id')).toHaveTextContent('ID: 123');
    });

    it('displays status badge', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Active Customer')).toBeInTheDocument();
    });

    it('displays account type badge', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('displays health score gauge', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('health-score-gauge')).toBeInTheDocument();
    });

    it('shows back navigation link', () => {
      renderWithRouter(<CustomerDetail />);

      const backLink = screen.getByText('Back to Customers');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/customers');
    });
  });

  describe('customer info section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders customer info section', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-info-section')).toBeInTheDocument();
    });

    it('displays billing country', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-country')).toHaveTextContent('Germany');
    });

    it('displays languages (empty when using summary)', () => {
      renderWithRouter(<CustomerDetail />);

      // Summary doesn't have languages, so it shows "None"
      expect(screen.getByTestId('customer-languages')).toHaveTextContent('None');
    });
  });

  describe('financial section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders financial section', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('financial-section')).toBeInTheDocument();
    });

    it('displays MRR with currency formatting', () => {
      renderWithRouter(<CustomerDetail />);

      // USD formatting (default currency when using summary)
      expect(screen.getByTestId('customer-mrr')).toHaveTextContent(/2.*500/);
    });
  });

  describe('channels section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders channels section', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('channels-section')).toBeInTheDocument();
    });

    it('shows no channels connected (summary only has count, not channel names)', () => {
      renderWithRouter(<CustomerDetail />);

      // Summary doesn't have channel names, only count
      expect(screen.getByText('No channels connected')).toBeInTheDocument();
    });

    it('shows channel count of zero (summary channels array is empty)', () => {
      renderWithRouter(<CustomerDetail />);

      // Summary converts to DTO with empty channels array
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      // Multiple elements match "channels connected" text, so use getAllByText
      expect(screen.getAllByText(/channels connected/).length).toBeGreaterThan(0);
    });
  });

  describe('timeline section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders timeline section with loading skeleton when no data', () => {
      renderWithRouter(<CustomerDetail />);

      // Timeline is null by default (will be connected to use case later)
      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
    });
  });

  describe('health breakdown section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders health breakdown section with loading skeleton when no data', () => {
      renderWithRouter(<CustomerDetail />);

      // Breakdown is null by default (will be connected to use case later)
      expect(screen.getByTestId('health-breakdown-section')).toBeInTheDocument();
    });
  });

  describe('comparative section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setCustomers([mockCustomerSummary]);
    });

    it('renders comparative section with loading skeleton when no data', () => {
      renderWithRouter(<CustomerDetail />);

      // Comparative metrics are null by default
      expect(screen.getByTestId('comparative-section')).toBeInTheDocument();
    });
  });

  describe('inactive customer', () => {
    it('shows inactive status with default badge', () => {
      useCustomerStore.getState().setCustomers([{
        ...mockCustomerSummary,
        status: 'Inactive Customer',
      }]);

      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Inactive Customer')).toBeInTheDocument();
    });
  });

  describe('starter account', () => {
    it('shows starter account type with default badge', () => {
      useCustomerStore.getState().setCustomers([{
        ...mockCustomerSummary,
        accountType: 'Starter',
      }]);

      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Starter')).toBeInTheDocument();
    });
  });
});
