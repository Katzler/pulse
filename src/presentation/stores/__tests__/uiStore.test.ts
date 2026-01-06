import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useUIStore.getState().setLoading(false);
      useUIStore.getState().clearToasts();
      useUIStore.getState().setSidebarOpen(false);
    });
  });

  describe('initial state', () => {
    it('has isLoading as false', () => {
      expect(useUIStore.getState().isLoading).toBe(false);
    });

    it('has null loadingMessage', () => {
      expect(useUIStore.getState().loadingMessage).toBeNull();
    });

    it('has empty toasts array', () => {
      expect(useUIStore.getState().toasts).toEqual([]);
    });

    it('has sidebarOpen as false', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      act(() => {
        useUIStore.getState().setLoading(true);
      });

      expect(useUIStore.getState().isLoading).toBe(true);
    });

    it('sets loading with message', () => {
      act(() => {
        useUIStore.getState().setLoading(true, 'Loading customers...');
      });

      expect(useUIStore.getState().isLoading).toBe(true);
      expect(useUIStore.getState().loadingMessage).toBe('Loading customers...');
    });

    it('clears message when loading is false', () => {
      act(() => {
        useUIStore.getState().setLoading(true, 'Loading...');
        useUIStore.getState().setLoading(false);
      });

      expect(useUIStore.getState().isLoading).toBe(false);
      expect(useUIStore.getState().loadingMessage).toBeNull();
    });
  });

  describe('toast management', () => {
    describe('addToast', () => {
      it('adds a toast with generated ID', () => {
        act(() => {
          useUIStore.getState().addToast({
            type: 'success',
            title: 'Success!',
            message: 'Operation completed',
          });
        });

        const toasts = useUIStore.getState().toasts;
        expect(toasts).toHaveLength(1);
        expect(toasts[0].id).toMatch(/^toast-/);
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].title).toBe('Success!');
        expect(toasts[0].message).toBe('Operation completed');
      });

      it('defaults dismissible to true', () => {
        act(() => {
          useUIStore.getState().addToast({
            type: 'info',
            title: 'Info',
          });
        });

        expect(useUIStore.getState().toasts[0].dismissible).toBe(true);
      });

      it('respects dismissible setting', () => {
        act(() => {
          useUIStore.getState().addToast({
            type: 'error',
            title: 'Critical Error',
            dismissible: false,
          });
        });

        expect(useUIStore.getState().toasts[0].dismissible).toBe(false);
      });

      it('adds multiple toasts', () => {
        act(() => {
          useUIStore.getState().addToast({ type: 'success', title: 'First' });
          useUIStore.getState().addToast({ type: 'error', title: 'Second' });
          useUIStore.getState().addToast({ type: 'warning', title: 'Third' });
        });

        expect(useUIStore.getState().toasts).toHaveLength(3);
      });
    });

    describe('removeToast', () => {
      it('removes toast by ID', () => {
        act(() => {
          useUIStore.getState().addToast({ type: 'success', title: 'Toast 1' });
          useUIStore.getState().addToast({ type: 'error', title: 'Toast 2' });
        });

        const toastId = useUIStore.getState().toasts[0].id;

        act(() => {
          useUIStore.getState().removeToast(toastId);
        });

        expect(useUIStore.getState().toasts).toHaveLength(1);
        expect(useUIStore.getState().toasts[0].title).toBe('Toast 2');
      });

      it('does nothing for non-existent ID', () => {
        act(() => {
          useUIStore.getState().addToast({ type: 'success', title: 'Toast' });
        });

        act(() => {
          useUIStore.getState().removeToast('non-existent-id');
        });

        expect(useUIStore.getState().toasts).toHaveLength(1);
      });
    });

    describe('clearToasts', () => {
      it('removes all toasts', () => {
        act(() => {
          useUIStore.getState().addToast({ type: 'success', title: 'Toast 1' });
          useUIStore.getState().addToast({ type: 'error', title: 'Toast 2' });
          useUIStore.getState().addToast({ type: 'info', title: 'Toast 3' });
        });

        expect(useUIStore.getState().toasts).toHaveLength(3);

        act(() => {
          useUIStore.getState().clearToasts();
        });

        expect(useUIStore.getState().toasts).toEqual([]);
      });
    });
  });

  describe('sidebar management', () => {
    describe('toggleSidebar', () => {
      it('toggles sidebar state', () => {
        expect(useUIStore.getState().sidebarOpen).toBe(false);

        act(() => {
          useUIStore.getState().toggleSidebar();
        });

        expect(useUIStore.getState().sidebarOpen).toBe(true);

        act(() => {
          useUIStore.getState().toggleSidebar();
        });

        expect(useUIStore.getState().sidebarOpen).toBe(false);
      });
    });

    describe('setSidebarOpen', () => {
      it('sets sidebar to open', () => {
        act(() => {
          useUIStore.getState().setSidebarOpen(true);
        });

        expect(useUIStore.getState().sidebarOpen).toBe(true);
      });

      it('sets sidebar to closed', () => {
        act(() => {
          useUIStore.getState().setSidebarOpen(true);
          useUIStore.getState().setSidebarOpen(false);
        });

        expect(useUIStore.getState().sidebarOpen).toBe(false);
      });
    });
  });
});
