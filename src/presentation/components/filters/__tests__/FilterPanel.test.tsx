import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type FilterOptions, FilterPanel, type FilterState } from '../FilterPanel';

const mockOptions: FilterOptions = {
  countries: ['USA', 'UK', 'Germany', 'France'],
  languages: ['English', 'German', 'French', 'Spanish'],
  channels: ['Website', 'Mobile App', 'API', 'Email'],
};

describe('FilterPanel', () => {
  const defaultProps = {
    filters: {} as FilterState,
    onChange: vi.fn(),
    availableOptions: mockOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the filter panel container', () => {
      render(<FilterPanel {...defaultProps} />);

      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    it('renders panel header', () => {
      render(<FilterPanel {...defaultProps} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders status filter options', () => {
      render(<FilterPanel {...defaultProps} />);

      // Multiple "All" options exist for different filter groups
      expect(screen.getAllByLabelText('All').length).toBe(3);
      expect(screen.getByLabelText('Active')).toBeInTheDocument();
      expect(screen.getByLabelText('Inactive')).toBeInTheDocument();
    });

    it('renders account type filter options', () => {
      render(<FilterPanel {...defaultProps} />);

      expect(screen.getByLabelText('Pro')).toBeInTheDocument();
      expect(screen.getByLabelText('Starter')).toBeInTheDocument();
    });

    it('renders health classification options', () => {
      render(<FilterPanel {...defaultProps} />);

      expect(screen.getByLabelText('Healthy')).toBeInTheDocument();
      expect(screen.getByLabelText('At Risk')).toBeInTheDocument();
      expect(screen.getByLabelText('Critical')).toBeInTheDocument();
    });

    it('renders dropdown filters', () => {
      render(<FilterPanel {...defaultProps} />);

      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByText('Languages')).toBeInTheDocument();
      expect(screen.getByText('Channels')).toBeInTheDocument();
    });
  });

  describe('radio button filters', () => {
    it('calls onChange when status filter changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FilterPanel {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByLabelText('Active'));

      expect(onChange).toHaveBeenCalledWith({ status: 'active' });
    });

    it('calls onChange when account type changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FilterPanel {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByLabelText('Pro'));

      expect(onChange).toHaveBeenCalledWith({ accountType: 'pro' });
    });

    it('calls onChange when health classification changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FilterPanel {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByLabelText('At Risk'));

      expect(onChange).toHaveBeenCalledWith({ healthClassification: 'at-risk' });
    });

    it('clears filter when "All" is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ status: 'active' }}
          onChange={onChange}
        />
      );

      // Find the "All" radio in status group
      const allRadios = screen.getAllByLabelText('All');
      await user.click(allRadios[0]); // First "All" is in Status group

      expect(onChange).toHaveBeenCalledWith({ status: undefined });
    });

    it('shows current filter state', () => {
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ status: 'active', accountType: 'pro' }}
        />
      );

      expect(screen.getByLabelText('Active')).toBeChecked();
      expect(screen.getByLabelText('Pro')).toBeChecked();
    });
  });

  describe('country dropdown', () => {
    it('calls onChange when country is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FilterPanel {...defaultProps} onChange={onChange} />);

      const countrySelect = screen.getByRole('combobox');
      await user.selectOptions(countrySelect, 'USA');

      expect(onChange).toHaveBeenCalledWith({ country: 'USA' });
    });

    it('shows current country selection', () => {
      render(<FilterPanel {...defaultProps} filters={{ country: 'Germany' }} />);

      const countrySelect = screen.getByRole('combobox');
      expect(countrySelect).toHaveValue('Germany');
    });

    it('displays all country options', () => {
      render(<FilterPanel {...defaultProps} />);

      const countrySelect = screen.getByRole('combobox');
      expect(countrySelect).toContainElement(screen.getByText('USA'));
      expect(countrySelect).toContainElement(screen.getByText('UK'));
    });
  });

  describe('multi-select dropdowns', () => {
    it('opens language dropdown on click', async () => {
      const user = userEvent.setup();
      render(<FilterPanel {...defaultProps} />);

      const languageButton = screen.getByRole('button', { name: /all languages/i });
      await user.click(languageButton);

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('German')).toBeInTheDocument();
    });

    it('selects multiple languages', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FilterPanel {...defaultProps} onChange={onChange} />);

      const languageButton = screen.getByRole('button', { name: /all languages/i });
      await user.click(languageButton);

      await user.click(screen.getByLabelText('English'));

      expect(onChange).toHaveBeenCalledWith({ languages: ['English'] });
    });

    it('shows selected count for multi-select', () => {
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ languages: ['English', 'German'] }}
        />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('opens channels dropdown and selects items', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FilterPanel {...defaultProps} onChange={onChange} />);

      const channelsButton = screen.getByRole('button', { name: /all channels/i });
      await user.click(channelsButton);

      await user.click(screen.getByLabelText('Website'));

      expect(onChange).toHaveBeenCalledWith({ channels: ['Website'] });
    });
  });

  describe('clear filters', () => {
    it('shows clear all button when filters are active', () => {
      render(<FilterPanel {...defaultProps} filters={{ status: 'active' }} />);

      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    it('does not show clear all when no filters', () => {
      render(<FilterPanel {...defaultProps} filters={{}} />);

      expect(screen.queryByText('Clear All Filters')).not.toBeInTheDocument();
    });

    it('clears all filters when clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ status: 'active', accountType: 'pro', country: 'USA' }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Clear All Filters'));

      expect(onChange).toHaveBeenCalledWith({});
    });
  });

  describe('collapse/expand', () => {
    it('shows collapse button when onToggleCollapse provided', () => {
      render(
        <FilterPanel {...defaultProps} onToggleCollapse={vi.fn()} />
      );

      expect(screen.getByText('Collapse')).toBeInTheDocument();
    });

    it('calls onToggleCollapse when clicked', async () => {
      const user = userEvent.setup();
      const onToggleCollapse = vi.fn();
      render(
        <FilterPanel {...defaultProps} onToggleCollapse={onToggleCollapse} />
      );

      await user.click(screen.getByText('Collapse'));

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it('shows expand text when collapsed', () => {
      render(
        <FilterPanel
          {...defaultProps}
          isCollapsed
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByText('Expand')).toBeInTheDocument();
    });

    it('hides filter content when collapsed', () => {
      render(
        <FilterPanel
          {...defaultProps}
          isCollapsed
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.queryByLabelText('Active')).not.toBeInTheDocument();
    });

    it('shows filter content when expanded', () => {
      render(
        <FilterPanel
          {...defaultProps}
          isCollapsed={false}
          onToggleCollapse={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Active')).toBeInTheDocument();
    });
  });

  describe('filter count badge', () => {
    it('shows count badge with active filters', () => {
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ status: 'active', accountType: 'pro' }}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('counts multi-select as one filter', () => {
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ languages: ['English', 'German'] }}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('does not show badge when no filters', () => {
      render(<FilterPanel {...defaultProps} filters={{}} />);

      // Find elements that might be the badge (small numbers in colored backgrounds)
      const badge = screen.queryByText('0');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('multiple filters', () => {
    it('preserves existing filters when changing one', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ status: 'active' }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByLabelText('Pro'));

      expect(onChange).toHaveBeenCalledWith({
        status: 'active',
        accountType: 'pro',
      });
    });
  });

  describe('accessibility', () => {
    it('has accessible status region', () => {
      render(<FilterPanel {...defaultProps} filters={{ status: 'active' }} />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('1 filter applied');
    });

    it('shows plural for multiple filters', () => {
      render(
        <FilterPanel
          {...defaultProps}
          filters={{ status: 'active', accountType: 'pro' }}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('2 filters applied');
    });

    it('shows no filters message when empty', () => {
      render(<FilterPanel {...defaultProps} filters={{}} />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('No filters applied');
    });

    it('radio groups have accessible fieldsets', () => {
      render(<FilterPanel {...defaultProps} />);

      expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Account Type' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Health' })).toBeInTheDocument();
    });
  });
});
