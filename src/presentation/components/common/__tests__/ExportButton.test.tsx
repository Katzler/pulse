import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportButton } from '../ExportButton';

describe('ExportButton', () => {
  const defaultProps = {
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the export button', () => {
      render(<ExportButton {...defaultProps} />);

      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('displays Export text', () => {
      render(<ExportButton {...defaultProps} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('shows record count when provided', () => {
      render(<ExportButton {...defaultProps} recordCount={42} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('does not show record count badge when recordCount is 0', () => {
      render(<ExportButton {...defaultProps} recordCount={0} />);

      // Only the Export text, no badge
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('does not show dropdown by default', () => {
      render(<ExportButton {...defaultProps} />);

      expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('dropdown behavior', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByTestId('export-dropdown')).toBeInTheDocument();
    });

    it('shows all export format options', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByTestId('export-option-csv')).toBeInTheDocument();
      expect(screen.getByTestId('export-option-json')).toBeInTheDocument();
      expect(screen.getByTestId('export-option-xlsx')).toBeInTheDocument();
    });

    it('shows format labels', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
    });

    it('shows format descriptions', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByText(/comma-separated values/i)).toBeInTheDocument();
      expect(screen.getByText(/javascript object notation/i)).toBeInTheDocument();
      expect(screen.getByText(/microsoft excel/i)).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ExportButton {...defaultProps} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await user.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-dropdown')).toBeInTheDocument();

      await user.click(screen.getByTestId('outside'));
      await waitFor(() => {
        expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-dropdown')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
    });

    it('toggles dropdown on repeated clicks', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));
      expect(screen.getByTestId('export-dropdown')).toBeInTheDocument();

      await user.click(screen.getByTestId('export-button'));
      expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('export selection', () => {
    it('calls onExport with csv format', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(<ExportButton {...defaultProps} onExport={onExport} />);

      await user.click(screen.getByTestId('export-button'));
      await user.click(screen.getByTestId('export-option-csv'));

      expect(onExport).toHaveBeenCalledWith('csv');
    });

    it('calls onExport with json format', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(<ExportButton {...defaultProps} onExport={onExport} />);

      await user.click(screen.getByTestId('export-button'));
      await user.click(screen.getByTestId('export-option-json'));

      expect(onExport).toHaveBeenCalledWith('json');
    });

    it('calls onExport with xlsx format', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(<ExportButton {...defaultProps} onExport={onExport} />);

      await user.click(screen.getByTestId('export-button'));
      await user.click(screen.getByTestId('export-option-xlsx'));

      expect(onExport).toHaveBeenCalledWith('xlsx');
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));
      await user.click(screen.getByTestId('export-option-csv'));

      expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading state when isExporting is true', () => {
      render(<ExportButton {...defaultProps} isExporting />);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('disables button when exporting', () => {
      render(<ExportButton {...defaultProps} isExporting />);

      expect(screen.getByTestId('export-button')).toBeDisabled();
    });

    it('does not open dropdown when exporting', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} isExporting />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<ExportButton {...defaultProps} disabled />);

      expect(screen.getByTestId('export-button')).toBeDisabled();
    });

    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} disabled />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.queryByTestId('export-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies primary variant styles', () => {
      render(<ExportButton {...defaultProps} variant="primary" />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('applies secondary variant styles by default', () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveClass('bg-white');
    });
  });

  describe('record count display in dropdown', () => {
    it('shows record count message in dropdown footer', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} recordCount={25} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByText('25 records will be exported')).toBeInTheDocument();
    });

    it('shows singular record text for count of 1', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} recordCount={1} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByText('1 record will be exported')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-expanded attribute', () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when open', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has aria-haspopup attribute', () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByTestId('export-button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('dropdown has role menu', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('menu items have role menuitem', async () => {
      const user = userEvent.setup();
      render(<ExportButton {...defaultProps} />);

      await user.click(screen.getByTestId('export-button'));

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });

    it('announces exporting status to screen readers', () => {
      render(<ExportButton {...defaultProps} isExporting />);

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Exporting data...');
    });
  });

  describe('keyboard navigation', () => {
    it('triggers export on Enter key', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(<ExportButton {...defaultProps} onExport={onExport} />);

      await user.click(screen.getByTestId('export-button'));
      const csvOption = screen.getByTestId('export-option-csv');
      csvOption.focus();
      await user.keyboard('{Enter}');

      expect(onExport).toHaveBeenCalledWith('csv');
    });

    it('triggers export on Space key', async () => {
      const user = userEvent.setup();
      const onExport = vi.fn();
      render(<ExportButton {...defaultProps} onExport={onExport} />);

      await user.click(screen.getByTestId('export-button'));
      const jsonOption = screen.getByTestId('export-option-json');
      jsonOption.focus();
      await user.keyboard(' ');

      expect(onExport).toHaveBeenCalledWith('json');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(<ExportButton {...defaultProps} className="custom-export" />);

      const container = screen.getByTestId('export-button').parentElement;
      expect(container).toHaveClass('custom-export');
    });
  });
});
