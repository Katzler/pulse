import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type CustomerFilterState,CustomerSearch } from '../CustomerSearch';

describe('CustomerSearch', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchTermChange: vi.fn(),
    onSearch: vi.fn(),
    filters: {} as CustomerFilterState,
    onFilterRemove: vi.fn(),
    onFiltersClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the search container', () => {
      render(<CustomerSearch {...defaultProps} />);

      expect(screen.getByTestId('customer-search')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<CustomerSearch {...defaultProps} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders filters button when onOpenFilters provided', () => {
      render(<CustomerSearch {...defaultProps} onOpenFilters={vi.fn()} />);

      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('does not render filters button when onOpenFilters not provided', () => {
      render(<CustomerSearch {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /filters/i })).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('displays current search term', () => {
      render(<CustomerSearch {...defaultProps} searchTerm="test search" />);

      expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
    });

    it('calls onSearchTermChange when typing', async () => {
      const user = userEvent.setup();
      const onSearchTermChange = vi.fn();
      render(
        <CustomerSearch {...defaultProps} onSearchTermChange={onSearchTermChange} />
      );

      const input = screen.getByLabelText('Search customers');
      await user.type(input, 'a');

      expect(onSearchTermChange).toHaveBeenCalledWith('a');
    });

    it('calls onSearch when Enter pressed', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<CustomerSearch {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByLabelText('Search customers');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('calls onSearch with current value when search button clicked', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<CustomerSearch {...defaultProps} onSearch={onSearch} searchTerm="test" />);

      // Use exact name to avoid matching "Clear search" button
      const searchButton = screen.getByRole('button', { name: 'Search' });
      await user.click(searchButton);

      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('clears search and calls onSearch on clear', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      const onSearchTermChange = vi.fn();
      render(
        <CustomerSearch
          {...defaultProps}
          searchTerm="test"
          onSearch={onSearch}
          onSearchTermChange={onSearchTermChange}
        />
      );

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(onSearchTermChange).toHaveBeenCalledWith('');
      expect(onSearch).toHaveBeenCalledWith('');
    });
  });

  describe('debounce', () => {
    it('debounces search when enabled', async () => {
      const onSearch = vi.fn();
      render(
        <CustomerSearch
          {...defaultProps}
          onSearch={onSearch}
          enableDebounce
          debounceMs={50}
        />
      );

      const input = screen.getByLabelText('Search customers');
      // Type directly without userEvent to avoid timer issues
      input.focus();
      await userEvent.type(input, 'test', { delay: null });

      // Should eventually call onSearch after debounce
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('calls search immediately on Enter even with debounce', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(
        <CustomerSearch
          {...defaultProps}
          onSearch={onSearch}
          enableDebounce
          debounceMs={500}
        />
      );

      const input = screen.getByLabelText('Search customers');
      await user.click(input);
      await user.keyboard('{Enter}');

      // Enter should trigger immediate search
      expect(onSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('active filters', () => {
    it('displays active filters when present', () => {
      const filters: CustomerFilterState = {
        status: 'Active Customer',
        accountType: 'Pro',
      };
      render(<CustomerSearch {...defaultProps} filters={filters} />);

      expect(screen.getByTestId('active-filters')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Active Customer')).toBeInTheDocument();
    });

    it('does not show active filters when empty', () => {
      render(<CustomerSearch {...defaultProps} filters={{}} />);

      expect(screen.queryByTestId('active-filters')).not.toBeInTheDocument();
    });

    it('calls onFilterRemove when filter removed', async () => {
      const user = userEvent.setup();
      const onFilterRemove = vi.fn();
      const filters: CustomerFilterState = { status: 'Active' };
      render(
        <CustomerSearch
          {...defaultProps}
          filters={filters}
          onFilterRemove={onFilterRemove}
        />
      );

      const removeButton = screen.getByLabelText('Remove Status filter');
      await user.click(removeButton);

      expect(onFilterRemove).toHaveBeenCalledWith('status');
    });

    it('calls onFiltersClear when Clear All clicked', async () => {
      const user = userEvent.setup();
      const onFiltersClear = vi.fn();
      const filters: CustomerFilterState = { status: 'Active' };
      render(
        <CustomerSearch
          {...defaultProps}
          filters={filters}
          onFiltersClear={onFiltersClear}
        />
      );

      const clearAllButton = screen.getByRole('button', { name: 'Clear All' });
      await user.click(clearAllButton);

      expect(onFiltersClear).toHaveBeenCalledTimes(1);
    });

    it('transforms healthClassification to readable labels', () => {
      const filters: CustomerFilterState = { healthClassification: 'at-risk' };
      render(<CustomerSearch {...defaultProps} filters={filters} />);

      expect(screen.getByText('Health:')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });
  });

  describe('filters button', () => {
    it('calls onOpenFilters when clicked', async () => {
      const user = userEvent.setup();
      const onOpenFilters = vi.fn();
      render(<CustomerSearch {...defaultProps} onOpenFilters={onOpenFilters} />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      expect(onOpenFilters).toHaveBeenCalledTimes(1);
    });

    it('shows filter count badge when filters active', () => {
      const filters: CustomerFilterState = {
        status: 'Active',
        accountType: 'Pro',
      };
      render(
        <CustomerSearch
          {...defaultProps}
          filters={filters}
          onOpenFilters={vi.fn()}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show count badge when no filters', () => {
      render(<CustomerSearch {...defaultProps} onOpenFilters={vi.fn()} />);

      // The only number should be in results count if present
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('result count', () => {
    it('displays result count when provided', () => {
      render(<CustomerSearch {...defaultProps} resultCount={42} />);

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText(/customer/)).toBeInTheDocument();
    });

    it('shows singular customer when count is 1', () => {
      render(<CustomerSearch {...defaultProps} resultCount={1} />);

      expect(screen.getByText(/1/)).toBeInTheDocument();
      expect(screen.getByText(/customer(?!s)/)).toBeInTheDocument();
    });

    it('shows total count when different from result count', () => {
      render(<CustomerSearch {...defaultProps} resultCount={25} totalCount={100} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText(/of 100/)).toBeInTheDocument();
    });

    it('shows search term in results message', () => {
      render(
        <CustomerSearch {...defaultProps} searchTerm="hotel" resultCount={5} />
      );

      // The search term appears in the results text
      expect(screen.getByText('hotel')).toBeInTheDocument();
    });

    it('shows loading message when searching', () => {
      render(<CustomerSearch {...defaultProps} resultCount={0} isLoading />);

      // Multiple elements may show Searching... in loading state
      const searchingElements = screen.getAllByText('Searching...');
      expect(searchingElements.length).toBeGreaterThan(0);
    });
  });

  describe('loading state', () => {
    it('passes loading state to search input', () => {
      render(<CustomerSearch {...defaultProps} isLoading />);

      expect(screen.getByLabelText('Search customers')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has live region for result updates', () => {
      render(<CustomerSearch {...defaultProps} resultCount={10} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });
});
