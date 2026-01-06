import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  DollarIcon,
  HeartPulseIcon,
  MetricCard,
  UsersIcon,
} from '../MetricCard';

describe('MetricCard', () => {
  describe('basic rendering', () => {
    it('renders title and value', () => {
      render(<MetricCard title="Total Customers" value={1234} />);

      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('formats number values with locale separators', () => {
      render(<MetricCard title="Large Number" value={1234567} />);

      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('renders string values as-is', () => {
      render(<MetricCard title="MRR" value="$45,678" />);

      expect(screen.getByText('$45,678')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<MetricCard title="Score" value={72} subtitle="Out of 100" />);

      expect(screen.getByText('Out of 100')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      const { container } = render(
        <MetricCard title="Customers" value={100} icon={<UsersIcon />} />
      );

      // Icon is wrapped in a div, check for SVG presence
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('shows upward trend with positive styling', () => {
      render(
        <MetricCard
          title="Active"
          value={500}
          trend={{ direction: 'up', value: '5%', isPositive: true }}
        />
      );

      expect(screen.getByText('5%')).toBeInTheDocument();
      expect(screen.getByText('from last import')).toBeInTheDocument();
    });

    it('shows downward trend with negative styling', () => {
      render(
        <MetricCard
          title="At Risk"
          value={50}
          trend={{ direction: 'down', value: '3', isPositive: true }}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows neutral trend', () => {
      render(
        <MetricCard
          title="Unchanged"
          value={100}
          trend={{ direction: 'neutral', value: '0%', isPositive: true }}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('applies positive color for positive trend', () => {
      render(
        <MetricCard
          title="Active"
          value={500}
          trend={{ direction: 'up', value: '5%', isPositive: true }}
        />
      );

      const trendText = screen.getByText('5%').parentElement;
      expect(trendText).toHaveClass('text-green-600');
    });

    it('applies negative color for negative trend', () => {
      render(
        <MetricCard
          title="At Risk"
          value={50}
          trend={{ direction: 'up', value: '10', isPositive: false }}
        />
      );

      const trendText = screen.getByText('10').parentElement;
      expect(trendText).toHaveClass('text-red-600');
    });
  });

  describe('color themes', () => {
    it('applies blue theme', () => {
      const { container } = render(
        <MetricCard title="Blue" value={100} color="blue" />
      );

      expect(container.querySelector('.border-l-blue-500')).toBeInTheDocument();
    });

    it('applies green theme', () => {
      const { container } = render(
        <MetricCard title="Green" value={100} color="green" />
      );

      expect(container.querySelector('.border-l-green-500')).toBeInTheDocument();
    });

    it('applies orange theme', () => {
      const { container } = render(
        <MetricCard title="Orange" value={100} color="orange" />
      );

      expect(container.querySelector('.border-l-orange-500')).toBeInTheDocument();
    });

    it('applies purple theme', () => {
      const { container } = render(
        <MetricCard title="Purple" value={100} color="purple" />
      );

      expect(container.querySelector('.border-l-purple-500')).toBeInTheDocument();
    });

    it('applies red theme', () => {
      const { container } = render(
        <MetricCard title="Red" value={100} color="red" />
      );

      expect(container.querySelector('.border-l-red-500')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('renders standard size by default', () => {
      render(<MetricCard title="Standard" value={100} />);

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('text-2xl');
    });

    it('renders large size when specified', () => {
      render(<MetricCard title="Large" value={100} size="large" />);

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('text-4xl');
    });
  });

  describe('click interaction', () => {
    it('renders as button when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<MetricCard title="Clickable" value={100} onClick={handleClick} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<MetricCard title="Clickable" value={100} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has accessible label for clickable cards', () => {
      const handleClick = vi.fn();
      render(
        <MetricCard
          title="Total Customers"
          value={1234}
          trend={{ direction: 'up', value: '5%', isPositive: true }}
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Total Customers'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('1234'));
    });

    it('does not render as button when onClick is not provided', () => {
      render(<MetricCard title="Static" value={100} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('data-testid', () => {
    it('passes data-testid to card', () => {
      render(<MetricCard title="Test" value={100} data-testid="my-metric" />);

      expect(screen.getByTestId('my-metric')).toBeInTheDocument();
    });
  });
});

describe('Metric Icons', () => {
  it('renders UsersIcon', () => {
    const { container } = render(<UsersIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders CheckCircleIcon', () => {
    const { container } = render(<CheckCircleIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders AlertTriangleIcon', () => {
    const { container } = render(<AlertTriangleIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders DollarIcon', () => {
    const { container } = render(<DollarIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders HeartPulseIcon', () => {
    const { container } = render(<HeartPulseIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<UsersIcon className="custom-class" />);
    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });
});
