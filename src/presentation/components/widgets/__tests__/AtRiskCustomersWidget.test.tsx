import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { CustomerSummaryDTO } from '@application/dtos';

import { AtRiskCustomersWidget } from '../AtRiskCustomersWidget';

// Sample test data - using dates relative to a fixed point for testing
const mockCustomers: CustomerSummaryDTO[] = [
  {
    id: '1',
    accountOwner: 'Hotel Alpha',
    accountName: 'Alpha Hotels Inc',
    status: 'Inactive Customer',
    accountType: 'Pro',
    healthScore: 25,
    healthClassification: 'critical',
    mrr: 1500,
    channelCount: 3,
    latestLogin: new Date(Date.now() - 142 * 24 * 60 * 60 * 1000).toISOString(), // 142 days ago
    lastCsContactDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'Germany',
  },
  {
    id: '2',
    accountOwner: 'Hotel Beta',
    accountName: 'Beta Hospitality Group',
    status: 'Active Customer',
    accountType: 'Starter',
    healthScore: 45,
    healthClassification: 'at-risk',
    mrr: 500,
    channelCount: 2,
    latestLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    lastCsContactDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'France',
  },
  {
    id: '3',
    accountOwner: 'Hotel Gamma',
    accountName: 'Gamma Resorts LLC',
    status: 'Active Customer',
    accountType: 'Pro',
    healthScore: 55,
    healthClassification: 'at-risk',
    mrr: 2000,
    channelCount: 4,
    latestLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    lastCsContactDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'Sweden',
  },
  {
    id: '4',
    accountOwner: 'Hotel Delta',
    accountName: 'Delta Inn Group',
    status: 'Active Customer',
    accountType: 'Pro',
    healthScore: 85,
    healthClassification: 'healthy',
    mrr: 3000,
    channelCount: 5,
    latestLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    lastCsContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    billingCountry: 'USA',
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AtRiskCustomersWidget', () => {
  describe('rendering', () => {
    it('renders the widget container', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      expect(screen.getByTestId('at-risk-customers-widget')).toBeInTheDocument();
    });

    it('displays at-risk and critical customers', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      // Account owner appears in both visible text and screen reader text
      expect(screen.getAllByText(/Hotel Alpha/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Hotel Beta/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Hotel Gamma/).length).toBeGreaterThanOrEqual(1);
    });

    it('does not display healthy customers', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      expect(screen.queryByText('Hotel Delta')).not.toBeInTheDocument();
    });

    it('shows health scores', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
    });

    it('shows customer MRR', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      expect(screen.getByText(/\$1\.5K\/mo/)).toBeInTheDocument();
      expect(screen.getByText(/\$500\/mo/)).toBeInTheDocument();
    });

    it('shows health classification badges', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getAllByText('At Risk').length).toBeGreaterThan(0);
    });

    it('shows account name and customer ID', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      // New format: Account Name - ID
      expect(screen.getByText(/Alpha Hotels Inc - 1/)).toBeInTheDocument();
      expect(screen.getByText(/Beta Hospitality Group - 2/)).toBeInTheDocument();
    });

    it('shows billing country', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      expect(screen.getByText(/Germany/)).toBeInTheDocument();
      expect(screen.getByText(/France/)).toBeInTheDocument();
      expect(screen.getByText(/Sweden/)).toBeInTheDocument();
    });

    it('shows last login time', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      // Check that last login is displayed (multiple rows show it)
      expect(screen.getAllByText(/Last login:/).length).toBeGreaterThan(0);
    });

    it('shows "Never logged in" when latestLogin is null', () => {
      const customerNeverLoggedIn: CustomerSummaryDTO[] = [
        {
          id: '5',
          accountOwner: 'Hotel Epsilon',
          accountName: 'Epsilon Hotels',
          status: 'Active Customer',
          accountType: 'Starter',
          healthScore: 30,
          healthClassification: 'at-risk',
          mrr: 400,
          channelCount: 1,
          latestLogin: null,
          lastCsContactDate: null,
          billingCountry: 'Spain',
        },
      ];

      renderWithRouter(<AtRiskCustomersWidget customers={customerNeverLoggedIn} />);

      expect(screen.getByText(/Never logged in/)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no at-risk customers', () => {
      const healthyCustomers: CustomerSummaryDTO[] = [
        {
          id: '1',
          accountOwner: 'Hotel Healthy',
          accountName: 'Healthy Hotels Inc',
          status: 'Active Customer',
          accountType: 'Pro',
          healthScore: 85,
          healthClassification: 'healthy',
          mrr: 1000,
          channelCount: 3,
          latestLogin: new Date().toISOString(),
          lastCsContactDate: new Date().toISOString(),
          billingCountry: 'USA',
        },
      ];

      renderWithRouter(<AtRiskCustomersWidget customers={healthyCustomers} />);

      expect(screen.getByText('No at-risk customers')).toBeInTheDocument();
      expect(screen.getByText('All customers are in good health')).toBeInTheDocument();
    });

    it('shows empty state when customer list is empty', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={[]} />);

      expect(screen.getByText('No at-risk customers')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('sorts customers by health score ascending (worst first)', () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <AtRiskCustomersWidget
          customers={mockCustomers}
          onCustomerClick={handleClick}
        />
      );

      const customerButtons = screen.getAllByRole('button');
      const firstCustomer = customerButtons[0];
      const secondCustomer = customerButtons[1];

      // First should be Hotel Alpha (score 25), second Hotel Beta (score 45)
      expect(firstCustomer).toHaveTextContent('Hotel Alpha');
      expect(secondCustomer).toHaveTextContent('Hotel Beta');
    });
  });

  describe('maxDisplay prop', () => {
    it('limits displayed customers to maxDisplay', () => {
      renderWithRouter(
        <AtRiskCustomersWidget customers={mockCustomers} maxDisplay={2} />
      );

      // Should show only 2 at-risk customers (account owner appears in visible text and screen reader text)
      expect(screen.getAllByText(/Hotel Alpha/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Hotel Beta/).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Hotel Gamma/)).not.toBeInTheDocument();
    });

    it('shows "view all" link when more customers than maxDisplay', () => {
      renderWithRouter(
        <AtRiskCustomersWidget customers={mockCustomers} maxDisplay={2} />
      );

      expect(screen.getByText(/View all 3 at-risk customers/)).toBeInTheDocument();
    });

    it('does not show "view all" link when all customers displayed', () => {
      renderWithRouter(
        <AtRiskCustomersWidget customers={mockCustomers} maxDisplay={10} />
      );

      expect(screen.queryByText(/View all/)).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('renders as buttons when onCustomerClick is provided', () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <AtRiskCustomersWidget
          customers={mockCustomers}
          onCustomerClick={handleClick}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // 3 at-risk customers
    });

    it('calls onCustomerClick with customer ID when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderWithRouter(
        <AtRiskCustomersWidget
          customers={mockCustomers}
          onCustomerClick={handleClick}
        />
      );

      const firstButton = screen.getAllByRole('button')[0];
      await user.click(firstButton);

      expect(handleClick).toHaveBeenCalledWith('1');
    });

    it('has accessible labels for clickable rows', () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <AtRiskCustomersWidget
          customers={mockCustomers}
          onCustomerClick={handleClick}
        />
      );

      const firstButton = screen.getAllByRole('button')[0];
      expect(firstButton).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Hotel Alpha')
      );
      expect(firstButton).toHaveAttribute(
        'aria-label',
        expect.stringContaining('25')
      );
    });
  });

  describe('accessibility', () => {
    it('renders accessible summary for screen readers', () => {
      renderWithRouter(<AtRiskCustomersWidget customers={mockCustomers} />);

      const srContent = screen.getByRole('status');
      expect(srContent).toHaveClass('sr-only');
      expect(srContent).toHaveTextContent('3 customers need attention');
    });
  });
});
