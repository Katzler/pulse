import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { KeyboardShortcut } from './useKeyboardShortcuts';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * Application shortcut configuration with all available shortcuts
 */
export interface AppShortcuts {
  /** All configured shortcuts */
  shortcuts: KeyboardShortcut[];
  /** Whether the help modal is open */
  isHelpOpen: boolean;
  /** Open the help modal */
  openHelp: () => void;
  /** Close the help modal */
  closeHelp: () => void;
  /** Toggle the help modal */
  toggleHelp: () => void;
  /** Reference to focus search input */
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Options for useAppShortcuts hook
 */
export interface UseAppShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Callback when clear filters is triggered */
  onClearFilters?: () => void;
  /** Callback when export is triggered */
  onExport?: () => void;
}

/**
 * Hook that provides application-wide keyboard shortcuts.
 * Handles navigation, search focus, help modal, and page-specific actions.
 *
 * @example
 * const { shortcuts, isHelpOpen, closeHelp, searchInputRef } = useAppShortcuts({
 *   onClearFilters: () => resetFilters(),
 *   onExport: () => exportData(),
 * });
 *
 * return (
 *   <>
 *     <input ref={searchInputRef} />
 *     <KeyboardShortcutsHelp isOpen={isHelpOpen} onClose={closeHelp} shortcuts={shortcuts} />
 *   </>
 * );
 */
export function useAppShortcuts(options: UseAppShortcutsOptions = {}): AppShortcuts {
  const { enabled = true, onClearFilters, onExport } = options;

  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const goToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const goToCustomers = useCallback(() => {
    navigate('/customers');
  }, [navigate]);

  const shortcuts = useMemo<KeyboardShortcut[]>(() => {
    // Build shortcuts array using filter to conditionally include items
    const baseShortcuts: KeyboardShortcut[] = [
      // Global shortcuts
      {
        key: '/',
        handler: focusSearch,
        description: 'Focus search',
        category: 'Global',
        preventDefault: true,
      },
      {
        key: '?',
        handler: toggleHelp,
        description: 'Show keyboard shortcuts',
        category: 'Global',
        shift: true, // ? requires shift
      },
      {
        key: 'Escape',
        handler: closeHelp,
        description: 'Close modal / Clear search',
        category: 'Global',
        enabled: isHelpOpen,
      },

      // Navigation shortcuts
      {
        key: ['g', 'd'],
        handler: goToDashboard,
        description: 'Go to Dashboard',
        category: 'Navigation',
      },
      {
        key: ['g', 'c'],
        handler: goToCustomers,
        description: 'Go to Customers',
        category: 'Navigation',
      },
    ];

    // Customer list page shortcuts (conditionally included)
    const conditionalShortcuts: (KeyboardShortcut | null)[] = [
      onClearFilters
        ? {
            key: 'c',
            handler: onClearFilters,
            description: 'Clear all filters',
            category: 'Customer List',
          }
        : null,
      onExport
        ? {
            key: 'e',
            handler: onExport,
            description: 'Export data',
            category: 'Customer List',
          }
        : null,
    ];

    return [
      ...baseShortcuts,
      ...conditionalShortcuts.filter((s): s is KeyboardShortcut => s !== null),
    ];
  }, [
    focusSearch,
    toggleHelp,
    closeHelp,
    goToDashboard,
    goToCustomers,
    onClearFilters,
    onExport,
    isHelpOpen,
  ]);

  // Register shortcuts
  useKeyboardShortcuts(shortcuts, { enabled: enabled && !isHelpOpen });

  return {
    shortcuts,
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    searchInputRef,
  };
}

/**
 * Get all shortcuts for display in help modal
 * (Returns static list without handlers for display purposes)
 */
export function getAllShortcutDefinitions(): KeyboardShortcut[] {
  const noop = () => {};
  return [
    // Global shortcuts
    {
      key: '/',
      handler: noop,
      description: 'Focus search',
      category: 'Global',
    },
    {
      key: '?',
      handler: noop,
      description: 'Show keyboard shortcuts',
      category: 'Global',
    },
    {
      key: 'Escape',
      handler: noop,
      description: 'Close modal / Clear search',
      category: 'Global',
    },

    // Navigation shortcuts
    {
      key: ['g', 'd'],
      handler: noop,
      description: 'Go to Dashboard',
      category: 'Navigation',
    },
    {
      key: ['g', 'c'],
      handler: noop,
      description: 'Go to Customers',
      category: 'Navigation',
    },

    // Customer list shortcuts
    {
      key: 'c',
      handler: noop,
      description: 'Clear all filters',
      category: 'Customer List',
    },
    {
      key: 'e',
      handler: noop,
      description: 'Export data',
      category: 'Customer List',
    },
  ];
}
