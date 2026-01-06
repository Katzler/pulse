import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { KeyboardShortcut } from '@presentation/hooks';

import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';

describe('KeyboardShortcutsHelp', () => {
  const mockShortcuts: KeyboardShortcut[] = [
    { key: '/', handler: vi.fn(), description: 'Focus search', category: 'Global' },
    { key: 'Escape', handler: vi.fn(), description: 'Close modal', category: 'Global' },
    { key: '?', handler: vi.fn(), description: 'Show shortcuts', category: 'Global' },
    { key: ['g', 'd'], handler: vi.fn(), description: 'Go to dashboard', category: 'Navigation' },
    { key: ['g', 'c'], handler: vi.fn(), description: 'Go to customers', category: 'Navigation' },
    { key: 'j', handler: vi.fn(), description: 'Next row', category: 'Customer List' },
    { key: 'k', handler: vi.fn(), description: 'Previous row', category: 'Customer List' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    shortcuts: mockShortcuts,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByTestId('keyboard-shortcuts-modal')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('keyboard-shortcuts-modal')).not.toBeInTheDocument();
    });

    it('renders default title', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} title="Custom Shortcuts" />);

      expect(screen.getByText('Custom Shortcuts')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByTestId('close-shortcuts-modal')).toBeInTheDocument();
    });
  });

  describe('categories', () => {
    it('renders all categories', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByTestId('category-global')).toBeInTheDocument();
      expect(screen.getByTestId('category-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('category-customer-list')).toBeInTheDocument();
    });

    it('renders Global category first', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      const categories = screen.getAllByRole('heading', { level: 3 });
      expect(categories[0]).toHaveTextContent('Global');
    });
  });

  describe('shortcuts display', () => {
    it('renders shortcut descriptions', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByText('Focus search')).toBeInTheDocument();
      expect(screen.getByText('Close modal')).toBeInTheDocument();
      expect(screen.getByText('Go to dashboard')).toBeInTheDocument();
    });

    it('renders formatted keys', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByText('/')).toBeInTheDocument();
      // There are multiple 'Esc' elements (shortcut + footer hint), use getAllByText
      expect(screen.getAllByText('Esc').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders key sequences', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByText('G then D')).toBeInTheDocument();
      expect(screen.getByText('G then C')).toBeInTheDocument();
    });

    it('does not render shortcuts without descriptions', () => {
      const shortcutsWithMissingDesc: KeyboardShortcut[] = [
        { key: 'x', handler: vi.fn() }, // No description
        { key: 'y', handler: vi.fn(), description: 'Has description', category: 'Test' },
      ];

      render(<KeyboardShortcutsHelp {...defaultProps} shortcuts={shortcutsWithMissingDesc} />);

      expect(screen.getByText('Has description')).toBeInTheDocument();
      expect(screen.queryByText('No description')).not.toBeInTheDocument();
    });
  });

  describe('closing modal', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<KeyboardShortcutsHelp {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByTestId('close-shortcuts-modal'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<KeyboardShortcutsHelp {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByTestId('keyboard-shortcuts-modal'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<KeyboardShortcutsHelp {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Keyboard Shortcuts'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<KeyboardShortcutsHelp {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has correct dialog role', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-shortcuts-title');
      expect(screen.getByText('Keyboard Shortcuts')).toHaveAttribute(
        'id',
        'keyboard-shortcuts-title'
      );
    });

    it('close button has aria-label', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByTestId('close-shortcuts-modal')).toHaveAttribute(
        'aria-label',
        'Close keyboard shortcuts help'
      );
    });
  });

  describe('empty state', () => {
    it('shows message when no shortcuts provided', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} shortcuts={[]} />);

      expect(screen.getByText('No keyboard shortcuts available.')).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('shows escape hint in footer', () => {
      render(<KeyboardShortcutsHelp {...defaultProps} />);

      expect(screen.getByText(/click outside to close/)).toBeInTheDocument();
    });
  });
});
