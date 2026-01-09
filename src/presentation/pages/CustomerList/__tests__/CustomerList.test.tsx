import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomerSummaryDTO } from '@application/dtos';

import { CustomerList } from '../CustomerList';

// Mock customer data
const mockCustomers: CustomerSummaryDTO[] = [
  {
    id: 'CUST-001',
    accountOwner: 'Hotel Alpha',
    accountName: 'Alpha Hotels Inc',
    status: 'Active Customer',
    accountType: 'Pro',
    healthScore: 85,
    healthClassification: 'healthy',
    mrr: 2500,
    channelCount: 4,
    latestLogin: new Date().toISOString(),
    lastCsContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'USA',
  },
  {
    id: 'CUST-002',
    accountOwner: 'Hotel Beta',
    accountName: 'Beta Hospitality Group',
    status: 'Active Customer',
    accountType: 'Starter',
    healthScore: 45,
    healthClassification: 'at-risk',
    mrr: 800,
    channelCount: 2,
    latestLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastCsContactDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'Germany',
  },
  {
    id: 'CUST-003',
    accountOwner: 'Hotel Gamma',
    accountName: 'Gamma Resorts LLC',
    status: 'Inactive Customer',
    accountType: 'Pro',
    healthScore: 20,
    healthClassification: 'critical',
    mrr: 1500,
    channelCount: 1,
    latestLogin: null,
    lastCsContactDate: null,
    billingCountry: 'France',
  },
];

// Mock the stores
const mockCustomerStore = vi.fn(() => mockCustomers);

vi.mock('@presentation/stores', () => ({
  useCustomerStore: (selector: (state: { customers: CustomerSummaryDTO[] }) => CustomerSummaryDTO[]) =>
    selector({ customers: mockCustomerStore() }),
}));

// Mock use case execute function
const mockSearchExecute = vi.fn();

vi.mock('@presentation/context', () => ({
  useUseCases: () => ({
    searchCustomers: {
      execute: mockSearchExecute,
    },
  }),
}));

const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ['/customers'] } = {}
) => {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
};

describe('CustomerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomerStore.mockReturnValue(mockCustomers);
    mockSearchExecute.mockReturnValue({
      success: true,
      value: {
        customers: mockCustomers,
        totalCount: mockCustomers.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        appliedFilters: [],
      },
    });
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithRouter(<CustomerList />);

      expect(screen.getByText('Customers')).toBeInTheDocument();
    });

    it('renders customer count subtitle', () => {
      renderWithRouter(<CustomerList />);

      expect(screen.getByText(/3 of 3 customers/)).toBeInTheDocument();
    });

    it('renders search input', () => {
      renderWithRouter(<CustomerList />);

      expect(
        screen.getByPlaceholderText('Search by ID, name, or country...')
      ).toBeInTheDocument();
    });

    it('renders import more button', () => {
      renderWithRouter(<CustomerList />);

      expect(screen.getByText('Import More')).toBeInTheDocument();
    });

    it('renders customer table', () => {
      renderWithRouter(<CustomerList />);

      // Check for table data-testid and customer data (may appear multiple times in mobile/desktop views)
      expect(screen.getByTestId('customer-table')).toBeInTheDocument();
      expect(screen.getAllByText('Hotel Alpha').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Hotel Beta').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no customers imported', () => {
      mockCustomerStore.mockReturnValue([]);

      renderWithRouter(<CustomerList />);

      expect(screen.getByText('No customer data')).toBeInTheDocument();
      expect(
        screen.getByText('Import a CSV file to get started with customer data.')
      ).toBeInTheDocument();
    });

    it('shows import button in empty state', () => {
      mockCustomerStore.mockReturnValue([]);

      renderWithRouter(<CustomerList />);

      expect(screen.getByText('Import Customers')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('updates search on input change', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CustomerList />);

      const searchInput = screen.getByPlaceholderText(
        'Search by ID, name, or country...'
      );
      await user.type(searchInput, 'Alpha');

      expect(searchInput).toHaveValue('Alpha');
    });

    it('calls search use case with query', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CustomerList />);

      const searchInput = screen.getByPlaceholderText(
        'Search by ID, name, or country...'
      );
      await user.type(searchInput, 'Alpha');

      await waitFor(() => {
        expect(mockSearchExecute).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'Alpha',
          })
        );
      });
    });
  });

  describe('URL filters', () => {
    it('shows health filter badge when health param present', () => {
      renderWithRouter(<CustomerList />, {
        initialEntries: ['/customers?health=atRisk'],
      });

      expect(screen.getByText(/Health: At Risk/)).toBeInTheDocument();
    });

    it('shows country filter badge when country param present', () => {
      renderWithRouter(<CustomerList />, {
        initialEntries: ['/customers?country=Germany'],
      });

      expect(screen.getByText(/Country: Germany/)).toBeInTheDocument();
    });

    it('shows channel filter badge when channel param present', () => {
      renderWithRouter(<CustomerList />, {
        initialEntries: ['/customers?channel=Booking.com'],
      });

      expect(screen.getByText(/Channel: Booking.com/)).toBeInTheDocument();
    });

    it('shows clear all link when filters active', () => {
      renderWithRouter(<CustomerList />, {
        initialEntries: ['/customers?health=healthy'],
      });

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('applies health filter to search use case', () => {
      renderWithRouter(<CustomerList />, {
        initialEntries: ['/customers?health=critical'],
      });

      expect(mockSearchExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          healthStatus: 'critical',
        })
      );
    });
  });

  describe('sorting', () => {
    it('sorts by health score by default', () => {
      renderWithRouter(<CustomerList />);

      expect(mockSearchExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'healthScore',
          sortOrder: 'asc',
        })
      );
    });
  });

  describe('pagination', () => {
    it('passes current page to search use case', () => {
      renderWithRouter(<CustomerList />);

      expect(mockSearchExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
        })
      );
    });
  });

  describe('navigation', () => {
    it('renders import more button that can be clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CustomerList />);

      const importButton = screen.getByText('Import More');
      expect(importButton).toBeInTheDocument();

      // Button should be clickable
      await user.click(importButton);
    });
  });

  describe('filter description', () => {
    it('shows filter description in subtitle', () => {
      renderWithRouter(<CustomerList />, {
        initialEntries: ['/customers?health=healthy&country=USA'],
      });

      expect(screen.getByText(/Healthy health/)).toBeInTheDocument();
      expect(screen.getByText(/in USA/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows empty results when search use case fails', () => {
      mockSearchExecute.mockReturnValue({
        success: false,
        error: 'Search failed',
      });

      renderWithRouter(<CustomerList />);

      // Should still render page title
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });
  });
});
