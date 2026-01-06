import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type ActiveFilter,ActiveFilters } from '../ActiveFilters';

describe('ActiveFilters', () => {
  const mockFilters: ActiveFilter[] = [
    { key: 'status', label: 'Status', value: 'Active' },
    { key: 'accountType', label: 'Account Type', value: 'Pro' },
  ];

  const defaultProps = {
    filters: mockFilters,
    onRemove: vi.fn(),
    onClearAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the container when filters exist', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByTestId('active-filters')).toBeInTheDocument();
    });

    it('returns null when no filters', () => {
      const { container } = render(
        <ActiveFilters {...defaultProps} filters={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('displays "Active filters" label', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
    });

    it('renders all filter tags', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByTestId('filter-tag-status')).toBeInTheDocument();
      expect(screen.getByTestId('filter-tag-accountType')).toBeInTheDocument();
    });

    it('displays filter label and value', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Account Type:')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('renders Clear All button', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Clear All' })).toBeInTheDocument();
    });
  });

  describe('single filter', () => {
    it('displays single filter correctly', () => {
      render(
        <ActiveFilters
          {...defaultProps}
          filters={[{ key: 'status', label: 'Status', value: 'Inactive' }]}
        />
      );

      expect(screen.getByTestId('filter-tag-status')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('removing filters', () => {
    it('calls onRemove when filter remove button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<ActiveFilters {...defaultProps} onRemove={onRemove} />);

      const removeButton = screen.getByLabelText('Remove Status filter');
      await user.click(removeButton);

      expect(onRemove).toHaveBeenCalledWith('status');
    });

    it('calls onRemove with correct key for each filter', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<ActiveFilters {...defaultProps} onRemove={onRemove} />);

      const removeAccountType = screen.getByLabelText('Remove Account Type filter');
      await user.click(removeAccountType);

      expect(onRemove).toHaveBeenCalledWith('accountType');
    });

    it('calls onClearAll when Clear All is clicked', async () => {
      const user = userEvent.setup();
      const onClearAll = vi.fn();
      render(<ActiveFilters {...defaultProps} onClearAll={onClearAll} />);

      const clearAllButton = screen.getByRole('button', { name: 'Clear All' });
      await user.click(clearAllButton);

      expect(onClearAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has region role with label', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByRole('region', { name: 'Active filters' })).toBeInTheDocument();
    });

    it('provides screen reader filter count', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByRole('status')).toHaveTextContent('2 filters applied');
    });

    it('shows singular form for single filter', () => {
      render(
        <ActiveFilters
          {...defaultProps}
          filters={[{ key: 'status', label: 'Status', value: 'Active' }]}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('1 filter applied');
    });

    it('remove buttons have descriptive labels', () => {
      render(<ActiveFilters {...defaultProps} />);

      expect(screen.getByLabelText('Remove Status filter')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Account Type filter')).toBeInTheDocument();
    });

    it('remove buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(<ActiveFilters {...defaultProps} onRemove={onRemove} />);

      const removeButton = screen.getByLabelText('Remove Status filter');
      removeButton.focus();
      await user.keyboard('{Enter}');

      expect(onRemove).toHaveBeenCalledWith('status');
    });
  });
});
