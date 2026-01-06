import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FilterPresets } from '../FilterPresets';
import { type FilterPreset, systemPresets } from '../presets';

describe('FilterPresets', () => {
  const defaultProps = {
    currentFilters: {},
    onApplyPreset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the presets container', () => {
      render(<FilterPresets {...defaultProps} />);

      expect(screen.getByTestId('filter-presets')).toBeInTheDocument();
    });

    it('renders Quick Filters heading', () => {
      render(<FilterPresets {...defaultProps} />);

      expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    });

    it('renders all system presets', () => {
      render(<FilterPresets {...defaultProps} />);

      systemPresets.forEach((preset) => {
        expect(screen.getByTestId(`preset-${preset.id}`)).toBeInTheDocument();
      });
    });

    it('displays preset names', () => {
      render(<FilterPresets {...defaultProps} />);

      expect(screen.getByText('Critical Customers')).toBeInTheDocument();
      expect(screen.getByText('At-Risk Customers')).toBeInTheDocument();
      expect(screen.getByText('Healthy Customers')).toBeInTheDocument();
      expect(screen.getByText('Active Pro')).toBeInTheDocument();
      expect(screen.getByText('Inactive Customers')).toBeInTheDocument();
    });

    it('displays preset descriptions', () => {
      render(<FilterPresets {...defaultProps} />);

      expect(screen.getByText('Customers with health score below 30')).toBeInTheDocument();
      expect(screen.getByText('Customers with health score 30-69')).toBeInTheDocument();
    });
  });

  describe('applying presets', () => {
    it('calls onApplyPreset when preset is clicked', async () => {
      const user = userEvent.setup();
      const onApplyPreset = vi.fn();
      render(<FilterPresets {...defaultProps} onApplyPreset={onApplyPreset} />);

      await user.click(screen.getByText('Critical Customers'));

      expect(onApplyPreset).toHaveBeenCalledWith({ healthClassification: 'critical' });
    });

    it('calls onApplyPreset with correct filters for At-Risk preset', async () => {
      const user = userEvent.setup();
      const onApplyPreset = vi.fn();
      render(<FilterPresets {...defaultProps} onApplyPreset={onApplyPreset} />);

      await user.click(screen.getByText('At-Risk Customers'));

      expect(onApplyPreset).toHaveBeenCalledWith({ healthClassification: 'at-risk' });
    });

    it('calls onApplyPreset with multiple filters for Active Pro', async () => {
      const user = userEvent.setup();
      const onApplyPreset = vi.fn();
      render(<FilterPresets {...defaultProps} onApplyPreset={onApplyPreset} />);

      await user.click(screen.getByText('Active Pro'));

      expect(onApplyPreset).toHaveBeenCalledWith({ status: 'active', accountType: 'pro' });
    });
  });

  describe('active preset indication', () => {
    it('shows active state when filters match preset', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ healthClassification: 'critical' }}
        />
      );

      const criticalPreset = screen.getByTestId('preset-critical-customers');
      expect(criticalPreset).toHaveClass('bg-blue-50');
    });

    it('shows active state for multi-filter preset', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active', accountType: 'pro' }}
        />
      );

      const activeProPreset = screen.getByTestId('preset-active-pro');
      expect(activeProPreset).toHaveClass('bg-blue-50');
    });

    it('does not show active state when filters do not match', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ healthClassification: 'healthy' }}
        />
      );

      const criticalPreset = screen.getByTestId('preset-critical-customers');
      expect(criticalPreset).not.toHaveClass('bg-blue-50');
    });
  });

  describe('compact mode', () => {
    it('renders in compact mode', () => {
      render(<FilterPresets {...defaultProps} compact />);

      expect(screen.getByTestId('filter-presets')).toBeInTheDocument();
    });

    it('shows presets as chips in compact mode', () => {
      render(<FilterPresets {...defaultProps} compact />);

      const preset = screen.getByTestId('preset-critical-customers');
      expect(preset).toHaveClass('rounded-full');
    });

    it('does not show descriptions in compact mode', () => {
      render(<FilterPresets {...defaultProps} compact />);

      expect(
        screen.queryByText('Customers with health score below 30')
      ).not.toBeInTheDocument();
    });
  });

  describe('custom presets', () => {
    const customPreset: FilterPreset = {
      id: 'custom-1',
      name: 'My Custom Filter',
      description: 'A custom filter preset',
      filters: { status: 'active', country: 'USA' },
      icon: 'custom',
    };

    it('renders custom presets', () => {
      render(<FilterPresets {...defaultProps} customPresets={[customPreset]} />);

      expect(screen.getByText('My Custom Filter')).toBeInTheDocument();
    });

    it('shows delete button for custom presets when onDeletePreset provided', () => {
      render(
        <FilterPresets
          {...defaultProps}
          customPresets={[customPreset]}
          onDeletePreset={vi.fn()}
        />
      );

      expect(screen.getByTestId('delete-preset-custom-1')).toBeInTheDocument();
    });

    it('does not show delete button for system presets', () => {
      render(<FilterPresets {...defaultProps} onDeletePreset={vi.fn()} />);

      expect(
        screen.queryByTestId('delete-preset-critical-customers')
      ).not.toBeInTheDocument();
    });

    it('calls onDeletePreset when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDeletePreset = vi.fn();
      render(
        <FilterPresets
          {...defaultProps}
          customPresets={[customPreset]}
          onDeletePreset={onDeletePreset}
        />
      );

      await user.click(screen.getByTestId('delete-preset-custom-1'));

      expect(onDeletePreset).toHaveBeenCalledWith('custom-1');
    });
  });

  describe('save preset', () => {
    it('shows save preset button when onSavePreset provided and filters active', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active' }}
          onSavePreset={vi.fn()}
        />
      );

      expect(screen.getByTestId('save-preset-button')).toBeInTheDocument();
    });

    it('does not show save preset button when no filters active', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{}}
          onSavePreset={vi.fn()}
        />
      );

      expect(screen.queryByTestId('save-preset-button')).not.toBeInTheDocument();
    });

    it('opens save dialog when save button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active' }}
          onSavePreset={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('save-preset-button'));

      expect(screen.getByTestId('save-preset-dialog')).toBeInTheDocument();
    });

    it('shows preset name input in dialog', async () => {
      const user = userEvent.setup();
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active' }}
          onSavePreset={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('save-preset-button'));

      expect(screen.getByTestId('preset-name-input')).toBeInTheDocument();
    });

    it('calls onSavePreset with name and current filters', async () => {
      const user = userEvent.setup();
      const onSavePreset = vi.fn();
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active', country: 'Germany' }}
          onSavePreset={onSavePreset}
        />
      );

      await user.click(screen.getByTestId('save-preset-button'));
      await user.type(screen.getByTestId('preset-name-input'), 'Germany Active');
      await user.click(screen.getByTestId('confirm-save-preset'));

      expect(onSavePreset).toHaveBeenCalledWith({
        name: 'Germany Active',
        filters: { status: 'active', country: 'Germany' },
        icon: 'custom',
      });
    });

    it('closes dialog after saving', async () => {
      const user = userEvent.setup();
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active' }}
          onSavePreset={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('save-preset-button'));
      await user.type(screen.getByTestId('preset-name-input'), 'My Preset');
      await user.click(screen.getByTestId('confirm-save-preset'));

      expect(screen.queryByTestId('save-preset-dialog')).not.toBeInTheDocument();
    });

    it('closes dialog on cancel', async () => {
      const user = userEvent.setup();
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active' }}
          onSavePreset={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('save-preset-button'));
      await user.click(screen.getByTestId('cancel-save-preset'));

      expect(screen.queryByTestId('save-preset-dialog')).not.toBeInTheDocument();
    });

    it('disables save button when name is empty', async () => {
      const user = userEvent.setup();
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ status: 'active' }}
          onSavePreset={vi.fn()}
        />
      );

      await user.click(screen.getByTestId('save-preset-button'));

      expect(screen.getByTestId('confirm-save-preset')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has group role', () => {
      render(<FilterPresets {...defaultProps} />);

      expect(screen.getByRole('group', { name: /filter presets/i })).toBeInTheDocument();
    });

    it('has aria-pressed on preset buttons', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ healthClassification: 'critical' }}
        />
      );

      const preset = screen.getByTestId('preset-critical-customers');
      // The button inside the preset
      const button = preset.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('announces active preset to screen readers', () => {
      render(
        <FilterPresets
          {...defaultProps}
          currentFilters={{ healthClassification: 'critical' }}
        />
      );

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Active preset: Critical Customers');
    });

    it('announces no preset active', () => {
      render(<FilterPresets {...defaultProps} currentFilters={{}} />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('No preset active');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(<FilterPresets {...defaultProps} className="custom-presets" />);

      expect(screen.getByTestId('filter-presets')).toHaveClass('custom-presets');
    });
  });
});
