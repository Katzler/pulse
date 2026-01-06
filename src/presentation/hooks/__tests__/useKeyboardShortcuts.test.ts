import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatShortcut,
  groupShortcutsByCategory,
  type KeyboardShortcut,
  useKeyboardShortcuts,
} from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic shortcuts', () => {
    it('calls handler when shortcut key is pressed', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler }])
      );

      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls correct handler for different keys', () => {
      const handlerK = vi.fn();
      const handlerJ = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([
          { key: 'k', handler: handlerK },
          { key: 'j', handler: handlerJ },
        ])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handlerK).toHaveBeenCalledTimes(1);
      expect(handlerJ).not.toHaveBeenCalled();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
      expect(handlerJ).toHaveBeenCalledTimes(1);
    });

    it('is case-insensitive', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler }])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'K' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('modifier keys', () => {
    it('matches Ctrl+K shortcut', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', ctrl: true, handler }])
      );

      // Without Ctrl
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();

      // With Ctrl
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('matches Meta key (Cmd on Mac) for ctrl shortcuts', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', ctrl: true, handler }])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('matches Shift+K shortcut', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', shift: true, handler }])
      );

      // Without Shift
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();

      // With Shift
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', shiftKey: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('matches Alt+K shortcut', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', alt: true, handler }])
      );

      // Without Alt
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();

      // With Alt
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', altKey: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('matches multiple modifiers', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 's', ctrl: true, shift: true, handler }])
      );

      // Only Ctrl
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      expect(handler).not.toHaveBeenCalled();

      // Both Ctrl and Shift
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('special keys', () => {
    it('handles Escape key', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'Escape', handler }])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles Enter key', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'Enter', handler }])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles arrow keys', () => {
      const handlerUp = vi.fn();
      const handlerDown = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([
          { key: 'ArrowUp', handler: handlerUp },
          { key: 'ArrowDown', handler: handlerDown },
        ])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(handlerUp).toHaveBeenCalledTimes(1);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(handlerDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled option', () => {
    it('does not trigger when enabled is false', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler }], { enabled: false })
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();
    });

    it('triggers when enabled is true', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler }], { enabled: true })
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('shortcut enabled property', () => {
    it('skips disabled shortcuts', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler, enabled: false }])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();
    });

    it('triggers enabled shortcuts', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler, enabled: true }])
      );

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('input focus handling', () => {
    it('does not trigger shortcuts when input is focused (without modifiers)', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler }])
      );

      // Create and focus an input
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('triggers shortcuts with modifiers when input is focused', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', ctrl: true, handler }])
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });

    it('allows Escape key when input is focused', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeyboardShortcuts([{ key: 'Escape', handler }])
      );

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts([{ key: 'k', handler }])
      );

      unmount();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('formatShortcut', () => {
  // Mock navigator.platform for consistent tests
  const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(navigator, 'platform', originalPlatform);
    }
  });

  it('formats simple key', () => {
    const result = formatShortcut({ key: 'k', handler: vi.fn() });
    expect(result).toBe('K');
  });

  it('formats Escape key', () => {
    const result = formatShortcut({ key: 'Escape', handler: vi.fn() });
    expect(result).toBe('Esc');
  });

  it('formats Enter key', () => {
    const result = formatShortcut({ key: 'Enter', handler: vi.fn() });
    expect(result).toBe('↵');
  });

  it('formats arrow keys', () => {
    expect(formatShortcut({ key: 'ArrowUp', handler: vi.fn() })).toBe('↑');
    expect(formatShortcut({ key: 'ArrowDown', handler: vi.fn() })).toBe('↓');
    expect(formatShortcut({ key: 'ArrowLeft', handler: vi.fn() })).toBe('←');
    expect(formatShortcut({ key: 'ArrowRight', handler: vi.fn() })).toBe('→');
  });

  it('formats space key', () => {
    const result = formatShortcut({ key: ' ', handler: vi.fn() });
    expect(result).toBe('Space');
  });
});

describe('groupShortcutsByCategory', () => {
  it('groups shortcuts by category', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'k', handler: vi.fn(), category: 'Search' },
      { key: 'j', handler: vi.fn(), category: 'Navigation' },
      { key: 'l', handler: vi.fn(), category: 'Search' },
    ];

    const groups = groupShortcutsByCategory(shortcuts);

    expect(groups.get('Search')).toHaveLength(2);
    expect(groups.get('Navigation')).toHaveLength(1);
  });

  it('uses General for uncategorized shortcuts', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'k', handler: vi.fn() },
      { key: 'j', handler: vi.fn() },
    ];

    const groups = groupShortcutsByCategory(shortcuts);

    expect(groups.get('General')).toHaveLength(2);
  });

  it('handles mixed categorized and uncategorized', () => {
    const shortcuts: KeyboardShortcut[] = [
      { key: 'k', handler: vi.fn(), category: 'Search' },
      { key: 'j', handler: vi.fn() },
    ];

    const groups = groupShortcutsByCategory(shortcuts);

    expect(groups.get('Search')).toHaveLength(1);
    expect(groups.get('General')).toHaveLength(1);
  });
});

describe('key sequences', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers handler for two-key sequence', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: ['g', 'd'], handler }])
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    expect(handler).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('distinguishes between different sequences starting with same key', () => {
    const handlerGD = vi.fn();
    const handlerGC = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { key: ['g', 'd'], handler: handlerGD },
        { key: ['g', 'c'], handler: handlerGC },
      ])
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(handlerGD).toHaveBeenCalledTimes(1);
    expect(handlerGC).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    expect(handlerGD).toHaveBeenCalledTimes(1);
    expect(handlerGC).toHaveBeenCalledTimes(1);
  });

  it('resets sequence after timeout', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: ['g', 'd'], handler }], { sequenceTimeout: 300 })
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));

    // Wait for timeout
    vi.advanceTimersByTime(500);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('completes sequence within timeout', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: ['g', 'd'], handler }], { sequenceTimeout: 500 })
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));

    // Advance time but stay within timeout
    vi.advanceTimersByTime(300);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clears sequence on non-matching key', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: ['g', 'd'], handler }])
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('single key shortcuts take priority over sequences', () => {
    const singleHandler = vi.fn();
    const sequenceHandler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { key: 'g', handler: singleHandler },
        { key: ['g', 'd'], handler: sequenceHandler },
      ])
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    expect(singleHandler).toHaveBeenCalledTimes(1);
    expect(sequenceHandler).not.toHaveBeenCalled();
  });

  it('does not trigger sequence when modifier keys are pressed', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: ['g', 'd'], handler }])
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles three-key sequence', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: ['g', 'o', 'd'], handler }])
    );

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('formatShortcut with sequences', () => {
  it('formats key sequence', () => {
    const result = formatShortcut({ key: ['g', 'd'], handler: vi.fn() });
    expect(result).toBe('G then D');
  });

  it('formats key sequence with special keys', () => {
    const result = formatShortcut({ key: ['/', 'Escape'], handler: vi.fn() });
    expect(result).toBe('/ then Esc');
  });
});
