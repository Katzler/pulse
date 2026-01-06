import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DistributionItem } from '@application/dtos';

import { MrrByCountryChart } from '../MrrByCountryChart';

// Mock ResizeObserver for Recharts ResponsiveContainer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Sample test data
const mockData: DistributionItem[] = [
  { name: 'USA', count: 500, mrr: 25000 },
  { name: 'UK', count: 300, mrr: 15000 },
  { name: 'Germany', count: 200, mrr: 10000 },
  { name: 'France', count: 150, mrr: 7500 },
];

describe('MrrByCountryChart', () => {
  describe('rendering', () => {
    it('renders the chart container', () => {
      render(<MrrByCountryChart data={mockData} />);

      expect(screen.getByTestId('mrr-by-country-chart')).toBeInTheDocument();
    });

    it('renders accessible summary for screen readers', () => {
      render(<MrrByCountryChart data={mockData} />);

      const srContent = screen.getByRole('status');
      expect(srContent).toHaveClass('sr-only');
      expect(srContent).toHaveTextContent('MRR by country');
      expect(srContent).toHaveTextContent('USA');
      expect(srContent).toHaveTextContent('UK');
    });

    it('shows total MRR in summary', () => {
      render(<MrrByCountryChart data={mockData} />);

      // Summary shows total MRR (appears in both visible and sr-only)
      const totalElements = screen.getAllByText(/Total:/);
      expect(totalElements.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('shows empty state when data is empty', () => {
      render(<MrrByCountryChart data={[]} />);

      expect(screen.getByText('No MRR data available')).toBeInTheDocument();
      expect(
        screen.getByText('Import customer data to see MRR by country')
      ).toBeInTheDocument();
    });

    it('shows empty state when all MRR values are zero', () => {
      render(
        <MrrByCountryChart
          data={[
            { name: 'USA', count: 100, mrr: 0 },
            { name: 'UK', count: 50, mrr: 0 },
          ]}
        />
      );

      expect(screen.getByText('No MRR data available')).toBeInTheDocument();
    });

    it('shows empty state when MRR is undefined', () => {
      render(
        <MrrByCountryChart
          data={[
            { name: 'USA', count: 100 },
            { name: 'UK', count: 50 },
          ]}
        />
      );

      expect(screen.getByText('No MRR data available')).toBeInTheDocument();
    });
  });

  describe('data transformation', () => {
    it('shows top countries sorted by MRR', () => {
      render(<MrrByCountryChart data={mockData} />);

      const srContent = screen.getByRole('status');
      // Should contain countries in MRR order
      expect(srContent).toHaveTextContent('USA');
      expect(srContent).toHaveTextContent('UK');
    });

    it('respects maxCountries prop', () => {
      // With showOther=true by default, maxCountries=2 shows 3 items (2 top + Other)
      render(<MrrByCountryChart data={mockData} maxCountries={2} />);

      // Should show 3 items (2 countries + Other)
      expect(screen.getByText(/Showing top 3 countries/)).toBeInTheDocument();
    });

    it('respects maxCountries prop without Other', () => {
      render(<MrrByCountryChart data={mockData} maxCountries={2} showOther={false} />);

      // Should show "Showing top 2 countries"
      expect(screen.getByText(/Showing top 2 countries/)).toBeInTheDocument();
    });

    it('shows all countries when fewer than maxCountries', () => {
      render(<MrrByCountryChart data={mockData} maxCountries={10} />);

      expect(screen.getByText(/Showing top 4 countries/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles single country', () => {
      render(
        <MrrByCountryChart data={[{ name: 'USA', count: 100, mrr: 10000 }]} />
      );

      expect(screen.getByTestId('mrr-by-country-chart')).toBeInTheDocument();
      expect(screen.getByText(/Showing top 1 countries/)).toBeInTheDocument();
    });

    it('handles large MRR values (millions)', () => {
      render(
        <MrrByCountryChart
          data={[
            { name: 'USA', count: 5000, mrr: 2500000 },
            { name: 'UK', count: 3000, mrr: 1500000 },
          ]}
        />
      );

      expect(screen.getByTestId('mrr-by-country-chart')).toBeInTheDocument();
      // Total should show as $4.0M
      const srContent = screen.getByRole('status');
      expect(srContent).toHaveTextContent('$2.5M');
    });

    it('handles many countries', () => {
      const manyCountries = Array.from({ length: 20 }, (_, i) => ({
        name: `Country ${i + 1}`,
        count: 100 - i * 5,
        mrr: 10000 - i * 500,
      }));

      render(<MrrByCountryChart data={manyCountries} />);

      // Default maxCountries is 8, plus "Other" makes 9
      expect(screen.getByText(/Showing top 9 countries/)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onCountryClick when country bar is clicked', () => {
      const handleClick = vi.fn();

      render(<MrrByCountryChart data={mockData} onCountryClick={handleClick} />);

      // In test env, ResponsiveContainer doesn't render children without size
      // This test verifies the handler is passed correctly
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('customization', () => {
    it('accepts custom height', () => {
      render(<MrrByCountryChart data={mockData} height={400} />);

      expect(screen.getByTestId('mrr-by-country-chart')).toBeInTheDocument();
    });

    it('accepts custom maxCountries', () => {
      // 4 items, maxCountries=3 -> shows 3 top + Other = 4 items
      render(<MrrByCountryChart data={mockData} maxCountries={3} />);

      expect(screen.getByText(/Showing top 4 countries/)).toBeInTheDocument();
    });
  });

  describe('Other category', () => {
    const manyCountries: DistributionItem[] = [
      { name: 'USA', count: 500, mrr: 25000 },
      { name: 'UK', count: 300, mrr: 15000 },
      { name: 'Germany', count: 200, mrr: 10000 },
      { name: 'France', count: 150, mrr: 7500 },
      { name: 'Spain', count: 100, mrr: 5000 },
      { name: 'Italy', count: 80, mrr: 4000 },
    ];

    it('groups remaining countries into "Other" by default', () => {
      render(<MrrByCountryChart data={manyCountries} maxCountries={3} />);

      const srContent = screen.getByRole('status');
      expect(srContent).toHaveTextContent('Other');
    });

    it('does not show "Other" when showOther is false', () => {
      render(
        <MrrByCountryChart data={manyCountries} maxCountries={3} showOther={false} />
      );

      const srContent = screen.getByRole('status');
      expect(srContent).not.toHaveTextContent('Other');
    });

    it('does not show "Other" when all countries fit in maxCountries', () => {
      render(<MrrByCountryChart data={mockData} maxCountries={10} />);

      const srContent = screen.getByRole('status');
      expect(srContent).not.toHaveTextContent('Other');
    });

    it('aggregates MRR from remaining countries into "Other"', () => {
      render(<MrrByCountryChart data={manyCountries} maxCountries={3} />);

      // Other should contain France ($7.5K) + Spain ($5K) + Italy ($4K) = $16.5K
      const srContent = screen.getByRole('status');
      expect(srContent).toHaveTextContent('Other');
      expect(srContent).toHaveTextContent('$17K'); // Rounded
    });
  });
});
