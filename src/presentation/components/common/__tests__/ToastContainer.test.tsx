import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUIStore } from '@presentation/stores';

import { ToastContainer } from '../ToastContainer';

// Reset store before each test
beforeEach(() => {
  act(() => {
    useUIStore.getState().clearToasts();
  });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastContainer', () => {
  describe('rendering', () => {
    it('renders nothing when no toasts', () => {
      const { container } = render(<ToastContainer />);
      expect(container.firstChild).toBeNull();
    });

    it('renders toasts from store', () => {
      act(() => {
        useUIStore.getState().addToast({
          type: 'success',
          title: 'Test Toast',
        });
      });

      render(<ToastContainer />);
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('renders multiple toasts', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Toast 1' });
        useUIStore.getState().addToast({ type: 'error', title: 'Toast 2' });
        useUIStore.getState().addToast({ type: 'info', title: 'Toast 3' });
      });

      render(<ToastContainer />);
      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });

    it('has accessible label', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer />);
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });
  });

  describe('position', () => {
    it('renders in top-right by default', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer />);
      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveClass('top-4', 'right-4');
    });

    it('renders in top-left position', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer position="top-left" />);
      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveClass('top-4', 'left-4');
    });

    it('renders in bottom-right position', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer position="bottom-right" />);
      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveClass('bottom-4', 'right-4');
    });

    it('renders in bottom-left position', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer position="bottom-left" />);
      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveClass('bottom-4', 'left-4');
    });

    it('renders in top-center position', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer position="top-center" />);
      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveClass('top-4', 'left-1/2');
    });

    it('renders in bottom-center position', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });

      render(<ToastContainer position="bottom-center" />);
      const container = screen.getByLabelText('Notifications');
      expect(container).toHaveClass('bottom-4', 'left-1/2');
    });
  });

  describe('maxToasts', () => {
    it('limits visible toasts to maxToasts', () => {
      act(() => {
        for (let i = 1; i <= 10; i++) {
          useUIStore.getState().addToast({ type: 'success', title: `Toast ${i}` });
        }
      });

      render(<ToastContainer maxToasts={3} />);

      // Should only show last 3 toasts
      expect(screen.queryByText('Toast 7')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 8')).toBeInTheDocument();
      expect(screen.getByText('Toast 9')).toBeInTheDocument();
      expect(screen.getByText('Toast 10')).toBeInTheDocument();
    });

    it('uses default maxToasts of 5', () => {
      act(() => {
        for (let i = 1; i <= 7; i++) {
          useUIStore.getState().addToast({ type: 'success', title: `Toast ${i}` });
        }
      });

      render(<ToastContainer />);

      // Should only show last 5 toasts
      expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
      expect(screen.getByText('Toast 7')).toBeInTheDocument();
    });
  });

  describe('dismiss integration', () => {
    it('removes toast from store when dismissed', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Dismissible Toast' });
      });

      render(<ToastContainer />);
      expect(screen.getByText('Dismissible Toast')).toBeInTheDocument();

      // Click dismiss button using fireEvent
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      // Wait for animation to complete (300ms)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByText('Dismissible Toast')).not.toBeInTheDocument();
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });
  });
});
