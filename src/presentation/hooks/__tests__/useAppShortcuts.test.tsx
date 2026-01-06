import { MemoryRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAllShortcutDefinitions, useAppShortcuts } from '../useAppShortcuts';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useAppShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );

  describe('shortcuts', () => {
    it('returns array of shortcuts', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      expect(result.current.shortcuts).toBeDefined();
      expect(Array.isArray(result.current.shortcuts)).toBe(true);
      expect(result.current.shortcuts.length).toBeGreaterThan(0);
    });

    it('includes global shortcuts', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      const globalShortcuts = result.current.shortcuts.filter(
        (s) => s.category === 'Global'
      );
      expect(globalShortcuts.length).toBeGreaterThan(0);
    });

    it('includes navigation shortcuts', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      const navShortcuts = result.current.shortcuts.filter(
        (s) => s.category === 'Navigation'
      );
      expect(navShortcuts.length).toBeGreaterThan(0);
    });

    it('includes customer list shortcuts when callbacks provided', () => {
      const onClearFilters = vi.fn();
      const onExport = vi.fn();
      const { result } = renderHook(
        () => useAppShortcuts({ onClearFilters, onExport }),
        { wrapper }
      );

      const customerListShortcuts = result.current.shortcuts.filter(
        (s) => s.category === 'Customer List'
      );
      expect(customerListShortcuts.length).toBe(2);
    });
  });

  describe('help modal state', () => {
    it('isHelpOpen is initially false', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      expect(result.current.isHelpOpen).toBe(false);
    });

    it('openHelp sets isHelpOpen to true', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      act(() => {
        result.current.openHelp();
      });

      expect(result.current.isHelpOpen).toBe(true);
    });

    it('closeHelp sets isHelpOpen to false', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      act(() => {
        result.current.openHelp();
      });
      act(() => {
        result.current.closeHelp();
      });

      expect(result.current.isHelpOpen).toBe(false);
    });

    it('toggleHelp toggles isHelpOpen', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      expect(result.current.isHelpOpen).toBe(false);

      act(() => {
        result.current.toggleHelp();
      });
      expect(result.current.isHelpOpen).toBe(true);

      act(() => {
        result.current.toggleHelp();
      });
      expect(result.current.isHelpOpen).toBe(false);
    });
  });

  describe('search input ref', () => {
    it('provides a ref for search input', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      expect(result.current.searchInputRef).toBeDefined();
      expect(result.current.searchInputRef.current).toBeNull();
    });
  });

  describe('navigation shortcuts', () => {
    it('go to dashboard shortcut navigates to /', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      const dashboardShortcut = result.current.shortcuts.find(
        (s) => s.description === 'Go to Dashboard'
      );
      expect(dashboardShortcut).toBeDefined();

      dashboardShortcut?.handler();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('go to customers shortcut navigates to /customers', () => {
      const { result } = renderHook(() => useAppShortcuts(), { wrapper });

      const customersShortcut = result.current.shortcuts.find(
        (s) => s.description === 'Go to Customers'
      );
      expect(customersShortcut).toBeDefined();

      customersShortcut?.handler();
      expect(mockNavigate).toHaveBeenCalledWith('/customers');
    });
  });

  describe('customer list shortcuts', () => {
    it('calls onClearFilters when clear filters shortcut is triggered', () => {
      const onClearFilters = vi.fn();
      const { result } = renderHook(() => useAppShortcuts({ onClearFilters }), {
        wrapper,
      });

      const clearShortcut = result.current.shortcuts.find(
        (s) => s.description === 'Clear all filters'
      );
      expect(clearShortcut).toBeDefined();

      clearShortcut?.handler();
      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('calls onExport when export shortcut is triggered', () => {
      const onExport = vi.fn();
      const { result } = renderHook(() => useAppShortcuts({ onExport }), {
        wrapper,
      });

      const exportShortcut = result.current.shortcuts.find(
        (s) => s.description === 'Export data'
      );
      expect(exportShortcut).toBeDefined();

      exportShortcut?.handler();
      expect(onExport).toHaveBeenCalledTimes(1);
    });
  });
});

describe('getAllShortcutDefinitions', () => {
  it('returns all shortcut definitions', () => {
    const definitions = getAllShortcutDefinitions();

    expect(definitions).toBeDefined();
    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions.length).toBeGreaterThan(0);
  });

  it('includes shortcuts from all categories', () => {
    const definitions = getAllShortcutDefinitions();

    const categories = new Set(definitions.map((s) => s.category));
    expect(categories.has('Global')).toBe(true);
    expect(categories.has('Navigation')).toBe(true);
    expect(categories.has('Customer List')).toBe(true);
  });

  it('all shortcuts have descriptions', () => {
    const definitions = getAllShortcutDefinitions();

    definitions.forEach((shortcut) => {
      expect(shortcut.description).toBeDefined();
      expect(shortcut.description).not.toBe('');
    });
  });
});
