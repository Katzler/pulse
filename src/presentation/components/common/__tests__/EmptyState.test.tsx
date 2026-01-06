import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyDataIcon, EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No customers"
        description="Import a CSV file to get started"
      />
    );
    expect(screen.getByText('Import a CSV file to get started')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No data"
        icon={<EmptyDataIcon />}
      />
    );
    // Icon SVG should be present
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="No data"
        action={<button>Import Data</button>}
      />
    );
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(<EmptyState title="Empty" className="custom-class" />);
    expect(screen.getByText('Empty').parentElement).toHaveClass('custom-class');
  });
});

describe('EmptyDataIcon', () => {
  it('renders SVG icon', () => {
    render(<EmptyDataIcon />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('has aria-hidden for accessibility', () => {
    render(<EmptyDataIcon />);
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
