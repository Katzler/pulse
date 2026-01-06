import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Toast as ToastType } from '@presentation/stores';

import { Toast } from '../Toast';

describe('Toast', () => {
  const defaultToast: ToastType = {
    id: 'toast-1',
    type: 'success',
    title: 'Success!',
    message: 'Operation completed successfully',
    dismissible: true,
  };

  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnDismiss.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders toast with title', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('renders toast with message', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('renders without message when not provided', () => {
      const toast: ToastType = {
        id: 'toast-1',
        type: 'success',
        title: 'Success!',
        dismissible: true,
      };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('has alert role for accessibility', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('toast types', () => {
    it('renders success toast with correct styling', () => {
      const toast: ToastType = { ...defaultToast, type: 'success' };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
    });

    it('renders error toast with correct styling', () => {
      const toast: ToastType = { ...defaultToast, type: 'error' };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
    });

    it('renders warning toast with correct styling', () => {
      const toast: ToastType = { ...defaultToast, type: 'warning' };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
    });

    it('renders info toast with correct styling', () => {
      const toast: ToastType = { ...defaultToast, type: 'info' };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      expect(screen.getByRole('alert')).toHaveClass('bg-blue-50');
    });
  });

  describe('dismiss functionality', () => {
    it('renders dismiss button when dismissible', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('hides dismiss button when not dismissible', () => {
      const toast: ToastType = { ...defaultToast, dismissible: false };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      // Wait for animation delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnDismiss).toHaveBeenCalledWith('toast-1');
    });
  });

  describe('auto-dismiss', () => {
    it('auto-dismisses after default duration plus animation', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);

      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Duration (5000ms) + animation delay (300ms)
      act(() => {
        vi.advanceTimersByTime(5000 + 300);
      });

      expect(mockOnDismiss).toHaveBeenCalledWith('toast-1');
    });

    it('auto-dismisses after custom duration plus animation', () => {
      const toast: ToastType = { ...defaultToast, duration: 3000 };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Advance to trigger dismiss + animation time
      act(() => {
        vi.advanceTimersByTime(1 + 300);
      });
      expect(mockOnDismiss).toHaveBeenCalledWith('toast-1');
    });

    it('does not auto-dismiss when duration is 0', () => {
      const toast: ToastType = { ...defaultToast, duration: 0 };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('clears timeout on unmount', () => {
      const { unmount } = render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('pause on hover', () => {
    it('pauses auto-dismiss timer on mouse enter', () => {
      // Use a toast with long enough duration to test pausing
      const toast: ToastType = { ...defaultToast, duration: 10000 };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      const alert = screen.getByRole('alert');

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Hover over the toast to pause
      fireEvent.mouseEnter(alert);

      // Advance much more time - should not dismiss because paused
      act(() => {
        vi.advanceTimersByTime(15000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('resumes timer after mouse leave', () => {
      // Use a short duration for faster test
      const toast: ToastType = { ...defaultToast, duration: 1000 };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      const alert = screen.getByRole('alert');

      // Advance 500ms (half the duration)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Hover to pause
      fireEvent.mouseEnter(alert);

      // Advance while paused (should not dismiss)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Leave to resume
      fireEvent.mouseLeave(alert);

      // Advance remaining time (500ms) + animation (300ms)
      act(() => {
        vi.advanceTimersByTime(500 + 300);
      });

      expect(mockOnDismiss).toHaveBeenCalledWith('toast-1');
    });
  });

  describe('keyboard dismiss', () => {
    it('dismisses on Escape key when dismissible', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      const alert = screen.getByRole('alert');

      // Fire Escape keydown
      fireEvent.keyDown(alert, { key: 'Escape' });

      // Advance past animation delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockOnDismiss).toHaveBeenCalledWith('toast-1');
    });

    it('does not dismiss on Escape when not dismissible', () => {
      const toast: ToastType = { ...defaultToast, dismissible: false };
      render(<Toast toast={toast} onDismiss={mockOnDismiss} />);
      const alert = screen.getByRole('alert');

      // Fire Escape keydown
      fireEvent.keyDown(alert, { key: 'Escape' });

      // Advance time to make sure it doesn't fire
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('animation', () => {
    it('starts with initial animation state', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      const alert = screen.getByRole('alert');

      // Initially should have opacity-0 class (before enter animation triggers)
      expect(alert.className).toContain('opacity-0');
    });

    it('applies enter animation after mount', () => {
      render(<Toast toast={defaultToast} onDismiss={mockOnDismiss} />);
      const alert = screen.getByRole('alert');

      // Advance past the animation trigger delay
      act(() => {
        vi.advanceTimersByTime(20);
      });

      expect(alert).toHaveClass('animate-toast-enter');
    });
  });
});
