import { useCallback, useEffect, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Key to trigger the shortcut (e.g., 'k', 'Escape', or ['g', 'd'] for sequences) */
  key: string | string[];
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Callback when shortcut is triggered */
  handler: () => void;
  /** Description for help dialog */
  description?: string | undefined;
  /** Category for grouping in help dialog */
  category?: string | undefined;
  /** Whether this shortcut is enabled */
  enabled?: boolean;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Options for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are globally enabled */
  enabled?: boolean;
  /** Element to attach listener to (defaults to document) */
  target?: HTMLElement | Document | null | undefined;
  /** Timeout for key sequences in ms (default: 500) */
  sequenceTimeout?: number;
}

/**
 * Default timeout for key sequences (ms)
 */
const DEFAULT_SEQUENCE_TIMEOUT = 500;

/**
 * Check if the event matches a single-key shortcut
 */
function matchesSingleKeyShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut,
  key: string
): boolean {
  // Check modifier keys
  const ctrlMatch = shortcut.ctrl
    ? event.ctrlKey || event.metaKey
    : !event.ctrlKey && !event.metaKey;
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = shortcut.alt ? event.altKey : !event.altKey;

  // Check main key (case-insensitive)
  const keyMatch = event.key.toLowerCase() === key.toLowerCase();

  return ctrlMatch && shiftMatch && altMatch && keyMatch;
}

/**
 * Check if focus is in an input element
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (activeElement as HTMLElement).isContentEditable
  );
}

/**
 * Hook for managing keyboard shortcuts with support for key sequences
 *
 * @example
 * // Single key shortcuts
 * useKeyboardShortcuts([
 *   { key: 'k', ctrl: true, handler: () => focusSearch(), description: 'Focus search' },
 *   { key: 'Escape', handler: () => closeModal() },
 * ]);
 *
 * @example
 * // Key sequences (e.g., press 'g' then 'd')
 * useKeyboardShortcuts([
 *   { key: ['g', 'd'], handler: () => goToDashboard(), description: 'Go to dashboard' },
 *   { key: ['g', 'c'], handler: () => goToCustomers(), description: 'Go to customers' },
 * ]);
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, target, sequenceTimeout = DEFAULT_SEQUENCE_TIMEOUT } = options;

  // Use ref to always have access to latest shortcuts without re-subscribing
  const shortcutsRef = useRef(shortcuts);

  // Track key sequence state
  const sequenceRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update shortcuts ref in effect to avoid render-time ref access
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Clear sequence after timeout
  const clearSequence = useCallback(() => {
    sequenceRef.current = [];
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (!enabled) return;

      // Skip if in input and no modifier key is pressed
      if (isInputFocused() && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Allow Escape key even in inputs
        if (event.key !== 'Escape') return;
      }

      const currentKey = event.key.toLowerCase();

      // Check for single-key shortcuts first (they take priority)
      for (const shortcut of shortcutsRef.current) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Skip sequence shortcuts in this pass
        if (Array.isArray(shortcut.key)) continue;

        if (matchesSingleKeyShortcut(event, shortcut, shortcut.key)) {
          // Clear any pending sequence
          clearSequence();

          // Prevent default if specified
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          // Execute handler
          shortcut.handler();
          return;
        }
      }

      // Handle key sequences (only for non-modified keys)
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        // Add key to sequence
        sequenceRef.current.push(currentKey);

        // Reset timeout
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
        sequenceTimeoutRef.current = setTimeout(clearSequence, sequenceTimeout);

        // Check for matching sequence shortcuts
        for (const shortcut of shortcutsRef.current) {
          // Skip disabled shortcuts
          if (shortcut.enabled === false) continue;

          // Only check sequence shortcuts
          if (!Array.isArray(shortcut.key)) continue;

          const sequence = shortcut.key.map((k) => k.toLowerCase());

          // Check if current sequence matches
          if (
            sequenceRef.current.length === sequence.length &&
            sequenceRef.current.every((key, index) => key === sequence[index])
          ) {
            // Clear sequence
            clearSequence();

            // Prevent default if specified
            if (shortcut.preventDefault !== false) {
              event.preventDefault();
            }

            // Execute handler
            shortcut.handler();
            return;
          }

          // If current sequence is a prefix of a shortcut sequence, keep waiting
          const isPrefix =
            sequenceRef.current.length < sequence.length &&
            sequenceRef.current.every((key, index) => key === sequence[index]);

          if (isPrefix) {
            // Prevent default to avoid browser shortcuts
            event.preventDefault();
          }
        }

        // If sequence doesn't match any shortcut prefix, clear it
        const matchesAnyPrefix = shortcutsRef.current.some((shortcut) => {
          if (!Array.isArray(shortcut.key)) return false;
          const sequence = shortcut.key.map((k) => k.toLowerCase());
          return (
            sequenceRef.current.length <= sequence.length &&
            sequenceRef.current.every((key, index) => key === sequence[index])
          );
        });

        if (!matchesAnyPrefix) {
          clearSequence();
        }
      }
    },
    [enabled, clearSequence, sequenceTimeout]
  );

  useEffect(() => {
    const targetElement = target ?? document;

    targetElement.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
      // Clear any pending timeout on unmount
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown, target]);
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Detect macOS for modifier display
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Handle key sequences
  if (Array.isArray(shortcut.key)) {
    const formattedKeys = shortcut.key.map((k) => formatKey(k));
    parts.push(formattedKeys.join(' then '));
  } else {
    parts.push(formatKey(shortcut.key));
  }

  return parts.join(isMac ? '' : '+');
}

/**
 * Format a single key for display
 */
function formatKey(key: string): string {
  switch (key.toLowerCase()) {
    case 'escape':
      return 'Esc';
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
    case 'arrowleft':
      return '←';
    case 'arrowright':
      return '→';
    case 'enter':
      return '↵';
    case ' ':
      return 'Space';
    case 'backspace':
      return '⌫';
    case 'tab':
      return 'Tab';
    case '/':
      return '/';
    case '?':
      return '?';
    case '[':
      return '[';
    case ']':
      return ']';
    default:
      return key.toUpperCase();
  }
}

/**
 * Group shortcuts by category
 */
export function groupShortcutsByCategory(
  shortcuts: KeyboardShortcut[]
): Map<string, KeyboardShortcut[]> {
  const groups = new Map<string, KeyboardShortcut[]>();

  for (const shortcut of shortcuts) {
    const category = shortcut.category ?? 'General';
    const existing = groups.get(category) ?? [];
    groups.set(category, [...existing, shortcut]);
  }

  return groups;
}
