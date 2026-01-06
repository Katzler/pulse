import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the search input container', () => {
      render(<SearchInput {...defaultProps} />);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
      render(<SearchInput {...defaultProps} placeholder="Search customers..." />);

      expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
    });

    it('renders search button', () => {
      render(<SearchInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('renders accessible input with label', () => {
      render(<SearchInput {...defaultProps} />);

      expect(screen.getByLabelText('Search customers')).toBeInTheDocument();
    });
  });

  describe('value handling', () => {
    it('displays current value', () => {
      render(<SearchInput {...defaultProps} value="test search" />);

      expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
    });

    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByLabelText('Search customers');
      await user.type(input, 'a');

      expect(onChange).toHaveBeenCalledWith('a');
    });
  });

  describe('search trigger', () => {
    it('calls onSearch when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<SearchInput {...defaultProps} onSearch={onSearch} />);

      const input = screen.getByLabelText('Search customers');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('calls onSearch when Search button is clicked', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<SearchInput {...defaultProps} onSearch={onSearch} />);

      const button = screen.getByRole('button', { name: /search/i });
      await user.click(button);

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('does not call onSearch on Enter when loading', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      render(<SearchInput {...defaultProps} onSearch={onSearch} isLoading />);

      const input = screen.getByLabelText('Search customers');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe('clear button', () => {
    it('shows clear button when value is present', () => {
      render(<SearchInput {...defaultProps} value="test" />);

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
      render(<SearchInput {...defaultProps} value="" />);

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(<SearchInput {...defaultProps} value="test" onClear={onClear} />);

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading state', () => {
    it('disables input when loading', () => {
      render(<SearchInput {...defaultProps} isLoading />);

      expect(screen.getByLabelText('Search customers')).toBeDisabled();
    });

    it('disables search button when loading', () => {
      render(<SearchInput {...defaultProps} isLoading />);

      expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
    });

    it('shows spinner instead of clear button when loading', () => {
      render(<SearchInput {...defaultProps} value="test" isLoading />);

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('has accessible loading state', () => {
      render(<SearchInput {...defaultProps} isLoading />);

      expect(screen.getByRole('button')).toHaveAccessibleName(/searching/i);
    });
  });

  describe('accessibility', () => {
    it('input has proper role and label', () => {
      render(<SearchInput {...defaultProps} id="custom-search" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-search');
    });

    it('clear button is keyboard accessible', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(<SearchInput {...defaultProps} value="test" onClear={onClear} />);

      const clearButton = screen.getByLabelText('Clear search');
      clearButton.focus();
      await user.keyboard('{Enter}');

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});
