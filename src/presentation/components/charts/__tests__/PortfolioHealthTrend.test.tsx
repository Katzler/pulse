import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { HealthDistributionDTO } from '@application/dtos';

import { PortfolioHealthTrend } from '../PortfolioHealthTrend';

// Sample test data
const mockHealth: HealthDistributionDTO = {
  healthy: 700,
  atRisk: 200,
  critical: 100,
};

describe('PortfolioHealthTrend', () => {
  describe('rendering', () => {
    it('renders the component container', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      expect(screen.getByTestId('portfolio-health-trend')).toBeInTheDocument();
    });

    it('displays average health score', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={72}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText('72')).toBeInTheDocument();
    });

    it('shows health status labels', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText(/Healthy \(70-100\)/)).toBeInTheDocument();
      expect(screen.getByText(/At Risk \(30-69\)/)).toBeInTheDocument();
      expect(screen.getByText(/Critical \(0-29\)/)).toBeInTheDocument();
    });

    it('displays customer counts', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      // Customer counts appear in both visible bars and sr-only summary
      expect(screen.getAllByText(/700/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/200/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/100/).length).toBeGreaterThan(0);
    });

    it('displays percentages', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      // Percentages appear in both visible bars and sr-only summary
      expect(screen.getAllByText(/70\.0%/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/20\.0%/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/10\.0%/).length).toBeGreaterThan(0);
    });
  });

  describe('health status indication', () => {
    it('shows "Healthy" for score >= 70', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={75}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('shows "At Risk" for score 30-69', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={50}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });

    it('shows "Critical" for score < 30', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={20}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders accessible summary for screen readers', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      const srContent = screen.getByRole('status');
      expect(srContent).toHaveClass('sr-only');
      expect(srContent).toHaveTextContent('Portfolio health overview');
      expect(srContent).toHaveTextContent('700 healthy');
      expect(srContent).toHaveTextContent('200 at-risk');
      expect(srContent).toHaveTextContent('100 critical');
    });
  });

  describe('edge cases', () => {
    it('handles zero customers', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={{ healthy: 0, atRisk: 0, critical: 0 }}
          averageHealthScore={0}
          totalCustomers={0}
        />
      );

      expect(screen.getByTestId('portfolio-health-trend')).toBeInTheDocument();
    });

    it('handles all healthy customers', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={{ healthy: 1000, atRisk: 0, critical: 0 }}
          averageHealthScore={85}
          totalCustomers={1000}
        />
      );

      // 100% appears in multiple places (visible bar and sr-only)
      expect(screen.getAllByText(/100\.0%/).length).toBeGreaterThan(0);
    });

    it('handles decimal average score', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={72.6}
          totalCustomers={1000}
        />
      );

      // Should round to 73
      expect(screen.getByText('73')).toBeInTheDocument();
    });
  });

  describe('trend info', () => {
    it('shows message about trend availability', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      expect(
        screen.getByText(/Health trends will be available/)
      ).toBeInTheDocument();
    });
  });

  describe('onViewAtRisk callback', () => {
    it('shows "View customers" button when onViewAtRisk is provided and there are at-risk customers', () => {
      const handleViewAtRisk = vi.fn();
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
          onViewAtRisk={handleViewAtRisk}
        />
      );

      expect(
        screen.getByText(/View 300 customers needing attention/)
      ).toBeInTheDocument();
    });

    it('calls onViewAtRisk when button is clicked', async () => {
      const user = userEvent.setup();
      const handleViewAtRisk = vi.fn();
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
          onViewAtRisk={handleViewAtRisk}
        />
      );

      await user.click(screen.getByText(/View 300 customers needing attention/));
      expect(handleViewAtRisk).toHaveBeenCalledTimes(1);
    });

    it('shows text instead of button when onViewAtRisk is not provided', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={mockHealth}
          averageHealthScore={65}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText(/300 customers need attention/)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows "All customers are healthy" when no at-risk or critical customers', () => {
      render(
        <PortfolioHealthTrend
          currentHealth={{ healthy: 1000, atRisk: 0, critical: 0 }}
          averageHealthScore={85}
          totalCustomers={1000}
        />
      );

      expect(screen.getByText('All customers are healthy!')).toBeInTheDocument();
    });
  });
});
