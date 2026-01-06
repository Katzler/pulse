import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import type { CustomerDTO } from '@application/dtos';
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

const mockCustomer: CustomerDTO = {
  id: '123',
  accountOwner: 'Hotel Grand Plaza',
  latestLogin: new Date().toISOString(),
  createdDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  billingCountry: 'Germany',
  accountType: 'Pro',
  languages: ['English', 'German'],
  status: 'Active Customer',
  accountStatus: 'Loyal',
  propertyType: 'Hotel',
  mrr: 2500,
  currency: 'EUR',
  channels: ['Booking.com', 'Expedia', 'Website'],
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
    it('shows not found when no customer is selected', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-not-found')).toBeInTheDocument();
      expect(screen.getByText('Customer not found')).toBeInTheDocument();
    });

    it('shows not found when customer ID does not match', () => {
      useCustomerStore.getState().setSelectedCustomer({
        ...mockCustomer,
        id: '456', // Different from the mocked useParams
      });

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
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
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
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
    });

    it('renders customer info section', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-info-section')).toBeInTheDocument();
    });

    it('displays billing country', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-country')).toHaveTextContent('Germany');
    });

    it('displays languages', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('customer-languages')).toHaveTextContent('English, German');
    });
  });

  describe('financial section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
    });

    it('renders financial section', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('financial-section')).toBeInTheDocument();
    });

    it('displays MRR with currency formatting', () => {
      renderWithRouter(<CustomerDetail />);

      // EUR formatting
      expect(screen.getByTestId('customer-mrr')).toHaveTextContent(/2.*500/);
    });
  });

  describe('channels section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
    });

    it('renders channels section', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByTestId('channels-section')).toBeInTheDocument();
    });

    it('displays channel badges', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Booking.com')).toBeInTheDocument();
      expect(screen.getByText('Expedia')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
    });

    it('shows channel count', () => {
      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/channels connected/)).toBeInTheDocument();
    });

    it('handles empty channels', () => {
      useCustomerStore.getState().setSelectedCustomer({
        ...mockCustomer,
        channels: [],
      });

      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('No channels connected')).toBeInTheDocument();
      // Multiple elements may show "0" (channel count, health score scale, etc.)
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  describe('timeline section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
    });

    it('renders timeline section with loading skeleton when no data', () => {
      renderWithRouter(<CustomerDetail />);

      // Timeline is null by default (will be connected to use case later)
      expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
    });
  });

  describe('health breakdown section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
    });

    it('renders health breakdown section with loading skeleton when no data', () => {
      renderWithRouter(<CustomerDetail />);

      // Breakdown is null by default (will be connected to use case later)
      expect(screen.getByTestId('health-breakdown-section')).toBeInTheDocument();
    });
  });

  describe('comparative section', () => {
    beforeEach(() => {
      useCustomerStore.getState().setSelectedCustomer(mockCustomer);
    });

    it('renders comparative section with loading skeleton when no data', () => {
      renderWithRouter(<CustomerDetail />);

      // Comparative metrics are null by default
      expect(screen.getByTestId('comparative-section')).toBeInTheDocument();
    });
  });

  describe('inactive customer', () => {
    it('shows inactive status with default badge', () => {
      useCustomerStore.getState().setSelectedCustomer({
        ...mockCustomer,
        status: 'Inactive Customer',
      });

      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Inactive Customer')).toBeInTheDocument();
    });
  });

  describe('starter account', () => {
    it('shows starter account type with default badge', () => {
      useCustomerStore.getState().setSelectedCustomer({
        ...mockCustomer,
        accountType: 'Starter',
      });

      renderWithRouter(<CustomerDetail />);

      expect(screen.getByText('Starter')).toBeInTheDocument();
    });
  });
});
