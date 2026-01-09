import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { CustomerSummaryDTO } from '@application/dtos';

import { CustomerTable } from '../CustomerTable';

const mockCustomers: CustomerSummaryDTO[] = [
  {
    id: '33001',
    accountOwner: 'Hotel Alpha',
    accountName: 'Alpha Hotels Inc',
    status: 'Active Customer',
    accountType: 'Pro',
    healthScore: 85,
    healthClassification: 'healthy',
    mrr: 2265,
    channelCount: 5,
    latestLogin: new Date().toISOString(),
    lastCsContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'USA',
  },
  {
    id: '33142',
    accountOwner: 'Hotel Beta',
    accountName: 'Beta Hospitality Group',
    status: 'Inactive Customer',
    accountType: 'Pro',
    healthScore: 45,
    healthClassification: 'at-risk',
    mrr: 1500,
    channelCount: 3,
    latestLogin: new Date().toISOString(),
    lastCsContactDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'Germany',
  },
  {
    id: '33171',
    accountOwner: 'Hotel Gamma',
    accountName: 'Gamma Resorts LLC',
    status: 'Inactive Customer',
    accountType: 'Starter',
    healthScore: 15,
    healthClassification: 'critical',
    mrr: 547,
    channelCount: 2,
    latestLogin: new Date().toISOString(),
    lastCsContactDate: null,
    billingCountry: 'France',
  },
];

describe('CustomerTable', () => {
  describe('rendering', () => {
    it('renders the table container', () => {
      render(<CustomerTable customers={mockCustomers} />);

      expect(screen.getByTestId('customer-table')).toBeInTheDocument();
    });

    it('displays customer data in table', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Multiple elements due to desktop table + mobile cards
      expect(screen.getAllByText('Hotel Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('33001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    });

    it('displays all customers', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Multiple elements due to desktop table + mobile cards
      expect(screen.getAllByText('Hotel Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Hotel Beta').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Hotel Gamma').length).toBeGreaterThan(0);
    });

    it('renders table headers', () => {
      render(<CustomerTable customers={mockCustomers} />);

      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('MRR')).toBeInTheDocument();
    });
  });

  describe('health score display', () => {
    it('displays health score values', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Multiple elements due to desktop table + mobile cards
      expect(screen.getAllByText('85').length).toBeGreaterThan(0);
      expect(screen.getAllByText('45').length).toBeGreaterThan(0);
      expect(screen.getAllByText('15').length).toBeGreaterThan(0);
    });

    it('has accessible health score labels', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Multiple elements due to desktop table + mobile cards
      expect(screen.getAllByLabelText(/Health score 85, Healthy/).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/Health score 45, At Risk/).length).toBeGreaterThan(0);
      expect(screen.getAllByLabelText(/Health score 15, Critical/).length).toBeGreaterThan(0);
    });
  });

  describe('MRR formatting', () => {
    it('formats MRR values correctly', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Multiple elements due to desktop table + mobile cards
      expect(screen.getAllByText('$2.3K').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$1.5K').length).toBeGreaterThan(0);
      expect(screen.getAllByText('$547').length).toBeGreaterThan(0);
    });
  });

  describe('status display', () => {
    it('shows status badges', () => {
      render(<CustomerTable customers={mockCustomers} />);

      // Multiple elements due to desktop table + mobile cards
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
    });
  });

  describe('sorting', () => {
    it('calls onSort when column header is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      render(<CustomerTable customers={mockCustomers} onSort={onSort} />);

      const healthHeader = screen.getByRole('button', { name: /sort by health/i });
      await user.click(healthHeader);

      expect(onSort).toHaveBeenCalledWith('healthScore');
    });

    it('shows sort indicator for active column', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          sortKey="healthScore"
          sortOrder="asc"
        />
      );

      // Look for the ascending arrow (may be multiple if repeated)
      expect(screen.getAllByText('↑').length).toBeGreaterThan(0);
    });

    it('shows descending indicator', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          sortKey="healthScore"
          sortOrder="desc"
        />
      );

      expect(screen.getAllByText('↓').length).toBeGreaterThan(0);
    });

    it('sorts by different columns', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      render(<CustomerTable customers={mockCustomers} onSort={onSort} />);

      const mrrHeader = screen.getByRole('button', { name: /sort by mrr/i });
      await user.click(mrrHeader);

      expect(onSort).toHaveBeenCalledWith('mrr');
    });
  });

  describe('row interactions', () => {
    it('calls onRowClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      render(<CustomerTable customers={mockCustomers} onRowClick={onRowClick} />);

      const viewButton = screen.getAllByText('View')[0];
      await user.click(viewButton);

      expect(onRowClick).toHaveBeenCalledWith('33001');
    });

    it('has hover state on rows when clickable', () => {
      render(<CustomerTable customers={mockCustomers} onRowClick={vi.fn()} />);

      const rows = screen.getAllByRole('button', { name: /view hotel/i });
      expect(rows[0]).toHaveClass('cursor-pointer');
    });

    it('supports keyboard navigation on rows', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      render(<CustomerTable customers={mockCustomers} onRowClick={onRowClick} />);

      const row = screen.getAllByRole('button', { name: /view hotel/i })[0];
      row.focus();
      await user.keyboard('{Enter}');

      expect(onRowClick).toHaveBeenCalledWith('33001');
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton when isLoading is true', () => {
      render(<CustomerTable customers={[]} isLoading />);

      expect(screen.getByTestId('customer-table')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Loading customers');
    });

    it('shows skeleton rows', () => {
      render(<CustomerTable customers={[]} isLoading />);

      // Check for animated skeleton elements
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no customers', () => {
      render(<CustomerTable customers={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No customers found')).toBeInTheDocument();
    });

    it('shows suggestion to adjust search', () => {
      render(<CustomerTable customers={[]} />);

      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });

    it('shows clear search button when handler provided', () => {
      render(<CustomerTable customers={[]} onClearSearch={vi.fn()} />);

      expect(screen.getByText('Clear Search')).toBeInTheDocument();
    });

    it('calls onClearSearch when clicked', async () => {
      const user = userEvent.setup();
      const onClearSearch = vi.fn();
      render(<CustomerTable customers={[]} onClearSearch={onClearSearch} />);

      await user.click(screen.getByText('Clear Search'));

      expect(onClearSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('pagination', () => {
    it('shows pagination when totalPages > 1', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      // Check for pagination text (may have partial matches)
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('does not show pagination when only 1 page', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('calls onPageChange when Previous clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByText('Previous'));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange when Next clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByText('Next'));

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('disables Previous on first page', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText('Previous')).toBeDisabled();
    });

    it('disables Next on last page', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={5}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has accessible table structure', () => {
      render(<CustomerTable customers={mockCustomers} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has accessible status region', () => {
      render(<CustomerTable customers={mockCustomers} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveTextContent(/showing 3 customers/i);
    });

    it('has accessible sort buttons with labels', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          sortKey="healthScore"
          sortOrder="asc"
          onSort={vi.fn()}
        />
      );

      const sortButton = screen.getByRole('button', { name: /sort by health, descending/i });
      expect(sortButton).toBeInTheDocument();
    });

    it('pagination has navigation role', () => {
      render(
        <CustomerTable
          customers={mockCustomers}
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    });
  });
});
